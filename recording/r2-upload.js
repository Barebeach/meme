import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

/**
 * Upload MP4 to Cloudflare R2
 * R2 is S3-compatible, so we use AWS SDK
 */

// Initialize R2 client (S3-compatible)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'memetalk';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-2210718f3f20481b84992800d4ae8bd1.r2.dev';

/**
 * Upload episode video to R2
 * @param {string} localFilePath - Path to the MP4 file on local disk
 * @param {string} filename - Desired filename in R2 (e.g., episode-1-123456.mp4)
 * @returns {Promise<string>} - Public URL of the uploaded video
 */
export async function uploadToR2(localFilePath, filename) {
  try {
    console.log(`\n📤 ===== UPLOADING TO R2 =====`);
    console.log(`   Local file: ${localFilePath}`);
    console.log(`   R2 filename: ${filename}`);
    console.log(`   Bucket: ${R2_BUCKET_NAME}`);

    // Check if file exists
    if (!fs.existsSync(localFilePath)) {
      throw new Error(`File not found: ${localFilePath}`);
    }

    // Get file size
    const stats = fs.statSync(localFilePath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`   File size: ${fileSizeMB} MB`);

    // Read file as buffer
    const fileBuffer = fs.readFileSync(localFilePath);
    console.log(`   ✅ File read into memory`);

    // Upload to R2
    const uploadParams = {
      Bucket: R2_BUCKET_NAME,
      Key: `episodes/${filename}`, // Store in episodes folder
      Body: fileBuffer,
      ContentType: 'video/mp4',
    };

    console.log(`   📡 Starting upload...`);
    const uploadStart = Date.now();

    await r2Client.send(new PutObjectCommand(uploadParams));

    const uploadDuration = ((Date.now() - uploadStart) / 1000).toFixed(2);
    console.log(`   ✅ Upload complete in ${uploadDuration}s`);

    // Construct public URL
    const publicUrl = `${R2_PUBLIC_URL}/episodes/${filename}`;
    console.log(`   🌐 Public URL: ${publicUrl}`);
    console.log(`\n✅ ===== R2 UPLOAD SUCCESS =====\n`);

    return publicUrl;
  } catch (error) {
    console.error(`\n❌ ===== R2 UPLOAD FAILED =====`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    throw error;
  }
}

/**
 * Check if R2 credentials are configured
 */
export function isR2Configured() {
  const hasCredentials = 
    process.env.R2_ACCESS_KEY_ID && 
    process.env.R2_SECRET_ACCESS_KEY && 
    process.env.R2_ACCOUNT_ID;
  
  if (!hasCredentials) {
    console.warn('⚠️  R2 credentials not configured. Episodes will only be saved locally.');
  }
  
  return hasCredentials;
}






