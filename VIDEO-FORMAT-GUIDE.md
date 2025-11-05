# Video Format Guide for OBS Streaming

## 🎥 Supported Formats

Your MemeTalk.TV platform supports multiple video formats with automatic fallbacks:

### Desktop/OBS:
1. **MP4 (H.264)** ⭐ **RECOMMENDED for OBS**
2. **WebM (VP8/VP9)** ✅ Works but less reliable
3. **GIF** ⚠️ Fallback only (larger file size)

### Mobile:
- **GIF** (animated images work best on mobile browsers)

---

## 🚀 OBS Browser Source Compatibility

### ✅ Best Choice: MP4 (H.264)
**Why:**
- Universal browser support
- Hardware acceleration in OBS
- Reliable playback
- Smaller file sizes with good quality
- No audio issues

**Recommended Settings:**
```
Codec: H.264
Container: MP4
Resolution: 1920x1080 or 1280x720
Frame Rate: 30fps
Bitrate: 2-5 Mbps
```

### ⚠️ WebM Can Work But...
**Pros:**
- Open source format
- Good compression
- Chromium-based browsers support it

**Cons:**
- Can have hardware acceleration issues in OBS
- Some codec variations may not work
- Less predictable performance

**If Using WebM:**
- Use VP8 or VP9 codec
- Test thoroughly in OBS before going live
- Always provide MP4 fallback

---

## 🔧 Current Implementation

Your code now **prioritizes MP4 over WebM**:

```javascript
// OLD: WebM first
newSrc = urls.webm || urls.mp4

// NEW: MP4 first (better OBS compatibility)
newSrc = urls.mp4 || urls.webm
```

### Fallback Chain:
1. **Desktop/OBS**: MP4 → WebM → (none)
2. **Mobile**: GIF → MP4 → WebM

---

## 📝 Uploading Videos in Admin Panel

When uploading character videos:

### Option 1: Upload MP4 (Recommended)
1. Convert your videos to MP4/H.264
2. Upload via Admin → Videos tab
3. OBS streams will work perfectly

### Option 2: Upload WebM
1. Videos will work in browsers
2. May have issues in OBS Browser Source
3. Provide MP4 fallback for reliability

### Option 3: Upload Both
1. Upload both MP4 and WebM versions
2. System automatically picks best format
3. Maximum compatibility

---

## 🛠️ Converting WebM to MP4

If you have WebM videos and need MP4:

### Using FFmpeg (Command Line):
```bash
# Basic conversion
ffmpeg -i input.webm -c:v libx264 -c:a aac output.mp4

# Optimized for streaming
ffmpeg -i input.webm -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k output.mp4

# Match original quality
ffmpeg -i input.webm -c:v libx264 -crf 18 -c:a aac -b:a 192k output.mp4
```

### Using Online Tools:
- CloudConvert.com
- FreeConvert.com
- Convertio.co

### Using Video Editing Software:
- Adobe Premiere Pro
- DaVinci Resolve (Free)
- Handbrake (Free, Open Source)

---

## 🎬 OBS Studio Setup

### Adding Stream as Browser Source:

1. **Add Browser Source**
   - In OBS, click Sources → + → Browser Source
   - Name it "MemeTalk Stream"

2. **Configure Settings**
   ```
   URL: http://localhost:5173/stream/2025-11-04-abc123
   Width: 1920
   Height: 1080
   FPS: 30
   ✅ Shutdown source when not visible
   ✅ Refresh browser when scene becomes active
   ✅ Control audio via OBS
   ```

3. **Test Before Going Live**
   - Click "OK"
   - Video should appear immediately
   - Check for smooth playback
   - Verify audio works (if enabled)

4. **If Video Doesn't Load:**
   - Check URL is correct
   - Refresh the source (right-click → Refresh)
   - Check if backend server is running
   - Verify video format is MP4 or WebM

---

## 🐛 Troubleshooting

### Problem: Black screen in OBS Browser Source
**Solutions:**
1. Refresh the browser source
2. Check if videos are MP4 format
3. Verify video files exist and are accessible
4. Check OBS browser cache (Settings → Advanced → Clear Cache)

### Problem: Choppy playback in OBS
**Solutions:**
1. Use MP4 instead of WebM
2. Lower video resolution/bitrate
3. Enable hardware acceleration in OBS
4. Close other resource-heavy applications

### Problem: No video showing on stream page
**Solutions:**
1. Check backend server is running (`node server.js`)
2. Verify videos are uploaded in Admin panel
3. Check browser console for errors (F12)
4. Ensure Socket.IO is connected

---

## 📊 File Size Comparison

For 10-second video at 1080p:

| Format | File Size | OBS Compatibility | Quality |
|--------|-----------|-------------------|---------|
| MP4 (H.264, CRF 23) | ~2-3 MB | ⭐⭐⭐⭐⭐ Excellent | High |
| WebM (VP9) | ~1-2 MB | ⭐⭐⭐ Good | High |
| GIF (optimized) | ~5-8 MB | ⭐⭐ Works but not ideal | Medium |

---

## ✅ Recommendations

### For Best Results:
1. ✅ **Use MP4 (H.264)** for all character videos
2. ✅ Keep videos under 10 seconds (for emotions)
3. ✅ Use 1920x1080 or 1280x720 resolution
4. ✅ 30fps frame rate
5. ✅ Test in OBS before going live
6. ✅ Have fallbacks (upload both MP4 and WebM if possible)

### Video Organization:
```
public/uploads/hosts/mrcock/
  ├── normal.mp4      ⭐ Required
  ├── happy.mp4
  ├── angry.mp4
  ├── thinking.mp4
  └── laughing.mp4

public/uploads/guests/pepe/
  ├── normal.mp4      ⭐ Required
  ├── happy.mp4
  ├── angry.mp4
  └── thinking.mp4
```

---

## 🎯 Summary

**For OBS Streaming:**
- ✅ **Use MP4** - Most reliable
- ⚠️ **WebM works** - But test first
- ❌ **Avoid GIF** - Too large, poor quality

**Your system now prioritizes MP4 automatically for best OBS compatibility!**

---

## 🔗 Useful Resources

- [OBS Studio Browser Source Docs](https://obsproject.com/wiki/Sources-Guide#browser-source)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [H.264 Encoding Guide](https://trac.ffmpeg.org/wiki/Encode/H.264)
- [WebM vs MP4 Comparison](https://www.encoding.com/webm/)

---

**Need help?** Check the OBS logs (Help → Log Files) for Browser Source errors.



