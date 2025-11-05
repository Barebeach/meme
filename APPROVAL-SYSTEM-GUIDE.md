# Complete Approval & Stream System Guide

## ✅ What's Been Implemented

### 1. **Application Approval System**
- Applications now have status: `pending`, `approved`, or `rejected`
- Admin must manually approve before they appear on schedule
- Rejected applications free up the slot for others

### 2. **Unique Stream Links**
- Each approved application gets a unique stream URL
- Format: `/stream/2025-11-04-abc123xyz`
- Date-based + random token for easy identification
- Clean video-only view (no UI elements) for OBS streaming

### 3. **Start Show NOW Feature**
- Admin can manually start any approved show immediately
- Bypasses scheduled time
- Loads guest's meme data (name, image, prompt, voice)
- Perfect for flexibility and testing

### 4. **Video Thumbnails**
- FFmpeg automatically generates thumbnails at 2-second mark
- Saved alongside episode videos
- Used in Episodes page cards
- Uploaded to R2 alongside videos

### 5. **Guest Meme Data Display**
- Guest's uploaded meme image can be used in overlays
- Meme name shown in episode titles
- Stored in session for active broadcasts

---

## 🔄 Complete Workflow

### Step 1: User Burns Tokens
1. User goes to `/apply`
2. Connects Phantom wallet
3. Selects available slot from calendar
4. Burns 1M tokens
5. Uploads meme image & fills form
6. **Application created with status: `pending`**
7. Slot marked as "booked" but not confirmed

### Step 2: Admin Reviews & Approves
1. Admin logs in to `/admin` (password: `memetalk2025`)
2. Goes to **Applications** tab
3. Sees list of pending applications with:
   - Meme name & image
   - Wallet address
   - Transaction signature (link to Solscan)
   - Scheduled slot date/time
4. Clicks **✅ Approve** button
5. System generates unique stream link: `/stream/2025-11-04-abc123`
6. Admin copies stream link and shares with guest

**OR**

4. Clicks **❌ Reject** button
5. Optionally provides rejection reason
6. Slot is freed up for other users

### Step 3: Start the Show
**Option A: Manual Start (Recommended)**
1. In Applications tab, find approved application
2. Click **🚀 Start Show NOW** button
3. Confirm prompt
4. Show begins immediately with guest's meme data loaded

**Option B: Scheduled Start**
1. Go to Broadcast tab
2. Set podcast duration
3. Click **🚀 Start Show**
4. 10-second countdown begins
5. Episode starts automatically

### Step 4: OBS Streaming
#### For Admin:
1. Go to **OBS Stream Links** tab
2. Copy **Admin Stream Link**: `http://localhost:3001/?admin=true`
3. Add to OBS as Browser Source (1920x1080)
4. Stream to Pump.fun Live

#### For Guest:
1. Admin shares guest's unique stream link
2. Guest adds to their OBS as Browser Source
3. Guest can stream to their own Pump.fun page
4. Both admin and guest stream simultaneously

### Step 5: Episode Recording
1. Show runs for specified duration
2. Video/audio segments recorded with:
   - Character emotions
   - Question overlays (username + question text)
   - Guest meme data
3. FFmpeg creates final video
4. Thumbnail generated automatically
5. Uploaded to R2 (if configured)
6. Added to Episodes database
7. Appears on `/episodes` page

---

## 🎯 Admin Panel Tabs

### **Broadcast Control**
- Start/Stop shows
- Set podcast duration (minutes)
- View live status

### **OBS Stream Links**
- Admin stream link
- List of all approved guests with their unique links
- Copy buttons for easy sharing
- OBS setup guide

### **Applications**
- View all applications (pending/approved/rejected)
- Approve or reject with buttons
- See transaction signatures
- **Start Show NOW** for approved apps
- Stream links displayed after approval

### **Videos**
- Upload character videos
- Manage host/guest emotions

### **Schedule**
- View booked slots
- See which applications are assigned

### **Episodes**
- View recorded episodes
- Delete if needed

### **Settings**
- Configure token address
- Set burn amount
- Adjust show duration

---

## 🚀 Key Features

### 1. **Video-Only Stream Page**
- `/stream/:slotId` shows ONLY the video
- No navigation, chat, or UI elements
- Perfect for OBS Browser Source
- Connects to Socket.IO for real-time video updates
- Smooth crossfade transitions between emotions

### 2. **Real Thumbnails (Not Placeholders)**
- FFmpeg extracts frame at 2-second mark
- 1280x720 resolution
- Saved as `.jpg` files
- Uploaded to R2 alongside videos
- Displayed in Episodes grid

### 3. **Unique Stream URLs**
- Date-based for easy identification
- Example: `/stream/2025-11-04-x7k9m2p1`
- Each approved guest gets their own link
- No confusion between different shows

### 4. **Complete Approval Control**
- Nothing goes live without your approval
- Review all applications before confirming
- Reject and free up slots easily
- Full transaction verification

---

## 📝 Important Files Modified

### Backend:
- `routes/applications.js` - Approve/reject endpoints
- `recording/ffmpeg.js` - Thumbnail generation
- `server.js` - Application routes

### Frontend:
- `src/pages/Admin.jsx` - Approval UI, Start NOW button
- `src/pages/Stream.jsx` - NEW clean stream page
- `src/pages/Home.jsx` - Guest data loading
- `src/App.jsx` - Stream route added
- `src/styles/admin.css` - Button styles

---

## 🔐 Security & Control

### Admin Control:
- Only admin can approve applications
- Only admin can start shows
- Password protected admin panel
- Transaction signatures verified on Solana

### Guest Protection:
- Unique stream links prevent unauthorized access
- Date-based tokens easy to manage
- Stream links only generated after approval

---

## 📱 Testing Checklist

### Application Flow:
- [ ] User can burn tokens and apply
- [ ] Application shows as "pending" in admin
- [ ] Admin can approve application
- [ ] Stream link is generated and displayed
- [ ] Admin can reject application
- [ ] Rejected slot becomes available again

### Show Start:
- [ ] "Start NOW" button works for approved apps
- [ ] Guest meme data loads correctly
- [ ] Video displays properly on stream page
- [ ] Both admin and guest stream links work

### Recording:
- [ ] Episode records with all segments
- [ ] Thumbnail generates successfully
- [ ] Episode appears in Episodes page
- [ ] Thumbnail displays in episode card

---

## 🎉 You Now Have:

✅ **Complete approval system** - You control what goes live
✅ **Unique stream links** - One per approved guest
✅ **Start NOW functionality** - Manual show triggering
✅ **Real video thumbnails** - Auto-generated from episodes
✅ **Guest data integration** - Meme names/images in broadcasts
✅ **Clean stream pages** - Perfect for OBS/Pump.fun
✅ **Professional workflow** - From application to published episode

---

## 🌐 Quick Access URLs

- **Main Site**: http://localhost:5173
- **Admin Panel**: http://localhost:5173/admin
- **Episodes**: http://localhost:5173/episodes
- **Schedule**: http://localhost:5173/schedule
- **Apply**: http://localhost:5173/apply
- **About**: http://localhost:5173/about

- **Admin Stream**: http://localhost:3001/?admin=true
- **Guest Streams**: Generated per approval (e.g., /stream/2025-11-04-xxx)

---

**Everything is now ready for a complete, professional broadcast workflow!** 🚀


