# 🎥 Video Recording System for YouTube

## Overview

Your MemeTalk.TV app now has a **full video recording system** that captures the live show as an **MP4 video file** ready for YouTube upload!

## How It Works

### 🎬 Recording Process

1. **Browser Capture**: Uses the browser's MediaRecorder API to capture the screen and audio
2. **Real-time Recording**: Records everything you see - videos, animations, transitions, and TTS audio
3. **Server Storage**: Sends recording chunks to the backend and saves as `.webm` file
4. **Ready for Upload**: The final video is saved in the `recordings/` folder

## How to Record an Episode

### Step 1: Start the Show
1. Open the admin panel at `http://localhost:5173/admin`
2. Click "Start Website" to begin the countdown
3. Wait for the episode to start

### Step 2: Start Recording
When the episode begins, you'll see a **"🔴 Start Recording (for YouTube)"** button below the video player.

**Option A - Manual Recording:**
1. Click the **"🔴 Start Recording"** button
2. Browser will ask to share your screen
3. Select **"Chrome Tab"** or **"This Tab"**
4. Make sure **"Share audio"** is checked ✅
5. Click **"Share"**

**Option B - Automatic Recording:**
The recording will start automatically when the episode begins if you've already granted permission.

### Step 3: Recording is Active
- Button changes to **"⏹️ Stop Recording"** (green, pulsing)
- Console shows chunk uploads in real-time
- Recording continues until you stop it or the episode ends

### Step 4: Stop Recording
1. Click **"⏹️ Stop Recording"** when ready
2. System processes and uploads the video
3. You'll see a success alert with:
   - Filename
   - File size
   - Location

## Where Are Recordings Saved?

All recordings are saved in:
```
recordings/
├── episode-1-1730123456789.webm
├── episode-1-1730123987654.webm
└── ...
```

**Filename Format:** `episode-{number}-{timestamp}.webm`

## Converting WebM to MP4 for YouTube

YouTube accepts WebM, but if you want MP4, use FFmpeg:

### Install FFmpeg (if not installed)
**Windows:**
```bash
winget install FFmpeg.FFmpeg
```

**Mac:**
```bash
brew install ffmpeg
```

### Convert to MP4
```bash
cd recordings
ffmpeg -i episode-1-1730123456789.webm -c:v libx264 -c:a aac -strict experimental episode-1.mp4
```

### Optimize for YouTube
```bash
ffmpeg -i episode-1-1730123456789.webm -c:v libx264 -preset slow -crf 18 -c:a aac -b:a 192k -movflags +faststart episode-1-youtube.mp4
```

**Recommended YouTube Settings:**
- Resolution: 1920x1080 (Full HD)
- Frame rate: 30 fps
- Video codec: H.264
- Audio codec: AAC

## Technical Details

### Frontend Recording
- **API**: MediaRecorder (Web API)
- **Format**: WebM with VP9 video + Opus audio
- **Bitrate**: 5 Mbps
- **Chunk Size**: 1 second intervals

### Backend Storage
- **Endpoint**: `/api/recording/start`, `/api/recording/chunk`, `/api/recording/stop`
- **Max Upload Size**: 100 MB per chunk
- **Storage**: Local filesystem (`recordings/` directory)

### File Sizes
- **5-minute episode**: ~150-200 MB
- **10-minute episode**: ~300-400 MB

## Troubleshooting

### Recording Button Not Showing
- Make sure the episode has started (countdown finished)
- Refresh the page

### Permission Denied
- Browser must support screen capture
- User must grant screen share permission
- Make sure to check "Share audio" when prompted

### No Audio in Recording
- **IMPORTANT**: When browser asks to share screen, make sure **"Share audio"** checkbox is checked
- If audio is missing, stop and restart recording with audio enabled

### Large File Size
- This is normal for high-quality video
- 5-minute episode = ~150-200 MB
- You can compress with FFmpeg after recording

### Recording Fails to Save
- Check backend console for errors
- Ensure `recordings/` directory exists (auto-created)
- Check disk space

## Backend API Reference

### Start Recording
```javascript
POST /api/recording/start
Response: { success: true, filename: "episode-1-123456.webm" }
```

### Upload Chunk
```javascript
POST /api/recording/chunk
Content-Type: application/octet-stream
Body: <binary video data>
Response: { success: true, chunkNumber: 1 }
```

### Stop Recording
```javascript
POST /api/recording/stop
Response: { 
  success: true, 
  filename: "episode-1-123456.webm",
  path: "/full/path/to/file",
  size: 156789012
}
```

## Best Practices

### Before Recording
1. Close unnecessary tabs to save memory
2. Make sure your internet connection is stable
3. Test audio levels before starting

### During Recording
1. Don't switch tabs (recording will pause)
2. Don't minimize the browser
3. Keep the episode tab visible and focused

### After Recording
1. Let the upload complete before closing
2. Verify the file in `recordings/` folder
3. Test playback before uploading to YouTube

## YouTube Upload Checklist

- [ ] Video file is under 256 GB (you're safe with these)
- [ ] Duration is under 12 hours (episodes are 5 minutes)
- [ ] Video plays correctly
- [ ] Audio is synced
- [ ] No black screens or glitches
- [ ] Add engaging thumbnail
- [ ] Write compelling title and description
- [ ] Add relevant tags (memes, AI, podcast, etc.)
- [ ] Set appropriate audience settings

## Advanced: Automated Recording

If you want to automatically record every episode, you can modify the frontend to auto-start recording when the episode begins:

```javascript
// In Home.jsx, add this to the countdown socket listener:
newSocket.on('countdown', (data) => {
  if (data.seconds === 0) {
    // Episode starting - auto-record
    setTimeout(() => startVideoRecording(), 2000);
  }
});
```

## Need Help?

Common issues and solutions:

| Issue | Solution |
|-------|----------|
| No audio | Check "Share audio" when screen sharing |
| Video freezes | Don't minimize or switch tabs |
| Large file size | Use FFmpeg to compress after recording |
| Upload fails | Check network connection and server logs |

---

**Happy Recording! 🎬**

Your episodes are now ready for YouTube stardom! 🌟


