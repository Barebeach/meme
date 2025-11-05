import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// R2 Client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'memetalk';

/**
 * Download a single video from R2
 */
async function downloadVideoFromR2(r2Key, localPath) {
  try {
    console.log(`   📥 Downloading: ${r2Key}...`);
    
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: r2Key,
    });

    const response = await r2Client.send(command);
    const chunks = [];
    
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    
    const buffer = Buffer.concat(chunks);
    
    // Ensure directory exists
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(localPath, buffer);
    const sizeMB = (buffer.length / (1024 * 1024)).toFixed(2);
    console.log(`   ✅ Downloaded: ${path.basename(localPath)} (${sizeMB}MB)`);
    
    return true;
  } catch (error) {
    console.error(`   ❌ Failed to download ${r2Key}:`, error.message);
    return false;
  }
}

/**
 * Download all character videos from R2 for FFmpeg recording
 */
export async function downloadCharacterVideos() {
  console.log('\n🎬 ===== DOWNLOADING CHARACTER VIDEOS FROM R2 =====\n');
  
  // Check if R2 is configured
  if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_ACCOUNT_ID) {
    console.warn('⚠️  R2 not configured - skipping video download');
    console.warn('   Recording will fail without local video files!');
    return false;
  }

  const baseDir = path.join(__dirname, '..', 'public');
  
  // Videos to download (R2 key -> local path)
  const videos = [
    // Mr Cock videos
    { r2Key: 'serious%20cooock.mp4', localPath: path.join(baseDir, 'serious cooock.mp4') },
    { r2Key: 'angrily%20coock.mp4', localPath: path.join(baseDir, 'angrily coock.mp4') },
    { r2Key: 'laughing%20coock.mp4', localPath: path.join(baseDir, 'laughing coock.mp4') },
    { r2Key: 'sad%20coock.mp4', localPath: path.join(baseDir, 'sad coock.mp4') },
    { r2Key: 'sarcastically%20coock.mp4', localPath: path.join(baseDir, 'sarcastically coock.mp4') },
    
    // Pepe videos
    { r2Key: 'serious%20pepe.mp4', localPath: path.join(baseDir, 'serious pepe.mp4') },
    { r2Key: 'angrily%20pepe.mp4', localPath: path.join(baseDir, 'angrily pepe.mp4') },
    { r2Key: 'happily%20pepe.mp4', localPath: path.join(baseDir, 'happily pepe.mp4') },
    { r2Key: 'sad%20%20pepe.mp4', localPath: path.join(baseDir, 'sad  pepe.mp4') },
    { r2Key: 'crazy%20pepe.mp4', localPath: path.join(baseDir, 'crazy pepe.mp4') },
    { r2Key: 'sarcastically%20%20pepe.mp4', localPath: path.join(baseDir, 'sarcastically  pepe.mp4') },
  ];

  let successCount = 0;
  let failCount = 0;

  console.log(`📦 Bucket: ${R2_BUCKET_NAME}`);
  console.log(`📁 Local directory: ${baseDir}`);
  console.log(`📹 Videos to download: ${videos.length}\n`);

  for (const video of videos) {
    const success = await downloadVideoFromR2(video.r2Key, video.localPath);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log(`\n✅ ===== DOWNLOAD COMPLETE =====`);
  console.log(`   ✅ Success: ${successCount}/${videos.length}`);
  if (failCount > 0) {
    console.log(`   ❌ Failed: ${failCount}/${videos.length}`);
    console.warn(`\n⚠️  WARNING: Some videos failed to download!`);
    console.warn(`   Recording may fail without all emotion videos.`);
  }
  console.log(`\n`);

  return successCount === videos.length;
}

/**
 * Check if character videos already exist locally
 */
export function characterVideosExist() {
  const baseDir = path.join(__dirname, '..', 'public');
  
  const requiredVideos = [
    path.join(baseDir, 'serious cooock.mp4'),
    path.join(baseDir, 'serious pepe.mp4'),
  ];

  const allExist = requiredVideos.every(video => fs.existsSync(video));
  
  if (allExist) {
    console.log('✅ Character videos already exist locally in public/');
  } else {
    console.log('⚠️  Character videos not found in public/');
  }
  
  return allExist;
}

