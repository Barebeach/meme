import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { getValidEmotion } from './emotions.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generate speech audio using OpenAI TTS
 * @param {string} text - The text to convert to speech
 * @param {string} voice - The voice to use ('alloy', 'onyx', 'fable', etc.)
 * @param {string} speaker - The speaker name ('Mr Cock', 'Pepe', etc.)
 * @param {string} emotion - The emotion for this speech
 * @param {object} questionData - Optional question data to include
 * @param {Array} emotionSegments - Optional array of emotion segments
 * @param {object} recordingCallbacks - Optional recording callbacks
 * @returns {Promise<{buffer: Buffer, audioPath: string}>} - The audio buffer and path
 */
export async function generateSpeech(text, voice = 'alloy', speaker = null, emotion = 'normal', questionData = null, emotionSegments = null, recordingCallbacks = null) {
  try {
    // Determine character ID: Mr Cock = 'mrcock', any other guest = 'pepe' (for emotion purposes)
    const characterId = speaker === 'Mr Cock' ? 'mrcock' : (speaker ? 'pepe' : null);
    if (characterId) {
      emotion = getValidEmotion(emotion, characterId);
      
      if (emotionSegments && emotionSegments.length > 0) {
        emotionSegments = emotionSegments.map(seg => ({
          ...seg,
          emotion: getValidEmotion(seg.emotion, characterId)
        }));
      }
    }
    
    const isMrCock = voice === 'onyx';
    const speed = isMrCock ? 1.15 : 1.0;
    const model = "tts-1-hd";
    
    console.log(`🎙️ Generating speech for ${speaker || 'Unknown'} with voice: ${voice} (speed: ${speed})`);
    
    const mp3 = await openai.audio.speech.create({
      model: model,
      voice: voice,
      input: text,
      speed: speed
    });
    
    const buffer = Buffer.from(await mp3.arrayBuffer());
    let savedAudioPath = null;
    
    // Always save audio to temp directory (needed for frontend playback)
    if (speaker) {
      let targetDir = null;
      
      // If recording is active, use recording directory
      if (recordingCallbacks && recordingCallbacks.isRecording && recordingCallbacks.getRecordingDir) {
        targetDir = recordingCallbacks.getRecordingDir();
      } else {
        // Otherwise, use general temp directory
        const tempBaseDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempBaseDir)) {
          fs.mkdirSync(tempBaseDir, { recursive: true });
        }
        targetDir = tempBaseDir;
      }
      
      if (targetDir && fs.existsSync(targetDir)) {
        try {
          const audioFilename = `${speaker.toLowerCase().replace(' ', '')}-${Date.now()}.mp3`;
          const audioPath = path.join(targetDir, audioFilename);
          fs.writeFileSync(audioPath, buffer);
          
          // Convert to web path - make it work on both localhost and production
          let relativePath = path.relative(process.cwd(), audioPath).replace(/\\/g, '/');
          
          // FALLBACK: If relative path fails or is empty, construct manually
          if (!relativePath || relativePath === audioFilename) {
            // Extract the important parts: temp/episode-XX-XXXX/filename.mp3
            const parts = audioPath.replace(/\\/g, '/').split('/');
            const tempIndex = parts.findIndex(p => p === 'temp');
            if (tempIndex >= 0) {
              relativePath = parts.slice(tempIndex).join('/');
            } else {
              // Last resort: just use filename with temp prefix
              relativePath = `temp/${audioFilename}`;
            }
            console.log(`⚠️ Using fallback path construction: ${relativePath}`);
          }
          
          savedAudioPath = `/${relativePath}`;
          console.log(`💾 Saved audio: ${audioFilename} -> ${savedAudioPath} (${(buffer.length / 1024).toFixed(1)}KB)`);
          
          if (recordingCallbacks && recordingCallbacks.onAudioSaved) {
            recordingCallbacks.onAudioSaved(audioFilename, {
              speaker,
              emotion,
              text,
              emotionSegments,
              questionData
            });
          }
        } catch (err) {
          console.error(`❌ ERROR saving audio file:`, err);
        }
      }
    }
    
    return { buffer, audioPath: savedAudioPath };
  } catch (error) {
    console.error('TTS Error:', error);
    return null;
  }
}

