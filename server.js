import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';

// Import chat system
import {
  questions,
  connectedUsers,
  setupChatHandlers,
  startEpisodeIntro,
  getValidEmotion
} from './chat.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

console.log('✅ FFmpeg path:', ffmpegInstaller.path);
console.log('✅ FFprobe path:', ffprobeInstaller.path);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { 
    origin: process.env.NODE_ENV === 'production' ? true : "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/episodes', express.static(path.join(__dirname, 'public/episodes')));

// Serve frontend build if it exists
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  console.log('✅ Serving frontend from dist folder');
} else {
  console.log('⚠️ No dist folder found, frontend not available');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'public', 'uploads', req.body.type, req.body.characterId);
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

// Setup chat handlers from chat module
setupChatHandlers(io);

// Listen for chat messages to add to recording
io.on('chat_message_recorded', (userMsg) => {
  if (isRecording) {
    currentRecording.chat.push(userMsg);
  }
});

app.get('/api/questions', (req, res) => {
  res.json(questions);
});

let broadcastState = {
  isLive: false,
  episodeStarted: false,
  countdown: null,
  startTime: null
};

app.get('/api/admin/broadcast-state', (req, res) => {
  res.json(broadcastState);
});

app.post('/api/admin/start-website', async (req, res) => {
  broadcastState.isLive = true;
  broadcastState.countdown = 90;
  broadcastState.startTime = new Date().toISOString();
  broadcastState.episodeStarted = false;

  console.log('🚀 Website started! Beginning 90 second countdown...');
  
  const countdownInterval = setInterval(() => {
    if (broadcastState.countdown > 0) {
      io.emit('countdown', { seconds: broadcastState.countdown });
      console.log(`⏳ Countdown: ${broadcastState.countdown}`);
      broadcastState.countdown--;
    } else {
      clearInterval(countdownInterval);
      broadcastState.countdown = null;
      broadcastState.episodeStarted = true;
      io.emit('countdown', { seconds: 0 });
      console.log('🎬 Countdown finished! Starting episode...');
      
      setTimeout(() => {
        if (!currentEpisode.isLive) {
          startRecording();
          currentEpisode.isLive = true;
          startEpisodeIntro(io, getAudioDuration, recordingCallbacks, broadcastState);
        }
      }, 1000);
    }
  }, 1000);

  res.json({ success: true, message: 'Countdown started!' });
});

app.get('/api/admin/schedule', (req, res) => {
  res.json([]);
});

app.post('/api/admin/schedule', (req, res) => {
  res.json({ success: true });
});

app.delete('/api/admin/schedule/:id', (req, res) => {
  res.json({ success: true });
});

app.get('/api/episodes', (req, res) => {
  const episodesFile = path.join(__dirname, 'episodes.json');
  
  if (fs.existsSync(episodesFile)) {
    const episodes = JSON.parse(fs.readFileSync(episodesFile, 'utf8'));
    res.json(episodes);
  } else {
    res.json([]);
  }
});

app.get('/api/admin/episodes', (req, res) => {
  const episodesFile = path.join(__dirname, 'episodes.json');
  
  if (fs.existsSync(episodesFile)) {
    const episodes = JSON.parse(fs.readFileSync(episodesFile, 'utf8'));
    res.json(episodes);
  } else {
    res.json([]);
  }
});

app.delete('/api/admin/episodes/:id', (req, res) => {
  res.json({ success: true });
});

app.post('/api/admin/upload-video', upload.single('video'), (req, res) => {
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

app.get('/api/videos/hosts/:id', (req, res) => {
  const characterId = req.params.id;
  const videoPath = path.join(__dirname, 'public', 'uploads', 'hosts', characterId);
  
  const videos = {};
  if (fs.existsSync(videoPath)) {
    const files = fs.readdirSync(videoPath);
    files.forEach(file => {
      const emotion = path.parse(file).name;
      videos[emotion] = `/uploads/hosts/${characterId}/${file}`;
    });
  }
  
  res.json(videos);
});

app.get('/api/videos/guests/:id', (req, res) => {
  const characterId = req.params.id;
  const videoPath = path.join(__dirname, 'public', 'uploads', 'guests', characterId);
  
  const videos = {};
  if (fs.existsSync(videoPath)) {
    const files = fs.readdirSync(videoPath);
    files.forEach(file => {
      const emotion = path.parse(file).name;
      videos[emotion] = `/uploads/guests/${characterId}/${file}`;
    });
  }
  
  res.json(videos);
});

let currentRecording = {
  episodeNumber: 1,
  startTime: null,
  endTime: null,
  dialogue: [],
  chat: [],
  videoSegments: [],
  audioFiles: [],
  metadata: {
    title: '',
    guest: 'Pepe',
    host: 'Mr Cock',
    description: '',
    views: 0
  }
};
let isRecording = false;
let recordingDir = null;

// Recording callbacks for chat module
const recordingCallbacks = {
  isRecording: () => isRecording,
  getRecordingDir: () => recordingDir,
  onAudioSaved: (audioFilename, segmentData) => {
    currentRecording.audioFiles.push(audioFilename);
    
    let videoClip = null;
    if (segmentData.speaker === 'Mr Cock') {
      videoClip = path.join(__dirname, 'public', 'uploads', 'hosts', 'mrcock', `${segmentData.emotion}.mp4`);
      if (!fs.existsSync(videoClip)) {
        console.log(`⚠️ ${segmentData.emotion}.mp4 not found, using normal.mp4`);
        videoClip = path.join(__dirname, 'public', 'uploads', 'hosts', 'mrcock', 'normal.mp4');
      }
    } else if (segmentData.speaker === 'Pepe') {
      videoClip = path.join(__dirname, 'public', 'uploads', 'guests', 'pepe', `${segmentData.emotion}.mp4`);
      if (!fs.existsSync(videoClip)) {
        console.log(`⚠️ ${segmentData.emotion}.mp4 not found, using normal.mp4`);
        videoClip = path.join(__dirname, 'public', 'uploads', 'guests', 'pepe', 'normal.mp4');
      }
    }
    
    if (!videoClip || !fs.existsSync(videoClip)) {
      console.error(`❌ ERROR: No video clip found for ${segmentData.speaker}!`);
      console.error(`   Expected path: ${videoClip}`);
    } else {
      const segment = {
        speaker: segmentData.speaker,
        emotion: segmentData.emotion,
        audioFile: audioFilename,
        videoClip,
        text: segmentData.text,
        emotionSegments: segmentData.emotionSegments || null
      };
      
      if (segmentData.questionData) {
        segment.questionText = segmentData.questionData.question;
        segment.questionUsername = segmentData.questionData.username;
        console.log(`📝 Adding question overlay: "${segmentData.questionData.question}" - ${segmentData.questionData.username}`);
      }
      
      currentRecording.videoSegments.push(segment);
      const emotionCount = segmentData.emotionSegments ? segmentData.emotionSegments.length : 1;
      console.log(`✅ Segment recorded: ${segmentData.speaker} (${emotionCount} emotions) - ${currentRecording.videoSegments.length} total`);
    }
  },
  addDialogue: (dialogue) => {
    currentRecording.dialogue.push(dialogue);
  },
  onEpisodeEnd: () => {
    currentEpisode.isLive = false;
    broadcastState.isLive = false;
    broadcastState.episodeStarted = false;
    saveRecording();
  }
};

function startRecording() {
  isRecording = true;
  
  recordingDir = path.join(__dirname, 'temp', `episode-${currentRecording.episodeNumber}-${Date.now()}`);
  if (!fs.existsSync(recordingDir)) {
    fs.mkdirSync(recordingDir, { recursive: true });
  }
  
  currentRecording = {
    episodeNumber: currentRecording.episodeNumber,
    startTime: new Date().toISOString(),
    endTime: null,
    dialogue: [],
    chat: [],
    videoSegments: [],
    audioFiles: [],
    metadata: {
      guest: 'Pepe',
      host: 'Mr Cock',
      totalViewers: connectedUsers.size
    }
  };
  console.log('🔴 RECORDING STARTED - Episode', currentRecording.episodeNumber);
  console.log('📁 Temp directory:', recordingDir);
}

async function saveRecording() {
  if (!isRecording) {
    console.log('⚠️ saveRecording called but not recording');
    return;
  }
  
  console.log('\n📊 ===== RECORDING SUMMARY =====');
  console.log(`   Video segments: ${currentRecording.videoSegments.length}`);
  console.log(`   Audio files: ${currentRecording.audioFiles.length}`);
  console.log(`   Dialogue lines: ${currentRecording.dialogue.length}`);
  console.log(`   Chat messages: ${currentRecording.chat.length}`);
  console.log(`   Recording dir: ${recordingDir}`);
  
  if (currentRecording.videoSegments.length === 0) {
    console.error('❌ CRITICAL: No video segments recorded!');
    console.error('   This episode will NOT have a video file.');
    console.error('   Check if TTS was working and speaker parameter was passed.');
  }
  
  if (!recordingDir || !fs.existsSync(recordingDir)) {
    console.error('❌ CRITICAL: Recording directory missing!');
    console.error('   Video creation will fail.');
  }
  
  isRecording = false;
  currentRecording.endTime = new Date().toISOString();
  
  const timestamp = Date.now();
  const filename = `episode-${currentRecording.episodeNumber}-${timestamp}.json`;
  const filepath = path.join(__dirname, 'recordings', filename);
  
  const recordingsDir = path.join(__dirname, 'recordings');
  if (!fs.existsSync(recordingsDir)) {
    fs.mkdirSync(recordingsDir, { recursive: true });
  }
  
  currentRecording.metadata = {
    title: `Episode ${currentRecording.episodeNumber}: ${currentRecording.metadata.guest}`,
    guest: currentRecording.metadata.guest,
    host: currentRecording.metadata.host,
    description: `${currentRecording.metadata.guest} joins ${currentRecording.metadata.host} for an unfiltered meme interview`,
    views: 0,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    duration: '5:00',
    videoFile: `episode-${currentRecording.episodeNumber}-${timestamp}.mp4`,
    thumbnail: '/memetalk.tv.png'
  };
  
  fs.writeFileSync(filepath, JSON.stringify(currentRecording, null, 2));
  console.log(`💾 Recording saved: ${filename}`);
  console.log(`   📊 Total dialogue: ${currentRecording.dialogue.length}`);
  console.log(`   💬 Total chat: ${currentRecording.chat.length}`);
  
  createEpisodeVideo(currentRecording, timestamp).catch(err => {
    console.error('❌ VIDEO CREATION FAILED:', err);
    console.error('   Check FFmpeg installation and paths');
  });
  
  currentRecording.episodeNumber++;
}

async function addToEpisodesDatabase(recording) {
  const episodesFile = path.join(__dirname, 'episodes.json');
  let episodes = [];
  
  if (fs.existsSync(episodesFile)) {
    episodes = JSON.parse(fs.readFileSync(episodesFile, 'utf8'));
  }
  
  episodes.unshift({
    number: recording.episodeNumber,
    ...recording.metadata,
    recordedAt: recording.endTime
  });
  
  fs.writeFileSync(episodesFile, JSON.stringify(episodes, null, 2));
  console.log(`📚 Added Episode ${recording.episodeNumber} to database`);
}

async function createEpisodeVideo(recording, timestamp) {
  console.log(`🎬 Starting REAL video creation for Episode ${recording.episodeNumber}...`);
  
  try {
    if (!recording) {
      console.error('❌ ERROR: No recording data provided!');
      return;
    }
    
    if (!recordingDir || !fs.existsSync(recordingDir)) {
      console.error('❌ ERROR: Recording directory is missing or invalid!');
      console.error('   Expected:', recordingDir);
      return;
    }
    
    const episodesDir = path.join(__dirname, 'public', 'episodes');
    if (!fs.existsSync(episodesDir)) {
      fs.mkdirSync(episodesDir, { recursive: true });
    }
    
    const outputPath = path.join(episodesDir, `episode-${recording.episodeNumber}-${timestamp}.mp4`);
    
    if (!recording.videoSegments || recording.videoSegments.length === 0) {
      console.error('❌ ERROR: No video segments recorded!');
      console.error('   This means TTS audio was not saved during the episode.');
      console.error('   Check if generateSpeech() is being called with correct parameters.');
      return;
    }
    
    console.log(`✅ Recording directory: ${recordingDir}`);
    console.log(`✅ Output path: ${outputPath}`);
    
    console.log(`📊 Composing ${recording.videoSegments.length} segments...`);
    
    const concatFilePath = path.join(recordingDir, 'concat.txt');
    const segmentPaths = [];
    
    for (let i = 0; i < recording.videoSegments.length; i++) {
      const segment = recording.videoSegments[i];
      const segmentOutputPath = path.join(recordingDir, `segment-${i}.mp4`);
      
      const audioPath = path.join(recordingDir, segment.audioFile);
      if (!fs.existsSync(audioPath)) {
        console.log(`⚠️ Skipping segment ${i}: audio file not found`);
        continue;
      }
      
      const audioDuration = await getAudioDuration(audioPath);
      
      if (segment.emotionSegments && segment.emotionSegments.length > 1) {
        console.log(`🎬 Creating ${segment.emotionSegments.length} emotion sub-segments for segment ${i}...`);
        
        const subSegmentPaths = [];
        for (let j = 0; j < segment.emotionSegments.length; j++) {
          const emotionSeg = segment.emotionSegments[j];
          const subSegmentPath = path.join(recordingDir, `segment-${i}-emotion-${j}.mp4`);
          
          const characterId = segment.speaker === 'Mr Cock' ? 'mrcock' : segment.speaker === 'Pepe' ? 'pepe' : null;
          const validEmotion = characterId ? getValidEmotion(emotionSeg.emotion, characterId) : emotionSeg.emotion;
          
          let videoClip = null;
          if (segment.speaker === 'Mr Cock') {
            videoClip = path.join(__dirname, 'public', 'uploads', 'hosts', 'mrcock', `${validEmotion}.mp4`);
            if (!fs.existsSync(videoClip)) {
              videoClip = path.join(__dirname, 'public', 'uploads', 'hosts', 'mrcock', 'normal.mp4');
            }
          } else if (segment.speaker === 'Pepe') {
            videoClip = path.join(__dirname, 'public', 'uploads', 'guests', 'pepe', `${validEmotion}.mp4`);
            if (!fs.existsSync(videoClip)) {
              videoClip = path.join(__dirname, 'public', 'uploads', 'guests', 'pepe', 'normal.mp4');
            }
          }
          
          if (!videoClip || !fs.existsSync(videoClip)) {
            console.log(`⚠️ Video not found for emotion ${emotionSeg.emotion}, skipping`);
            continue;
          }
          
          const emotionDuration = (emotionSeg.duration / 1000).toFixed(3);
          
          await new Promise((resolve, reject) => {
            ffmpeg()
              .input(videoClip)
              .inputOptions(['-stream_loop', '-1'])
              .outputOptions(['-t', emotionDuration, '-c:v', 'libx264', '-an', '-y'])
              .output(subSegmentPath)
              .on('end', () => {
                console.log(`  ✅ Emotion ${j+1}/${segment.emotionSegments.length}: ${emotionSeg.emotion} (${emotionDuration}s)`);
                subSegmentPaths.push(subSegmentPath);
                resolve();
              })
              .on('error', (err) => {
                console.error(`  ❌ Error creating emotion sub-segment:`, err.message);
                reject(err);
              })
              .run();
          });
        }
        
        if (subSegmentPaths.length === 0) {
          console.log(`⚠️ No emotion sub-segments created for segment ${i}`);
          continue;
        }
        
        const emotionConcatFile = path.join(recordingDir, `segment-${i}-emotions.txt`);
        const emotionConcatContent = subSegmentPaths.map(p => `file '${p}'`).join('\n');
        fs.writeFileSync(emotionConcatFile, emotionConcatContent);
        
        const emotionVideoPath = path.join(recordingDir, `segment-${i}-video.mp4`);
        await new Promise((resolve, reject) => {
          ffmpeg()
            .input(emotionConcatFile)
            .inputOptions(['-f', 'concat', '-safe', '0'])
            .outputOptions(['-c', 'copy'])
            .output(emotionVideoPath)
            .on('end', () => {
              console.log(`  🔗 All emotions concatenated for segment ${i}`);
              resolve();
            })
            .on('error', (err) => {
              console.error(`  ❌ Error concatenating emotions:`, err.message);
              reject(err);
            })
            .run();
        });
        
        const command = ffmpeg()
          .input(emotionVideoPath)
          .input(audioPath);
        
        if (segment.questionText && segment.questionUsername) {
          const escapedQuestion = segment.questionText.replace(/'/g, "'\\\\\\''").replace(/:/g, '\\:');
          const escapedUsername = segment.questionUsername.replace(/'/g, "'\\\\\\''").replace(/:/g, '\\:');
          
          command.videoFilters([
            {
              filter: 'drawtext',
              options: {
                text: escapedQuestion,
                fontsize: 24,
                fontcolor: 'white',
                bordercolor: 'black',
                borderw: 3,
                x: '(w-text_w)/2',
                y: 'h-140',
                box: 1,
                boxcolor: 'black@0.85',
                boxborderw: 20,
                shadowcolor: 'black',
                shadowx: 3,
                shadowy: 3
              }
            },
            {
              filter: 'drawtext',
              options: {
                text: `— ${escapedUsername}`,
                fontsize: 18,
                fontcolor: '0xA855F7',
                bordercolor: 'black',
                borderw: 2,
                x: '(w-text_w)/2',
                y: 'h-90',
                box: 1,
                boxcolor: 'black@0.85',
                boxborderw: 15,
                shadowcolor: 'black',
                shadowx: 3,
                shadowy: 3
              }
            }
          ]);
        }
        
        await new Promise((resolve, reject) => {
          command
            .outputOptions(['-t', audioDuration.toString(), '-c:v', 'libx264', '-c:a', 'aac', '-shortest', '-y'])
            .output(segmentOutputPath)
            .on('end', () => {
              console.log(`✅ Segment ${i} created with ${segment.emotionSegments.length} emotion switches${segment.questionText ? ' + question overlay' : ''}!`);
              segmentPaths.push(segmentOutputPath);
              resolve();
            })
            .on('error', (err) => {
              console.error(`Error creating final segment ${i}:`, err.message);
              reject(err);
            })
            .run();
        });
        
        continue;
      }
      
      if (!segment.videoClip || !fs.existsSync(segment.videoClip)) {
        console.log(`⚠️ Skipping segment ${i}: video clip not found`);
        continue;
      }
      
      const command = ffmpeg()
        .input(segment.videoClip)
        .inputOptions(['-stream_loop', '-1'])
        .input(audioPath);
      
      if (segment.questionText && segment.questionUsername) {
        const escapedQuestion = segment.questionText.replace(/'/g, "'\\\\\\''").replace(/:/g, '\\:');
        const escapedUsername = segment.questionUsername.replace(/'/g, "'\\\\\\''").replace(/:/g, '\\:');
        
        command.videoFilters([
          {
            filter: 'drawtext',
            options: {
              text: escapedQuestion,
              fontsize: 24,
              fontcolor: 'white',
              bordercolor: 'black',
              borderw: 3,
              x: '(w-text_w)/2',
              y: 'h-140',
              box: 1,
              boxcolor: 'black@0.85',
              boxborderw: 20,
              shadowcolor: 'black',
              shadowx: 3,
              shadowy: 3
            }
          },
          {
            filter: 'drawtext',
            options: {
              text: `— ${escapedUsername}`,
              fontsize: 18,
              fontcolor: '0xA855F7',
              bordercolor: 'black',
              borderw: 2,
              x: '(w-text_w)/2',
              y: 'h-90',
              box: 1,
              boxcolor: 'black@0.85',
              boxborderw: 15,
              shadowcolor: 'black',
              shadowx: 3,
              shadowy: 3
            }
          }
        ]);
      }
      
      await new Promise((resolve, reject) => {
        command
          .outputOptions(['-t', audioDuration.toString(), '-c:v', 'libx264', '-c:a', 'aac', '-shortest', '-y'])
          .output(segmentOutputPath)
          .on('end', () => {
            console.log(`✅ Segment ${i} created${segment.questionText ? ' (with question overlay)' : ''}`);
            segmentPaths.push(segmentOutputPath);
            resolve();
          })
          .on('error', (err) => {
            console.error(`Error creating segment ${i}:`, err.message);
            reject(err);
          })
          .run();
      });
    }
    
    if (segmentPaths.length === 0) {
      console.log('❌ No valid segments created');
      return;
    }
    
    const concatContent = segmentPaths.map(p => `file '${p}'`).join('\n');
    fs.writeFileSync(concatFilePath, concatContent);
    
    console.log(`🔗 Concatenating ${segmentPaths.length} segments...`);
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(concatFilePath)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions(['-c', 'copy'])
        .output(outputPath)
        .on('end', async () => {
          console.log(`✅ FINAL VIDEO CREATED: ${outputPath}`);
          console.log(`📊 File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
          
          await addToEpisodesDatabase(recording);
          
          try {
            fs.rmSync(recordingDir, { recursive: true, force: true });
            console.log('🗑️ Temp directory cleaned up');
          } catch (err) {
            console.error('Error cleaning temp dir:', err);
          }
          
          resolve();
        })
        .on('error', (err) => {
          console.error('Error concatenating segments:', err.message);
          reject(err);
        })
        .run();
    });
    
  } catch (error) {
    console.error('Error creating video:', error);
  }
}

async function getAudioDuration(audioPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        resolve(metadata.format.duration || 3);
      }
    });
  });
}

let currentEpisode = {
  guest: 'Pepe',
  isLive: false
};

app.get('/api/videos/transition', (req, res) => {
  const videoPath = path.join(__dirname, 'public', 'uploads', 'transition', 'bothshutup.mp4');
  if (fs.existsSync(videoPath)) {
    res.json({ video: '/uploads/transition/bothshutup.mp4' });
  } else {
    res.status(404).json({ error: 'Transition video not found' });
  }
});

app.post('/api/start-episode', async (req, res) => {
  currentEpisode.isLive = true;
  const success = await startEpisodeIntro(io, getAudioDuration, recordingCallbacks, broadcastState);
  if (success !== false) {
    res.json({ success: true, message: 'Episode started with continuous conversation!' });
  } else {
    res.status(400).json({ success: false, message: 'Could not start episode' });
  }
});

let videoRecordingChunks = [];
let isVideoRecording = false;
let currentVideoFilename = '';

app.post('/api/recording/start', (req, res) => {
  videoRecordingChunks = [];
  isVideoRecording = true;
  currentVideoFilename = `episode-${currentRecording.episodeNumber}-${Date.now()}.webm`;
  console.log('🎥 VIDEO RECORDING STARTED:', currentVideoFilename);
  res.json({ success: true, filename: currentVideoFilename });
});

app.post('/api/recording/chunk', express.raw({ type: 'application/octet-stream', limit: '100mb' }), (req, res) => {
  if (!isVideoRecording) {
    return res.status(400).json({ error: 'No active recording' });
  }
  
  videoRecordingChunks.push(req.body);
  console.log(`📦 Received chunk ${videoRecordingChunks.length} (${req.body.length} bytes)`);
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
    console.log(`📍 Location: ${videoPath}`);
    
    videoRecordingChunks = [];
    
    res.json({ 
      success: true, 
      filename: currentVideoFilename,
      path: videoPath,
      size: totalSize
    });
  } catch (error) {
    console.error('Error saving video:', error);
    res.status(500).json({ error: 'Failed to save video' });
  }
});

// Catch-all route - serve React app for any route not handled above
app.use((req, res, next) => {
  // Only serve index.html for GET requests that don't start with /api
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Frontend not built. Please run: npm run build');
    }
  } else {
    next();
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🎙️ Mr Cock is ready to host!`);
  console.log(`🐸 Pepe is ready to be interviewed!`);
});
