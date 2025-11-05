# Railway Environment Variables Setup

## Required Environment Variables for Production

### 1. Open Railway Dashboard
- Go to https://railway.app
- Open your project: **meme**
- Click on the **Variables** tab

### 2. Add These Variables

#### **R2 Storage (Cloudflare)**
These are required for uploading recorded episodes:

```
R2_ACCESS_KEY_ID = your_cloudflare_r2_access_key_id
R2_SECRET_ACCESS_KEY = your_cloudflare_r2_secret_access_key
R2_ACCOUNT_ID = your_cloudflare_account_id
R2_BUCKET_NAME = memetalk
R2_PUBLIC_URL = https://pub-2210718f3f20481b84992800d4ae8bd1.r2.dev
```

**Where to find these:**
1. Go to Cloudflare Dashboard: https://dash.cloudflare.com
2. Click **R2** in the left sidebar
3. Click **Manage R2 API Tokens**
4. Create a new token or copy existing credentials
5. Your Account ID is in the URL or in **Account Settings**

#### **OpenAI API**
Required for generating speech (TTS):

```
OPENAI_API_KEY = sk-proj-...your-key-here
```

**Where to find this:**
1. Go to https://platform.openai.com/api-keys
2. Copy your API key or create a new one

#### **Node Environment**
```
NODE_ENV = production
```

---

## 3. After Adding Variables

Railway will **automatically redeploy** your app with the new environment variables.

---

## 4. Check Your Local `.env` File

To find your credentials, check your local `.env` file:

```bash
# On Windows:
type .env

# On Mac/Linux:
cat .env
```

Copy the values from there to Railway!

---

## What Happens Without These Variables?

### Without R2 Credentials:
- ❌ Recordings will NOT upload to cloud storage
- ❌ Episodes will NOT be saved permanently
- ❌ Videos will be lost when Railway restarts
- ⚠️ You'll see this warning in logs:
  ```
  ⚠️  R2 credentials not configured. Episodes will only be saved locally.
  ```

### Without OpenAI API Key:
- ❌ Speech generation will fail
- ❌ No audio for episodes
- ❌ Recording will crash

---

## Verifying It Works

After adding environment variables and redeploying, check Railway logs for:

```
✅ FFmpeg path: /app/node_modules/@ffmpeg-installer/linux-x64/ffmpeg
✅ FFprobe path: /app/node_modules/@ffprobe-installer/linux-x64/ffprobe
```

When you start recording on production:
```
📤 ===== UPLOADING TO R2 =====
   Local file: /app/recordings/episode-1-123456.mp4
   R2 filename: episode-1-123456.mp4
   Bucket: memetalk
   ✅ Upload complete
   🌐 Public URL: https://pub-2210718f3f20481b84992800d4ae8bd1.r2.dev/episodes/episode-1-123456.mp4
```

---

## Already Recorded Episodes

Your existing episodes (in `episodes.json`) work because:
- ✅ The video files are already uploaded to R2
- ✅ The metadata is committed to git
- ✅ R2 URLs are permanent

New recordings need R2 credentials to upload!

