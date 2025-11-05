import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ffmpeg from 'fluent-ffmpeg';
import { getValidEmotion } from '../ai/emotions.js';
import { addToEpisodesDatabase } from './manager.js';
import { uploadToR2, isR2Configured } from './r2-upload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detect system font paths
function getSystemFontPath(fontName = 'arial.ttf') {
  const platform = process.platform;
  const fontPaths = {
    win32: [
      `C:/Windows/Fonts/${fontName}`,
      `C:/Windows/Fonts/arial.ttf`
    ],
    darwin: [
      `/System/Library/Fonts/${fontName}`,
      `/System/Library/Fonts/Supplemental/Arial.ttf`,
      `/Library/Fonts/Arial.ttf`
    ],
    linux: [
      `/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf`,
      `/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf`,
      `/usr/share/fonts/TTF/DejaVuSans.ttf`
    ]
  };
  
  const pathsToTry = fontPaths[platform] || fontPaths.linux;
  
  for (const fontPath of pathsToTry) {
    if (fs.existsSync(fontPath)) {
      return fontPath.replace(/\\/g, '/').replace(/:/g, '\\:');
    }
  }
  
  // Fallback - no fontfile specified (use system default)
  return null;
}

/**
 * Get audio duration using ffprobe
 */
export async function getAudioDuration(audioPath) {
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

/**
 * Generate thumbnail from video at 2 second mark
 */
export async function generateThumbnail(videoPath, thumbnailPath) {
  return new Promise((resolve, reject) => {
    console.log(`📸 Generating thumbnail: ${thumbnailPath}`);
    ffmpeg(videoPath)
      .screenshots({
        timestamps: ['00:00:02'],
        filename: path.basename(thumbnailPath),
        folder: path.dirname(thumbnailPath),
        size: '1280x720'
      })
      .on('end', () => {
        console.log(`✅ Thumbnail created: ${thumbnailPath}`);
        resolve(thumbnailPath);
      })
      .on('error', (err) => {
        console.error(`❌ Thumbnail error:`, err.message);
        reject(err);
      });
  });
}

/**
 * Create final episode video from recording
 */
export async function createEpisodeVideo(recording, timestamp, recordingDir) {
  console.log(`\n🎬 ===== createEpisodeVideo STARTED =====`);
  console.log(`   Episode #${recording.episodeNumber}`);
  console.log(`   Timestamp: ${timestamp}`);
  
  try {
    if (!recording) {
      console.error('❌ ERROR: No recording data provided!');
      return;
    }
    
    console.log(`✅ Step 1/6: Recording data validated`);
    
    if (!recordingDir || !fs.existsSync(recordingDir)) {
      console.error('❌ ERROR: Recording directory is missing or invalid!');
      console.error('   Expected:', recordingDir);
      return;
    }
    
    console.log(`✅ Step 2/6: Recording directory exists: ${recordingDir}`);
    
    const episodesDir = path.join(__dirname, '..', 'public', 'episodes');
    if (!fs.existsSync(episodesDir)) {
      console.log(`📁 Creating episodes directory: ${episodesDir}`);
      fs.mkdirSync(episodesDir, { recursive: true });
    }
    
    console.log(`✅ Step 3/6: Episodes directory ready: ${episodesDir}`);
    
    const outputPath = path.join(episodesDir, `episode-${recording.episodeNumber}-${timestamp}.mp4`);
    console.log(`📹 Final output will be: ${outputPath}`);
    
    if (!recording.videoSegments || recording.videoSegments.length === 0) {
      console.error('❌ ERROR: No video segments recorded!');
      return;
    }
    
    console.log(`✅ Step 4/6: ${recording.videoSegments.length} video segments to process`);
    
    const segmentPaths = [];
    
    // Process all segments
    for (let i = 0; i < recording.videoSegments.length; i++) {
      const segment = recording.videoSegments[i];
      const segmentOutputPath = path.join(recordingDir, `segment-${i}.mp4`);
      const audioPath = path.join(recordingDir, segment.audioFile);
      
      if (!fs.existsSync(audioPath)) {
        console.log(`⚠️ Skipping segment ${i}: audio not found`);
        continue;
      }
      
      const audioDuration = await getAudioDuration(audioPath);
      
      if (!segment.videoClip || !fs.existsSync(segment.videoClip)) {
        console.log(`⚠️ Skipping segment ${i}: video not found`);
        continue;
      }
      
      await new Promise((resolve, reject) => {
        const ffmpegCommand = ffmpeg()
          .input(segment.videoClip)
          .inputOptions(['-stream_loop', '-1'])
          .input(audioPath);
        
        // Add question overlay if this segment has question data
        let videoFilters = [];
        if (segment.questionText && segment.questionUsername) {
          console.log(`📝 Adding question overlay to segment ${i}: @${segment.questionUsername}`);
          
          // Escape special characters for FFmpeg drawtext
          const escapedUsername = segment.questionUsername.replace(/[:'\[\]]/g, '\\$&').replace(/'/g, "\\'");
          const escapedQuestion = segment.questionText.replace(/[:'\[\]]/g, '\\$&').replace(/'/g, "\\'");
          
          // Get system fonts
          const regularFont = getSystemFontPath('arial.ttf');
          const boldFont = getSystemFontPath('arialbd.ttf') || regularFont;
          
          const fontParam = regularFont ? `:fontfile=${regularFont}` : '';
          const boldFontParam = boldFont ? `:fontfile=${boldFont}` : '';
          
          // Add semi-transparent background box and text overlay
          videoFilters.push(
            // Background box
            `drawbox=x=(iw-min(iw*0.85\\,650))/2:y=ih*0.15:w=min(iw*0.85\\,650):h=120:color=0x8b5cf626:t=fill`,
            // Border
            `drawbox=x=(iw-min(iw*0.85\\,650))/2:y=ih*0.15:w=min(iw*0.85\\,650):h=120:color=0x8b5cf64D:t=2`,
            // Username label
            `drawtext=text='@${escapedUsername} asked\\:':fontsize=16:fontcolor=0xa78bfa:x=(w-text_w)/2:y=ih*0.15+20${fontParam}`,
            // Question text
            `drawtext=text='${escapedQuestion}':fontsize=18:fontcolor=white:x=(w-text_w)/2:y=ih*0.15+50${boldFontParam}`
          );
        }
        
        // Apply video filters if any
        if (videoFilters.length > 0) {
          ffmpegCommand.videoFilters(videoFilters.join(','));
        }
        
        ffmpegCommand
          .outputOptions(['-t', audioDuration.toString(), '-c:v', 'libx264', '-c:a', 'aac', '-shortest', '-y'])
          .output(segmentOutputPath)
          .on('end', () => {
            console.log(`✅ Segment ${i} created`);
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
      console.error('❌ ERROR: No valid segments created!');
      return;
    }
    
    console.log(`✅ Step 5/6: All ${segmentPaths.length} segments processed`);
    
    // Concatenate all segments
    const concatFilePath = path.join(recordingDir, 'concat.txt');
    const concatContent = segmentPaths.map(p => `file '${p}'`).join('\n');
    fs.writeFileSync(concatFilePath, concatContent);
    
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(concatFilePath)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions(['-c', 'copy'])
        .output(outputPath)
        .on('end', async () => {
          console.log(`🎉 Final video created locally: ${outputPath}`);
          console.log(`✅ Step 6/6: Video concatenation complete`);
          
          // Generate thumbnail from video
          const thumbnailPath = path.join(episodesDir, `episode-${recording.episodeNumber}-${timestamp}-thumb.jpg`);
          await generateThumbnail(outputPath, thumbnailPath);
          
          // Upload to R2 if configured
          let r2Url = null;
          let thumbnailUrl = null;
          if (isR2Configured()) {
            try {
              const filename = path.basename(outputPath);
              r2Url = await uploadToR2(outputPath, filename);
              console.log(`☁️  Video uploaded to R2: ${r2Url}`);
              
              // Upload thumbnail to R2
              if (fs.existsSync(thumbnailPath)) {
                const thumbFilename = path.basename(thumbnailPath);
                thumbnailUrl = await uploadToR2(thumbnailPath, thumbFilename);
                console.log(`☁️  Thumbnail uploaded to R2: ${thumbnailUrl}`);
              }
              
              // Update recording metadata with R2 URL
              recording.metadata.videoUrl = r2Url;
              recording.metadata.videoFile = filename;
              recording.metadata.thumbnail = thumbnailUrl || `/episodes/${path.basename(thumbnailPath)}`;
            } catch (uploadErr) {
              console.error('⚠️  R2 upload failed, keeping local file:', uploadErr.message);
              // Continue anyway - we have the local file
              recording.metadata.thumbnail = `/episodes/${path.basename(thumbnailPath)}`;
            }
          } else {
            console.warn('⚠️  R2 not configured - video saved locally only');
            console.warn('   Set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ACCOUNT_ID in .env');
            recording.metadata.thumbnail = `/episodes/${path.basename(thumbnailPath)}`;
          }
          
          // Add to database
          await addToEpisodesDatabase(recording);
          
          // Clean up temp directory
          try {
            fs.rmSync(recordingDir, { recursive: true, force: true });
            console.log('🗑️  Temp directory cleaned');
          } catch (err) {
            console.error('⚠️  Error cleaning temp:', err.message);
          }
          
          // If on Railway (ephemeral storage), also clean up local episode file
          if (process.env.RAILWAY_ENVIRONMENT && r2Url) {
            try {
              fs.unlinkSync(outputPath);
              if (fs.existsSync(thumbnailPath)) {
                fs.unlinkSync(thumbnailPath);
              }
              console.log('🗑️  Local files deleted (Railway ephemeral storage, R2 has the files)');
            } catch (err) {
              console.error('⚠️  Error deleting local files:', err.message);
            }
          }
          
          console.log('\n🎉 ===== EPISODE RECORDING COMPLETE =====');
          console.log(`   Episode ${recording.episodeNumber} is ready!`);
          if (r2Url) {
            console.log(`   📹 Video URL: ${r2Url}`);
          } else {
            console.log(`   📹 Local file: ${outputPath}`);
          }
          console.log(`\n`);
          
          resolve();
        })
        .on('error', (err) => {
          console.error(`❌ Concatenation error:`, err.message);
          reject(err);
        })
        .run();
    });
    
  } catch (error) {
    console.error('Error creating video:', error);
  }
}

