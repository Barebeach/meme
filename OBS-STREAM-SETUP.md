# 🎥 OBS Stream Setup Guide

## What I Fixed

The OBS streaming link (`/obs`) was broken due to:
1. ❌ **Wrong API endpoint** - Was trying to fetch from `/api/videos` (doesn't exist)
2. ❌ **Missing Socket.IO event listeners** - Wasn't listening to the right events
3. ❌ **No video synchronization** - Videos weren't updating with the live show

### ✅ All Fixed!

Now the `/obs` link:
- ✅ Loads videos from correct API endpoints
- ✅ Listens to real-time Socket.IO events
- ✅ Shows the EXACT SAME video as the main home page
- ✅ Updates speaker/emotion in real-time
- ✅ Shows dialogue text overlays
- ✅ No header, navigation, or UI elements
- ✅ Perfect for OBS Browser Source

---

## 🚀 How to Use the OBS Link

### Step 1: Get Your Stream URL

**Development:**
```
http://localhost:5173/obs
```

**Production:**
```
https://yourdomain.com/obs
```

### Step 2: Add to OBS Studio

1. Open OBS Studio
2. In your scene, click the **+** button under "Sources"
3. Select **"Browser"**
4. Name it: `MemeTalk Live Stream`
5. Configure:
   - **URL:** `http://localhost:5173/obs` (or your production URL)
   - **Width:** `1920`
   - **Height:** `1080`
   - ✅ Check "Shutdown source when not visible"
   - ✅ Check "Refresh browser when scene becomes active"
   - ✅ Check "Control audio via OBS" (optional)
6. Click **OK**

### Step 3: Position & Test

1. Resize/position the browser source in your scene
2. Start a test show from Admin panel
3. The OBS source should show:
   - ✅ Live video matching your main stream
   - ✅ Character videos (Mr Cock / Pepe)
   - ✅ Dialogue text at bottom
   - ✅ No UI elements

---

## 📺 Features

### Real-Time Video Sync
- Shows the EXACT SAME video as the main stream
- Updates when speaker changes
- Updates when emotion changes
- Shows transition video between speakers

### Dialogue Text Overlays
- **Purple bubble** = Mr Cock (Host)
- **Green bubble** = Pepe/Guest
- Auto-clears after 10 seconds
- Shows speaker name and message

### Auto-Start
- No interaction needed (auto-unlocked)
- Polls broadcast state every 5 seconds
- Automatically starts when show goes live
- Reconnects if connection drops

---

## 🔧 Troubleshooting

### Problem: Black screen / "Stream Ready"

**Cause:** Videos not uploaded yet

**Solution:**
1. Go to Admin panel (`/admin`)
2. Go to "Video Management" tab
3. Upload videos for:
   - Mr Cock (host)
   - Pepe (guest)
   - Transition

### Problem: "Failed to load videos" error

**Cause:** Backend server not running or videos missing

**Solution:**
1. Make sure backend is running: `npm run server`
2. Check console for specific errors
3. Upload videos in Admin panel

### Problem: Videos don't update during show

**Cause:** Socket.IO connection issues

**Solution:**
1. Check browser console for connection errors
2. Make sure both frontend and backend are running
3. Try refreshing the browser source in OBS

### Problem: No dialogue text showing

**Cause:** Socket events not being received

**Solution:**
1. Check console logs: Should see "💬 Dialogue received"
2. Make sure show is started from Admin panel
3. Try sending a test question in chat

---

## 🎬 Streaming to Pump.fun

### Option 1: Direct OBS Stream
1. Set up OBS with the `/obs` URL
2. Configure your streaming settings (Twitch, YouTube, etc.)
3. Add your stream URL to Pump.fun page

### Option 2: Embed on Pump.fun
1. Use the `/obs` URL as iframe source
2. Pump.fun will display the live video
3. No header/navigation = clean look

---

## 🐛 Debug Mode

To see detailed logs in browser console:

1. Open `/obs` in browser
2. Press `F12` to open DevTools
3. Go to **Console** tab
4. Look for:
   - `🎥 Loading videos from API...`
   - `✅ Host videos loaded: X emotions`
   - `✅ Guest videos loaded: X emotions`
   - `✅ Transition video loaded`
   - `🎥 Stream connected`
   - `💬 Dialogue received`
   - `🎭 Mr Cock speaking with emotion: X`
   - `🐸 Pepe speaking with emotion: X`

### Expected Console Output (Good):
```
🎥 Loading videos from API...
✅ Host videos loaded: 7 emotions
✅ Guest videos loaded: 6 emotions
✅ Transition video loaded
✅ Video loading complete!
🎥 Stream connected: undefined
📡 Broadcast state: { isLive: true, ... }
💬 Dialogue received: Mr Cock
🎭 Mr Cock speaking with emotion: normal
✅ Video source updated: /uploads/hosts/mrcock/normal.mp4
```

### Error Console Output (Bad):
```
❌ Failed to load host videos: ...
❌ Socket connection error: ...
```

---

## 📝 Technical Details

### Socket.IO Events Listened To:
- `connect` - Connection established
- `broadcast-state` - Show live status
- `countdown` - Episode countdown
- `podcast_dialogue` - Dialogue + speaker changes
- `show_transition` - Show transition video
- `episode_ended` - Episode finished

### Video Loading:
- Host: `/api/videos/hosts/mrcock`
- Guest: `/api/videos/guests/pepe`
- Transition: `/api/videos/transition`

### Video Format Priority (OBS):
1. **MP4** (most compatible)
2. **WebM** (fallback)
3. **GIF** (mobile fallback)

---

## ✅ Checklist

Before going live:
- [ ] Backend server running (`npm run server`)
- [ ] Frontend running (`npm run dev`)
- [ ] Videos uploaded in Admin panel
- [ ] OBS browser source configured
- [ ] Test show started successfully
- [ ] OBS source showing video
- [ ] Dialogue text appearing
- [ ] No error messages in console

---

## 🎯 URLs Available

| URL | Purpose | Shows UI |
|-----|---------|----------|
| `/` | Main home page with chat | ✅ Yes |
| `/obs` | Clean OBS stream | ❌ No |
| `/stream` | Same as `/obs` | ❌ No |
| `/stream/:slotId` | Guest-specific stream | ❌ No |

All stream URLs show the EXACT SAME video content, just without UI elements!

