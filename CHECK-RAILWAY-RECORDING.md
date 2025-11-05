# Railway Recording Debug Checklist

## Issue 1: R2 Not Uploading

Your logs show:
```
Audio Path: /temp/episode-27-1762337996286/mrcock-1762338001870.mp3
```

✅ Recording IS happening  
❌ But R2 upload is NOT happening

---

## ✅ What To Check on Railway

### 1. Check Railway Startup Logs

Go to Railway → **Deployments** → **Build Logs** → Look for:

```
☁️  R2 upload: CONFIGURED ✅  or  NOT CONFIGURED ❌
```

If it says **NOT CONFIGURED**, your environment variables are wrong!

---

### 2. Check Environment Variables on Railway

Go to Railway → **Variables** tab → Verify these EXACT names:

```
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_ACCOUNT_ID
R2_BUCKET_NAME
R2_PUBLIC_URL
```

**IMPORTANT:** Variable names must match EXACTLY (case-sensitive!)

---

### 3. Check Railway Runtime Logs

After episode ends, look for these logs:

✅ **Success logs:**
```
📊 ===== RECORDING SUMMARY =====
   Video segments: XX
   Audio files: XX
🎬 ===== STARTING VIDEO CREATION =====
📹 Rendering MP4 video...
☁️  Video uploaded to R2: https://pub-...
✅ ===== VIDEO CREATION SUCCESS =====
```

❌ **Error logs:**
```
⚠️  R2 credentials not configured. Episodes will only be saved locally.
❌ ===== VIDEO CREATION FAILED =====
```

---

## Issue 2: Refresh Gets Stuck on "BothShutUp" Video

When you refresh mid-episode:
1. Frontend loses current state
2. Reconnects to Socket.IO
3. Gets stuck because backend doesn't re-send current speaker state

### Fix: Need to emit current state on reconnect

---

## Issue 3: Audio Button Not Working (BUT IT IS!)

Your logs show:
```
✅ Audio playing successfully for Mr Cock
✅ Finished playing Mr Cock (duration: 13.5s)
```

**AUDIO IS WORKING!** Check:
1. Phone volume slider
2. Phone mute switch (side button on iPhone)
3. Browser audio settings

---

## How To Test R2 Upload

1. Go to Railway → **Variables**
2. Click **+ New Variable**
3. Add this to test if env vars work:
   ```
   TEST_VAR=hello
   ```
4. Save and wait for redeploy
5. Check logs for "hello" anywhere

If you DON'T see your test var, Railway isn't picking up variables!

---

## Quick Fix Commands

### See all Railway env vars:
```bash
railway variables
```

### Set all vars from local .env:
```bash
railway variables --set-from-env-file .env
```

### Check if R2 is accessible:
```bash
# In Railway logs, you should see on startup:
☁️  R2 upload: CONFIGURED
```

---

## Most Likely Issue

**You added env variables but Railway didn't restart!**

### Force Railway to redeploy:
1. Go to Railway dashboard
2. Click **Redeploy** button
3. Wait for build to finish
4. Check logs for `☁️  R2 upload: CONFIGURED`

---

## After Fixing

1. Start a new episode
2. Let it run for 1-2 minutes
3. Stop the episode
4. Check Railway logs for:
   ```
   📊 ===== RECORDING SUMMARY =====
   🎬 ===== STARTING VIDEO CREATION =====
   📤 ===== UPLOADING TO R2 =====
   ✅ Upload complete
   🌐 Public URL: https://pub-2210718f3f20481b84992800d4ae8bd1.r2.dev/episodes/...
   ```

If you see these logs, it's working!

---

## Still Not Working?

Send me the **Railway startup logs** (first 50 lines) so I can see if:
1. Node version is correct
2. R2 vars are loaded
3. FFmpeg is installed
4. Any errors during startup

