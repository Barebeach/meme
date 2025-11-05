import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { startEpisodeIntro, getIsConversationActive } from '../chat.js';
import { startRecording, createRecordingCallbacks, currentEpisode } from '../recording/manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

let broadcastState = {
  isLive: false,
  episodeStarted: false,
  countdown: null,
  startTime: null,
  episodeStartedAt: null,
  isCustomGuest: false,  // Flag: true = custom guest show, false = default Pepe show
  guestData: null        // Custom guest data (only when isCustomGuest = true)
};

export { broadcastState };

/**
 * Upload video configuration
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'public', 'uploads', req.body.type, req.body.characterId);
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${req.body.emotion}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|webm|mov/;
    const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase()) && allowedTypes.test(file.mimetype);
    cb(isValid ? null : new Error('Only video files allowed'), isValid);
  }
});

/**
 * Get broadcast state
 * NOTE: No auto-reset logic here! State only resets when:
 *   1. Episode outro completes (handled in conversation/flow.js)
 *   2. Admin explicitly stops the show (via stop endpoint)
 */
router.get('/broadcast-state', (req, res) => {
  res.json(broadcastState);
});

/**
 * Start the website/broadcast (with countdown)
 * This function MUST be called before exporting the router
 */
let ioInstance, getAudioDurationFunc, recordingCallbacksInstance;

export function setupStartWebsite(io, getAudioDuration, recordingCallbacks) {
  ioInstance = io;
  getAudioDurationFunc = getAudioDuration;
  recordingCallbacksInstance = recordingCallbacks;
}

router.post('/start-website', async (req, res) => {
  if (!ioInstance) {
    return res.status(500).json({ error: 'Server not properly initialized' });
  }
  
  const io = ioInstance;
  const getAudioDuration = getAudioDurationFunc;
  const recordingCallbacks = recordingCallbacksInstance;
  
  // Get podcast duration from request body (in minutes)
  const podcastDuration = req.body?.duration || 5; // Default 5 minutes
  const durationMs = podcastDuration * 60 * 1000; // Convert to milliseconds
  const applicationId = req.body?.applicationId; // Get application ID for custom guest
  
  try {
    // Clear previous guest data first
    const { clearCurrentGuestData } = await import('../ai/guest-prompts.js');
    clearCurrentGuestData();
    
    // TWO-TRACK SYSTEM:
    // Track 1: NO applicationId = DEFAULT PEPE SHOW (Broadcast Control)
    // Track 2: WITH applicationId = CUSTOM GUEST SHOW (Applications → Start NOW)
    
    if (applicationId) {
      // TRACK 2: CUSTOM GUEST SHOW
      console.log(`🎭 CUSTOM GUEST SHOW - Loading application: ${applicationId}`);
      try {
        const applicationsFile = path.join(__dirname, '..', 'applications.json');
        if (fs.existsSync(applicationsFile)) {
          const applications = JSON.parse(fs.readFileSync(applicationsFile, 'utf8'));
          const guestApp = applications.find(app => app.id === applicationId);
          
          if (guestApp) {
            console.log(`✅ Found custom guest: ${guestApp.memeName}`);
            console.log(`   Voice: ${guestApp.voiceType}`);
            console.log(`   Prompt length: ${guestApp.prompt?.length || 0} chars`);
            
            // Set guest data for backend
            const { setCurrentGuestData } = await import('../ai/guest-prompts.js');
            setCurrentGuestData(guestApp);
            
            // Set broadcast state for frontend
            broadcastState.isCustomGuest = true;
            broadcastState.guestData = {
              memeName: guestApp.memeName,
              voiceType: guestApp.voiceType,
              prompt: guestApp.prompt,
              memeImage: guestApp.memeImage,
              additionalInfo: guestApp.additionalInfo
            };
            
            console.log(`🎭 Broadcast state set to CUSTOM GUEST mode`);
          } else {
            console.error(`❌ Application not found: ${applicationId}`);
            throw new Error('Application not found');
          }
        } else {
          console.error(`❌ Applications file not found`);
          throw new Error('Applications file not found');
        }
      } catch (error) {
        console.error('❌ Error loading custom guest:', error);
        throw error;
      }
    } else {
      // TRACK 1: DEFAULT PEPE SHOW
      console.log(`✅ DEFAULT PEPE SHOW - No application ID provided`);
      broadcastState.isCustomGuest = false;
      broadcastState.guestData = null;
      console.log(`🐸 Broadcast state set to DEFAULT PEPE mode`);
    }
    
    broadcastState.isLive = true;
    broadcastState.countdown = 10;
    broadcastState.startTime = new Date().toISOString();
    broadcastState.episodeStarted = false;

    console.log(`🚀 Website started! Beginning 10 second countdown... (${podcastDuration} min podcast)`);
    
    const countdownInterval = setInterval(() => {
      if (broadcastState.countdown > 0) {
        io.emit('countdown', { seconds: broadcastState.countdown });
        console.log(`⏳ Countdown: ${broadcastState.countdown}`);
        broadcastState.countdown--;
      } else {
        clearInterval(countdownInterval);
        broadcastState.countdown = null;
        broadcastState.episodeStarted = true;
        broadcastState.episodeStartedAt = Date.now(); // Track when episode actually started
        io.emit('countdown', { seconds: 0 });
        console.log('🎬 Countdown finished! Starting episode...');
        
        setTimeout(() => {
          if (!currentEpisode.isLive) {
            // Start recording
            startRecording();
            
            // Create recording callbacks
            const callbacks = recordingCallbacksInstance || createRecordingCallbacks(() => {
              broadcastState.isLive = false;
              broadcastState.episodeStarted = false;
              broadcastState.countdown = null;
              broadcastState.episodeStartedAt = null;
            });
            
            currentEpisode.isLive = true;
            startEpisodeIntro(io, getAudioDuration, callbacks, broadcastState, durationMs);
          }
        }, 1000);
      }
    }, 1000);

    res.json({ success: true, message: 'Countdown started!' });
  } catch (error) {
    console.error('❌ Error starting website:', error);
    res.status(500).json({ error: 'Failed to start website', details: error.message });
  }
});

/**
 * Stop the website/broadcast manually
 */
router.post('/stop-website', async (req, res) => {
  try {
    console.log('🛑 Admin manually stopped the show');
    broadcastState.isLive = false;
    broadcastState.episodeStarted = false;
    broadcastState.countdown = null;
    broadcastState.episodeStartedAt = null;
    broadcastState.isCustomGuest = false;
    broadcastState.guestData = null;
    
    // CLEAR guest data when show ends
    const { clearCurrentGuestData } = await import('../ai/guest-prompts.js');
    clearCurrentGuestData();
    console.log('🗑️ Broadcast state cleared - reset to default mode');
    
    if (ioInstance) {
      ioInstance.emit('episode_ended', { reason: 'Admin stopped the show' });
    }
    
    res.json({ success: true, message: 'Show stopped!' });
  } catch (error) {
    console.error('❌ Error stopping website:', error);
    res.status(500).json({ error: 'Failed to stop website', details: error.message });
  }
});

/**
 * Schedule routes (placeholder)
 */
router.get('/schedule', (req, res) => {
  res.json([]);
});

router.post('/schedule', (req, res) => {
  res.json({ success: true });
});

router.delete('/schedule/:id', (req, res) => {
  res.json({ success: true });
});

/**
 * Episodes routes
 */
router.get('/episodes', (req, res) => {
  const episodesFile = path.join(__dirname, '..', 'episodes.json');
  
  if (fs.existsSync(episodesFile)) {
    const episodes = JSON.parse(fs.readFileSync(episodesFile, 'utf8'));
    res.json(episodes);
  } else {
    res.json([]);
  }
});

router.delete('/episodes/:id', (req, res) => {
  res.json({ success: true });
});

/**
 * Upload video
 */
router.post('/upload-video', upload.single('video'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }
    
    console.log(`✅ Video uploaded: ${req.body.type}/${req.body.characterId}/${req.body.emotion}`);
    res.json({ 
      success: true, 
      message: 'Video uploaded successfully',
      path: `/uploads/${req.body.type}/${req.body.characterId}/${req.body.emotion}${path.extname(req.file.originalname)}`
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

