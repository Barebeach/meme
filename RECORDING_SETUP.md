# 🎥 **Episode Recording Setup Guide**

## **Overview**

This system records live episodes and uploads them to **Cloudflare R2** (S3-compatible storage). Perfect for Railway's ephemeral filesystem!

---

## **How It Works**

1. **During the show:** Episode audio + video segments are saved temporarily on Railway
2. **After the show:** FFmpeg creates the final MP4 video
3. **Upload:** Video is uploaded to Cloudflare R2 (permanent storage)
4. **Cleanup:** Local files are deleted (Railway storage is ephemeral)
5. **Result:** MP4 is accessible via R2 public URL forever!

---

## **🔧 Setup Instructions**

### **1. Install Dependencies**

```bash
npm install
```

This will install:
- `@aws-sdk/client-s3` - For uploading to R2
- `fluent-ffmpeg` - For video processing
- `@ffmpeg-installer/ffmpeg` - FFmpeg binaries

---

### **2. Get Cloudflare R2 Credentials**

#### **Step 1: Create R2 Bucket**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **R2 Object Storage**
3. Click **Create bucket**
4. Name it: `memetalk` (or your preferred name)
5. Click **Create bucket**

#### **Step 2: Get API Credentials**
1. In R2, go to **Manage R2 API Tokens**
2. Click **Create API token**
3. **Name:** `memetalk-recording`
4. **Permissions:** `Object Read & Write`
5. **TTL:** Leave blank (never expires)
6. Click **Create API token**
7. **SAVE THESE VALUES:**
   - Access Key ID
   - Secret Access Key

#### **Step 3: Get Account ID**
1. In Cloudflare dashboard, look at the URL
2. Your Account ID is in the URL: `https://dash.cloudflare.com/{ACCOUNT_ID}/r2`
3. Copy the Account ID

#### **Step 4: Get Public URL**
1. Go to your bucket settings
2. Under **Public Access**, enable **Allow Access**
3. Your public URL will be: `https://pub-XXXXXXXXX.r2.dev`
4. Copy this URL

---

### **3. Set Environment Variables**

#### **For Local Development (`.env` file):**

```env
# OpenAI (already configured)
OPENAI_API_KEY=your_openai_key

# Cloudflare R2 Storage
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_ACCOUNT_ID=your_account_id_here
R2_BUCKET_NAME=memetalk
R2_PUBLIC_URL=https://pub-XXXXXXXXX.r2.dev
```

#### **For Railway Deployment:**

1. Go to your Railway project
2. Click **Variables** tab
3. Add these variables:
   ```
   R2_ACCESS_KEY_ID = your_access_key_id_here
   R2_SECRET_ACCESS_KEY = your_secret_access_key_here
   R2_ACCOUNT_ID = your_account_id_here
   R2_BUCKET_NAME = memetalk
   R2_PUBLIC_URL = https://pub-XXXXXXXXX.r2.dev
   RAILWAY_ENVIRONMENT = production
   ```

4. **Important:** Click **Deploy** to apply changes

---

## **🚀 Testing**

### **1. Test Locally**

```bash
# Start backend
npm run server

# Start frontend (in another terminal)
npm run dev
```

1. Go to `http://localhost:5173/admin`
2. Click **Start Show**
3. Ask some questions in chat
4. Let the episode complete (or wait for outro)
5. Check console logs for recording progress
6. Video will be uploaded to R2!

### **2. Check R2 Upload**

1. Go to Cloudflare R2 dashboard
2. Open your bucket
3. Navigate to `episodes/` folder
4. You should see: `episode-1-{timestamp}.mp4`
5. Click to preview or get public URL

---

## **📁 File Structure**

```
recordings/             # Episode metadata (JSON)
├── episode-1-{timestamp}.json

temp/                   # Temporary during recording (auto-deleted)
├── episode-1-{timestamp}/
│   ├── mrcock-{timestamp}.mp3
│   ├── pepe-{timestamp}.mp3
│   └── segment-0.mp4

episodes.json           # Episodes database (for frontend)

R2 Cloud Storage:
└── episodes/
    ├── episode-1-{timestamp}.mp4
    ├── episode-2-{timestamp}.mp4
    └── ...
```

---

## **🔍 Troubleshooting**

### **Issue: "R2 credentials not configured"**
**Solution:** Add all R2 environment variables to `.env` or Railway

### **Issue: "FFmpeg not found"**
**Solution:** Railway should auto-install FFmpeg. If not, add to `railway.json`:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1
  }
}
```

### **Issue: "Upload failed"**
**Solution:** 
1. Check R2 credentials are correct
2. Verify bucket name matches `R2_BUCKET_NAME`
3. Ensure R2 API token has **Object Read & Write** permissions

### **Issue: "Video segments not found"**
**Solution:** Make sure character videos (MP4) are uploaded to:
- `public/uploads/hosts/mrcock/{emotion}.mp4`
- `public/uploads/guests/pepe/{emotion}.mp4`

---

## **💰 Costs**

### **Cloudflare R2 Pricing (as of 2025):**
- **Storage:** $0.015/GB per month
- **Upload (Class A):** FREE
- **Download (Class B):** $0.36/million requests (after 10M free)

### **Example for 50 episodes:**
- Average episode: ~100MB
- Storage: 5GB × $0.015 = **$0.075/month**
- **Basically free!** 🎉

---

## **🎬 What Gets Recorded**

### **Episode Metadata (`episode-1-{timestamp}.json`):**
```json
{
  "episodeNumber": 1,
  "startTime": "2025-01-01T12:00:00Z",
  "endTime": "2025-01-01T12:15:00Z",
  "dialogue": [...],
  "chat": [...],
  "videoSegments": [...],
  "metadata": {
    "title": "Episode 1: Pepe",
    "guest": "Pepe",
    "host": "Mr Cock",
    "videoUrl": "https://pub-XXX.r2.dev/episodes/episode-1-XXX.mp4",
    "videoFile": "episode-1-XXX.mp4"
  }
}
```

### **Final Video (`episode-1-{timestamp}.mp4`):**
- Resolution: 1920x1080 (or source resolution)
- Codec: H.264 (MP4)
- Audio: AAC
- Contains: All dialogue with synchronized character videos

---

## **✅ Checklist**

Before deploying to Railway:

- [ ] `npm install` completed
- [ ] `.env` file has all R2 credentials
- [ ] R2 bucket created and public access enabled
- [ ] R2 API token created with Read & Write permissions
- [ ] Character videos uploaded to `public/uploads/`
- [ ] Tested locally and video uploaded to R2
- [ ] Railway environment variables set
- [ ] Railway deployed with latest code

---

## **🎉 You're Ready!**

Now every episode will automatically:
1. Record during the live show
2. Generate MP4 video with FFmpeg
3. Upload to R2 cloud storage
4. Clean up local files
5. Be accessible via permanent R2 URL!

No more worrying about Railway's ephemeral filesystem! 🚀




