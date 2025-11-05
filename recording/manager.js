import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createEpisodeVideo } from './ffmpeg.js';
import { connectedUsers } from '../conversation/handlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export let currentRecording = {
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

export let isRecording = false;
export let recordingDir = null;

export const currentEpisode = {
  guest: 'Pepe',
  isLive: false
};

/**
 * Create recording callbacks for audio generation
 */
export function createRecordingCallbacks(onBroadcastStop) {
  return {
    isRecording: () => isRecording,
    getRecordingDir: () => recordingDir,
    onAudioSaved: (audioFilename, segmentData) => {
      currentRecording.audioFiles.push(audioFilename);
      
      // Map emotions to actual video filenames in public/
      const emotionMap = {
        'Mr Cock': {
          'normal': 'serious cooock.mp4',
          'angry': 'angrily coock.mp4',
          'laughing': 'laughing coock.mp4',
          'sad': 'sad coock.mp4',
          'thinking': 'sarcastically coock.mp4'
        },
        'Pepe': {
          'normal': 'serious pepe.mp4',
          'angry': 'angrily pepe.mp4',
          'happy': 'happily pepe.mp4',
          'sad': 'sad  pepe.mp4',
          'screaming': 'crazy pepe.mp4',
          'thinking': 'sarcastically  pepe.mp4'
        }
      };
      
      let videoClip = null;
      const speaker = segmentData.speaker;
      const emotion = segmentData.emotion;
      
      if (emotionMap[speaker]) {
        // Get the video filename for this emotion, fallback to normal
        const videoFilename = emotionMap[speaker][emotion] || emotionMap[speaker]['normal'];
        videoClip = path.join(__dirname, '..', 'public', videoFilename);
        
        if (!fs.existsSync(videoClip)) {
          console.log(`⚠️ ${videoFilename} not found, trying normal...`);
          const normalFilename = emotionMap[speaker]['normal'];
          videoClip = path.join(__dirname, '..', 'public', normalFilename);
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
      console.log('\n🎬🎬🎬 onEpisodeEnd CALLBACK TRIGGERED! 🎬🎬🎬');
      console.log(`   isRecording: ${isRecording}`);
      console.log(`   recordingDir: ${recordingDir}`);
      console.log(`   videoSegments: ${currentRecording.videoSegments.length}`);
      console.log(`   audioFiles: ${currentRecording.audioFiles.length}`);
      
      currentEpisode.isLive = false;
      if (onBroadcastStop) {
        console.log('   Calling onBroadcastStop...');
        onBroadcastStop();
      }
      console.log('   Calling saveRecording...');
      saveRecording();
      console.log('   saveRecording completed!');
    }
  };
}

/**
 * Get the next episode number
 */
function getNextEpisodeNumber() {
  const episodesFile = path.join(__dirname, '..', 'episodes.json');
  
  if (fs.existsSync(episodesFile)) {
    const episodes = JSON.parse(fs.readFileSync(episodesFile, 'utf8'));
    if (episodes.length > 0) {
      const maxNumber = Math.max(...episodes.map(ep => ep.number || 0));
      return maxNumber + 1;
    }
  }
  
  return 1; // First episode
}

/**
 * Start recording an episode
 */
export function startRecording() {
  console.log('\n🔴🔴🔴 startRecording FUNCTION CALLED! 🔴🔴🔴');
  isRecording = true;
  
  // Get the next episode number
  const nextEpisodeNumber = getNextEpisodeNumber();
  console.log(`   Next episode number: ${nextEpisodeNumber}`);
  
  recordingDir = path.join(__dirname, '..', 'temp', `episode-${nextEpisodeNumber}-${Date.now()}`);
  console.log(`   Recording dir: ${recordingDir}`);
  
  if (!fs.existsSync(recordingDir)) {
    console.log('   Creating recording directory...');
    fs.mkdirSync(recordingDir, { recursive: true });
    console.log('   ✅ Directory created!');
  } else {
    console.log('   ✅ Directory already exists');
  }
  
  currentRecording = {
    episodeNumber: nextEpisodeNumber,
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
  console.log(`   isRecording: ${isRecording}`);
  console.log('📁 Temp directory:', recordingDir);
}

/**
 * Save the recording and create video
 */
export async function saveRecording() {
  console.log('\n💾💾💾 saveRecording FUNCTION CALLED! 💾💾💾');
  console.log(`   isRecording: ${isRecording}`);
  
  if (!isRecording) {
    console.log('⚠️⚠️⚠️ saveRecording called but isRecording=false! NOT SAVING!');
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
    console.error('   Audio files saved: ${currentRecording.audioFiles.length}');
  }
  
  if (!recordingDir || !fs.existsSync(recordingDir)) {
    console.error('❌ CRITICAL: Recording directory missing!');
    console.error(`   Expected: ${recordingDir}`);
    console.error('   Video creation will fail.');
  }
  
  console.log('✅ Setting isRecording = false');
  isRecording = false;
  currentRecording.endTime = new Date().toISOString();
  
  const timestamp = Date.now();
  const filename = `episode-${currentRecording.episodeNumber}-${timestamp}.json`;
  const filepath = path.join(__dirname, '..', 'recordings', filename);
  
  const recordingsDir = path.join(__dirname, '..', 'recordings');
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
    duration: '15:00',
    videoFile: `episode-${currentRecording.episodeNumber}-${timestamp}.mp4`,
    thumbnail: '/memetalk.tv.png'
  };
  
  fs.writeFileSync(filepath, JSON.stringify(currentRecording, null, 2));
  console.log(`💾 Recording saved: ${filename}`);
  console.log(`   📊 Total dialogue: ${currentRecording.dialogue.length}`);
  console.log(`   💬 Total chat: ${currentRecording.chat.length}`);
  
  console.log('\n🎬 ===== STARTING VIDEO CREATION =====');
  console.log(`   📹 Episode: ${currentRecording.episodeNumber}`);
  console.log(`   🎞️  Segments to process: ${currentRecording.videoSegments.length}`);
  console.log(`   📂 Working directory: ${recordingDir}`);
  console.log(`   ⏱️  Started at: ${new Date().toLocaleTimeString()}`);
  
  createEpisodeVideo(currentRecording, timestamp, recordingDir)
    .then(() => {
      console.log('\n✅ ===== VIDEO CREATION SUCCESS =====');
      console.log(`   ⏱️  Finished at: ${new Date().toLocaleTimeString()}`);
      console.log(`   📹 Episode ${currentRecording.episodeNumber} is ready!`);
    })
    .catch(err => {
      console.error('\n❌ ===== VIDEO CREATION FAILED =====');
      console.error(`   Error: ${err.message}`);
      console.error(`   Stack: ${err.stack}`);
      console.error('   💡 Check if FFmpeg is installed on Railway');
      console.error('   💡 Check if video files exist in public/uploads');
  });
  
  currentRecording.episodeNumber++;
}

/**
 * Add episode to database
 */
export async function addToEpisodesDatabase(recording) {
  const episodesFile = path.join(__dirname, '..', 'episodes.json');
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

/**
 * Handle chat message recording
 */
export function handleChatMessageRecording(io) {
  io.on('chat_message_recorded', (userMsg) => {
    if (isRecording) {
      currentRecording.chat.push(userMsg);
    }
  });
}

