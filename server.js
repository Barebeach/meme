import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';

// Import chat/conversation modules
import { setupChatHandlers, questions } from './chat.js';
import { startEpisodeIntro } from './chat.js';
import { generateSpeech } from './chat.js';

// Import routes
import videoRoutes from './routes/videos.js';
import adminRoutes, { setupStartWebsite, broadcastState } from './routes/admin.js';
import applicationsRoutes from './routes/applications.js';

// Import recording modules
import { createRecordingCallbacks, startRecording, currentEpisode, handleChatMessageRecording } from './recording/manager.js';
import { getAudioDuration } from './recording/ffmpeg.js';
import { downloadCharacterVideos, characterVideosExist } from './recording/download-videos.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// FFmpeg setup
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);
console.log('✅ FFmpeg path:', ffmpegInstaller.path);
console.log('✅ FFprobe path:', ffprobeInstaller.path);

// Express & Socket.IO setup
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { 
    origin: process.env.NODE_ENV === 'production' 
      ? ["https://memetalk.tv", "https://www.memetalk.tv"] 
      : "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e6,
  allowUpgrades: true,
  perMessageDeflate: false,
  httpCompression: false
});

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ["https://memetalk.tv", "https://www.memetalk.tv"]
    : ["http://localhost:5173", "http://localhost:3001"],
  credentials: true
}));
app.use(express.json());

// Setup Socket.IO handlers
setupChatHandlers(io);

io.engine.on("connection_error", (err) => {
  console.error('❌ Socket.IO Connection Error:', err);
});

io.on('connection', (socket) => {
  console.log(`✅ Socket.IO Client Connected: ${socket.id}`);
  
  socket.on('disconnect', (reason) => {
    console.log(`❌ Socket.IO Client Disconnected: ${socket.id}`);
  });
  
  socket.conn.on('upgrade', (transport) => {
    console.log(`🔄 Socket.IO Transport Upgraded: ${socket.id} to ${transport.name}`);
  });
});

// Recording callbacks
const onBroadcastStop = () => {
  broadcastState.isLive = false;
  broadcastState.episodeStarted = false;
};

const recordingCallbacks = createRecordingCallbacks(onBroadcastStop);
handleChatMessageRecording(io);

// API Routes
app.get('/api/questions', (req, res) => {
  res.json(questions);
});

app.use('/api/videos', videoRoutes);

// Setup admin start-website route BEFORE registering adminRoutes
setupStartWebsite(io, getAudioDuration, recordingCallbacks);
app.use('/api/admin', adminRoutes);
app.use('/api', applicationsRoutes);

// Episodes route (public)
app.get('/api/episodes', (req, res) => {
  const episodesFile = path.join(__dirname, 'episodes.json');
  
  if (fs.existsSync(episodesFile)) {
    const episodes = JSON.parse(fs.readFileSync(episodesFile, 'utf8'));
    res.json(episodes);
  } else {
    res.json([]);
  }
});

// Generate audio endpoint
app.post('/api/generate-audio', async (req, res) => {
  try {
    const { text, voice = 'onyx' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    console.log(`🎤 Generating audio: voice=${voice}`);
    
    const result = await generateSpeech(text, voice);
    
    if (!result || !result.buffer) {
      throw new Error('Failed to generate audio');
    }
    
    res.set('Content-Type', 'audio/mpeg');
    res.send(result.buffer);
  } catch (error) {
    console.error('❌ Error generating audio:', error);
    res.status(500).json({ error: 'Failed to generate audio', details: error.message });
  }
});

// Start episode endpoint
app.post('/api/start-episode', async (req, res) => {
  currentEpisode.isLive = true;
  const success = await startEpisodeIntro(io, getAudioDuration, recordingCallbacks, broadcastState);
  if (success !== false) {
    res.json({ success: true, message: 'Episode started!' });
          } else {
    res.status(400).json({ success: false, message: 'Could not start episode' });
  }
});

// Video recording endpoints (for frontend recording)
let videoRecordingChunks = [];
let isVideoRecording = false;
let currentVideoFilename = '';

app.post('/api/recording/start', (req, res) => {
  videoRecordingChunks = [];
  isVideoRecording = true;
  currentVideoFilename = `episode-recording-${Date.now()}.webm`;
  console.log('🎥 VIDEO RECORDING STARTED:', currentVideoFilename);
  res.json({ success: true, filename: currentVideoFilename });
});

app.post('/api/recording/chunk', express.raw({ type: 'application/octet-stream', limit: '100mb' }), (req, res) => {
  if (!isVideoRecording) {
    return res.status(400).json({ error: 'No active recording' });
  }
  
  videoRecordingChunks.push(req.body);
  console.log(`📦 Received chunk ${videoRecordingChunks.length}`);
  res.json({ success: true, chunkNumber: videoRecordingChunks.length });
});

app.post('/api/recording/stop', async (req, res) => {
  if (!isVideoRecording) {
    return res.status(400).json({ error: 'No active recording' });
  }
  
  isVideoRecording = false;
  
  try {
    const recordingsDir = path.join(__dirname, 'recordings');
    if (!fs.existsSync(recordingsDir)) {
      fs.mkdirSync(recordingsDir, { recursive: true });
    }
    
    const videoPath = path.join(recordingsDir, currentVideoFilename);
    const writeStream = fs.createWriteStream(videoPath);
    
    for (const chunk of videoRecordingChunks) {
      writeStream.write(chunk);
    }
    
    writeStream.end();
    
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
    
    const totalSize = videoRecordingChunks.reduce((acc, chunk) => acc + chunk.length, 0);
    console.log(`💾 VIDEO SAVED: ${currentVideoFilename} (${(totalSize / 1024 / 1024).toFixed(2)} MB)`);
    
    videoRecordingChunks = [];
    
    res.json({ 
      success: true, 
      filename: currentVideoFilename,
      size: totalSize
    });
  } catch (error) {
    console.error('Error saving video:', error);
    res.status(500).json({ error: 'Failed to save video' });
  }
});

// Static file serving (always needed for uploads, videos, etc)
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/episodes', express.static(path.join(__dirname, 'public/episodes')));
app.use('/temp', express.static(path.join(__dirname, 'temp')));
app.use(express.static(path.join(__dirname, 'public')));

// Serve frontend (production only)
// In development, use Vite dev server on port 5173
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    console.log('✅ Serving frontend from dist folder (PRODUCTION)');
  } else {
    console.log('⚠️ No dist folder found, run: npm run build');
  }

  // SPA fallback for production
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      const indexPath = path.join(__dirname, 'dist', 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Frontend not built. Run: npm run build');
      }
    } else {
      next();
    }
  });
} else {
  console.log('💡 DEVELOPMENT MODE: Use frontend at http://localhost:5173');
  console.log('💡 This port (3001) is for API endpoints only');
}

// Download character videos from R2 on startup (for FFmpeg recording)
async function initializeServer() {
  // Check if videos exist, download if not
  if (!characterVideosExist()) {
    console.log('📥 Downloading character videos from R2...');
    await downloadCharacterVideos();
  }
  
  // Start server (use PORT from Railway in production, 3001 in dev)
  const PORT = process.env.PORT || 3001;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 BACKEND API SERVER: http://localhost:${PORT}`);
    console.log(`🎙️ Mr Cock is ready to host!`);
    console.log(`🐸 Pepe is ready to be interviewed!`);
    console.log(`🎥 Episode recording: ENABLED`);
    console.log(`☁️  R2 upload: ${process.env.R2_ACCESS_KEY_ID ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n💡 FOR DEVELOPMENT:`);
      console.log(`   Frontend (with hot reload): http://localhost:5173`);
      console.log(`   Backend API: http://localhost:${PORT}`);
    }
    console.log(`${'='.repeat(60)}\n`);
  });
}

// Initialize server with video download
initializeServer().catch(err => {
  console.error('❌ Failed to initialize server:', err);
  process.exit(1);
});
