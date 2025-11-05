# Copy Environment Variables to Railway

## Your Local `.env` Variables (that need to be on Railway)

You have these variables locally that are **REQUIRED** on Railway:

✅ `OPENAI_API_KEY` - For speech generation  
✅ `R2_ACCESS_KEY_ID` - For R2 upload  
✅ `R2_SECRET_ACCESS_KEY` - For R2 upload  
✅ `R2_ACCOUNT_ID` - For R2 upload  
✅ `R2_BUCKET_NAME` - For R2 upload  
✅ `R2_ENDPOINT` - For R2 upload  
✅ `R2_PUBLIC_URL` - For R2 public URLs  

---

## Steps to Copy to Railway:

### Option 1: Railway CLI (Fastest)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Copy all variables from .env
railway variables --set-from-env-file .env
```

### Option 2: Railway Dashboard (Manual)

1. **Open Railway Dashboard:**
   - Go to https://railway.app
   - Open your project **meme**
   - Click **Variables** tab

2. **Open your local `.env` file:**
   ```powershell
   notepad .env
   ```

3. **Copy each variable:**
   - In Railway, click **+ New Variable**
   - Copy/paste the variable name and value from `.env`
   - Repeat for all 7 variables listed above

4. **Save and Redeploy:**
   - Railway will automatically redeploy with new variables

---

## ⚠️ IMPORTANT: Add NODE_ENV

Also add this variable in Railway (NOT in your local .env):

```
NODE_ENV = production
```

This tells the app it's running in production mode.

---

## Why Recording Doesn't Work Without These:

### The Flow:
1. ✅ Admin clicks "Start Recording" 
2. ✅ Backend generates audio files (needs OPENAI_API_KEY)
3. ✅ FFmpeg combines audio + video
4. ❌ **Upload to R2 FAILS** (missing R2 credentials)
5. ❌ Episode not saved to `episodes.json`
6. ❌ Video lost on Railway restart

### With R2 Credentials:
1. ✅ Admin clicks "Start Recording"
2. ✅ Backend generates audio files
3. ✅ FFmpeg combines audio + video  
4. ✅ **Upload to R2 succeeds!**
5. ✅ Episode saved to `episodes.json`
6. ✅ Video accessible forever via R2 URL

---

## Test After Adding Variables

1. Push to Railway (it will auto-deploy)
2. Go to https://memetalk.tv/admin
3. Click "Start Recording"
4. Start the show
5. Stop recording
6. Check Railway logs for:
   ```
   ✅ ===== R2 UPLOAD SUCCESS =====
   ```

Your episode will now be at:
```
https://pub-2210718f3f20481b84992800d4ae8bd1.r2.dev/episodes/episode-X-timestamp.mp4
```

---

## Quick Check: Are Variables Set on Railway?

After adding them, you can check Railway logs on startup:
```
✅ FFmpeg path: ...
✅ FFprobe path: ...
✅ Server running on port 3001
```

If R2 is NOT configured, you'll see:
```
⚠️  R2 credentials not configured. Episodes will only be saved locally.
```

