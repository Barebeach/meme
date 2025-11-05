# Debug Railway Recording - Step by Step

## What We Know

✅ Environment variables ARE set on Railway  
✅ `startRecording()` IS being called  
❌ NO recording summary logs appear  
❌ NO video creation logs appear  
❌ NO R2 upload logs appear  

## This Means:

Either:
1. `onEpisodeEnd()` callback isn't being called
2. `saveRecording()` is failing silently
3. FFmpeg path isn't set correctly for recording module

---

## Check Railway Logs

### 1. Check if recording starts:

Look for this log on episode start:
```
🔴 RECORDING STARTED - Episode 27
```

**If you DON'T see this**, recording isn't starting at all.

### 2. Check if recording ends:

Look for these logs when episode ends:
```
📊 ===== RECORDING SUMMARY =====
   Video segments: 10
   Audio files: 10
```

**If you DON'T see this**, `onEpisodeEnd()` isn't being called.

### 3. Check for FFmpeg errors:

Look for these errors:
```
❌ CRITICAL: No video segments recorded!
❌ ERROR: FFmpeg failed
Cannot find ffmpeg
```

**If you see these**, FFmpeg isn't working on Railway.

---

## Most Likely Issues

### Issue 1: onEpisodeEnd Not Called

The episode ending might not trigger the recording save.

**Check:** Do you see this log?
```
✅ Episode ended successfully!
```

**But NOT this log?**
```
📊 ===== RECORDING SUMMARY =====
```

This means the callback isn't connected properly.

### Issue 2: FFmpeg Path Not Set

The recording/ffmpeg.js file doesn't set the FFmpeg path itself.

It relies on server.js setting it globally BEFORE it's used.

---

## Quick Test

### Send me these logs from Railway:

1. **Startup logs** - first 100 lines after deploy
2. **Episode start logs** - when you click "Start Recording"
3. **Episode end logs** - when episode finishes

Look for:
- `🔴 RECORDING STARTED`
- `📊 RECORDING SUMMARY`  
- `🎬 STARTING VIDEO CREATION`
- Any `❌ ERROR` messages

---

## Temporary Debug Fix

Add more logging to see where it's failing.

I'll create a patch that adds verbose logging to the recording system.

