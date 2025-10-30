# MemeTalk.TV Admin System - Complete Guide

## 🚀 Overview

The MemeTalk.TV platform now includes a comprehensive admin system for managing broadcasts, schedules, videos, and recorded episodes. Here's everything you need to know:

## ✨ Features Implemented

### 1. **Admin Panel** (`/admin`)
- **Authentication**: Password-protected (default: `memetalk2025`)
- **Four Main Sections**:
  - 📡 Broadcast Control
  - 🎬 Video Management
  - 📅 Schedule Management
  - 🎥 Episodes Archive

### 2. **Broadcast Control**
- **Start Website Button**: Triggers a 90-second (1.5 minute) countdown
- **Synchronized State**: All users see the same countdown/episode state (no restart on refresh)
- **Automatic Episode Start**: After countdown, automatically starts the podcast episode
- **Stop Website Button**: Ends the broadcast and saves the episode recording
- **Live Status Display**: Shows current broadcast state, countdown, and start time

### 3. **Video Upload System**
- **Character Types**: Hosts (Mr Cock) and Guests (Pepe, Troll, etc.)
- **Emotion States**:
  - 😐 Normal
  - 😊 Happy
  - 😢 Sad
  - 😠 Angry
  - 😂 Laughing
  - 😱 Screaming
  - 😲 Shocked
  - 🤔 Thinking
- **Dynamic Loading**: Frontend automatically loads uploaded videos
- **Fallback System**: Uses default videos from `/public` if no custom videos uploaded
- **File Support**: MP4 and WebM formats, up to 100MB per file

### 4. **Scheduling System**
- **Episode Planning**: Schedule episodes with specific guests at specific times
- **Guest Management**: Each scheduled episode has a guest name and ID
- **Duration Control**: Set episode duration (5-60 minutes)
- **CRUD Operations**: Create, view, and delete schedule entries

### 5. **Live Recording System**
- **Automatic Recording**: Starts when "Start Website" is clicked
- **Captures Everything**:
  - All dialogue between host and guest
  - User questions and answers
  - Timestamps for each message
  - Emotion states for each line
  - Question counts
- **Auto-Save**: When "Stop Website" is clicked, episode is automatically saved to database

### 6. **Episodes Archive** (`/episodes`)
- **Public Viewing**: Users can browse all recorded episodes
- **Episode Information**:
  - Title
  - Guest name
  - Recording date
  - Duration
  - Description
  - Video link (when available)
- **Beautiful UI**: Grid layout with hover effects and detailed cards

### 7. **Social Media Integration**
- **YouTube**: Links to @memetalk
- **X (Twitter)**: Links to @memetalktv
- **Telegram**: Links to @memetalktv
- **Animated Icons**: Hover effects and smooth transitions

## 📁 File Structure

```
memetalk-app/
├── server.js                 # Backend with all API endpoints
├── storage.js                # Database/storage management
├── data.json                 # Persistent data storage
├── public/
│   └── uploads/              # Uploaded videos
│       ├── hosts/            # Host videos (Mr Cock)
│       │   └── mrcock/
│       │       ├── normal.mp4
│       │       ├── happy.mp4
│       │       ├── angry.mp4
│       │       └── ...
│       └── guests/           # Guest videos (Pepe, etc.)
│           ├── pepe/
│           │   ├── normal.mp4
│           │   ├── happy.mp4
│           │   └── ...
│           └── troll/
│               └── ...
└── src/
    ├── pages/
    │   ├── Home.jsx          # Live show page
    │   ├── Admin.jsx         # Admin panel
    │   ├── Episodes.jsx      # Episode archive
    │   ├── Schedule.jsx      # Schedule page
    │   └── About.jsx         # About page
    └── App.css               # All styles

## 🎮 How To Use

### For Admins:

1. **Access Admin Panel**:
   - Navigate to `http://localhost:5173/admin`
   - Enter password: `memetalk2025`

2. **Upload Videos** (Before First Episode):
   - Go to "Video Management" tab
   - For Mr Cock:
     - Character Type: Host
     - Character ID: `mrcock`
     - Upload videos for each emotion state
   - For Guests (e.g., Pepe):
     - Character Type: Guest
     - Character ID: `pepe` (or other guest ID)
     - Upload videos for each emotion state

3. **Schedule Future Episodes**:
   - Go to "Schedule" tab
   - Fill in guest details:
     - Guest Name: "Troll Face"
     - Guest ID: "troll"
     - Scheduled Time: Select date/time (24 hours from first episode)
     - Duration: 15 minutes (default)
   - Click "Add to Schedule"

4. **Start Website/Episode**:
   - Go to "Broadcast Control" tab
   - Click "Start Website (1.5 min countdown)"
   - Countdown begins immediately (90 seconds)
   - After countdown, episode automatically starts
   - Recording starts automatically

5. **Monitor Episode**:
   - Check broadcast status in admin panel
   - Watch dialogue count increase
   - Monitor user questions

6. **Stop Episode**:
   - Click "Stop Website"
   - Recording is saved automatically
   - Episode appears in archive immediately

7. **View Recorded Episodes**:
   - Go to "Episodes Archive" tab
   - See all past episodes with metadata
   - Delete episodes if needed

### For Users:

1. **Watch Live**:
   - Go to `http://localhost:5173`
   - See countdown if episode hasn't started
   - Watch episode after countdown ends
   - Videos switch dynamically based on who's speaking and emotions

2. **View Past Episodes**:
   - Click "Episodes" in navigation
   - Browse all recorded episodes
   - Click "Watch Episode" (when video URL is available)

## 🔧 API Endpoints

### Admin Endpoints:
- `GET /api/admin/broadcast-state` - Get current broadcast state
- `POST /api/admin/start-website` - Start website with countdown
- `POST /api/admin/stop-website` - Stop website and save episode
- `POST /api/admin/upload-video` - Upload character video
- `GET /api/admin/schedule` - Get all scheduled episodes
- `POST /api/admin/schedule` - Add schedule entry
- `DELETE /api/admin/schedule/:id` - Delete schedule entry
- `GET /api/admin/episodes` - Get all recorded episodes
- `POST /api/admin/episodes` - Add episode manually
- `DELETE /api/admin/episodes/:id` - Delete episode

### Public Endpoints:
- `GET /api/videos/:type/:characterId` - Get videos for a character
- `POST /api/countdown` - Start countdown (legacy, now in start-website)
- `POST /api/start-episode` - Start episode (legacy, now in start-website)

## 💾 Data Structure

### Broadcast State:
```json
{
  "isLive": false,
  "countdown": null,
  "episodeStarted": false,
  "currentEpisode": null,
  "startTime": null
}
```

### Schedule Entry:
```json
{
  "id": "1234567890",
  "guestName": "Troll Face",
  "guestId": "troll",
  "scheduledTime": "2025-10-28T14:30:00Z",
  "duration": 15,
  "createdAt": "2025-10-27T10:00:00Z"
}
```

### Episode Recording:
```json
{
  "id": "1234567890",
  "title": "MemeTalk Live - Pepe the Meme",
  "guestName": "Pepe the Meme",
  "guestId": "pepe",
  "duration": "15 min",
  "startTime": "2025-10-27T10:01:30Z",
  "endTime": "2025-10-27T10:16:30Z",
  "dialogueCount": 42,
  "questionsCount": 8,
  "videoUrl": null,
  "description": "Live podcast episode featuring Pepe the Meme answering community questions.",
  "createdAt": "2025-10-27T10:16:30Z"
}
```

## 🎯 Workflow Example

### Day 1 (First Episode):
1. Admin uploads videos for Mr Cock and Pepe (all emotions)
2. Admin clicks "Start Website" at 1:00 PM
3. 90-second countdown begins
4. At 1:01:30 PM, episode starts automatically with Pepe
5. Users join, ask questions, episode runs for ~15 minutes
6. At 1:16:30 PM, admin clicks "Stop Website"
7. Episode is recorded and saved to archive

### Day 2 (24 hours later - Second Guest):
1. Admin uploads videos for new guest "Troll" (all emotions)
2. Admin creates schedule entry:
   - Guest: Troll Face
   - Time: 1:00 PM (next day)
   - Duration: 15 minutes
3. At scheduled time, admin clicks "Start Website"
4. Countdown begins, then episode starts with Troll
5. Videos dynamically switch to Troll's videos
6. Episode runs and is recorded
7. After stopping, episode appears in archive

## 🎨 Dynamic Video System

The system automatically:
1. Fetches video mappings for current guest from backend
2. Loads uploaded videos if available
3. Falls back to default videos in `/public` if not
4. Switches videos based on:
   - **Speaker**: Host (Mr Cock) vs Guest (Pepe/Troll/etc.)
   - **Emotion**: Detected from AI responses (happy, angry, normal, etc.)
5. Smooth crossfade transitions (0.8s cubic-bezier)

## 📝 Notes

- **Password Security**: Change `ADMIN_PASSWORD` in `src/pages/Admin.jsx` for production
- **Storage**: Currently uses `data.json` file. For production, consider PostgreSQL/MongoDB
- **Video Recording**: Current system tracks dialogue metadata. For actual video recording, integrate with streaming services (OBS, FFmpeg, etc.)
- **Scheduled Episodes**: Currently manual trigger. Could add cron jobs for automatic start
- **File Uploads**: Videos stored in `public/uploads/`. Consider cloud storage (S3, Cloudinary) for production

## 🚀 Next Steps (Optional Enhancements)

1. **Actual Video Recording**: Integrate FFmpeg or streaming service to capture video
2. **Cloud Storage**: Upload recorded videos to YouTube/S3/Cloudinary
3. **Automated Scheduling**: Cron jobs to start episodes at scheduled times
4. **Multi-Admin Support**: Database-backed admin user management
5. **Episode Editing**: Trim/edit recordings before publishing
6. **Thumbnail Generation**: Auto-generate episode thumbnails
7. **Analytics**: Track views, engagement, popular questions
8. **Guest Profiles**: Dedicated pages for each guest character

## 🛠️ Dependencies Added

- `multer` - File upload handling
- `uuid` - Unique ID generation

## ✅ All Features Complete

✅ Admin panel with authentication  
✅ Video upload system (multiple emotions per character)  
✅ Backend API for uploads and management  
✅ Scheduling system  
✅ Broadcast state management (synchronized across users)  
✅ Dynamic video loading system  
✅ Live recording system  
✅ Episodes archive page  
✅ Social media links  
✅ Database/storage system  

---

**You're all set! 🎉**

The system is fully functional and ready to use. Access the admin panel at `/admin` and start uploading videos for your first episode!


