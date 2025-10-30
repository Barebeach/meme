# Chat System Separation - MemeTalk.tv

## ✅ What Was Done

The chat functionality has been successfully separated into its own module (`chat.js`) without affecting the rest of the website.

## 📁 File Structure

### `chat.js` - Chat System Module
**Contains ALL chat-related functionality:**

#### 1. **AI Response Generation**
- `getMrCockResponse()` - Generates Mr. Cock's sophisticated, pretentious responses
- `getPepeResponse()` - Generates Pepe's savage, chaotic responses
- `generateSpeech()` - Text-to-speech using OpenAI TTS

#### 2. **Message Validation & Detection**
- `isQuestion()` - Detects if a message is a question (looks for @mentions, [QUESTION] tags, etc.)
- `isSpam()` - Spam detection (repeated characters, excessive emojis)

#### 3. **Emotion Detection & Analysis**
- `detectEmotion()` - Detects overall emotion from text
- `detectEmotionForSentence()` - Per-sentence emotion detection
- `analyzeEmotionalSegments()` - Breaks text into emotional segments for video
- `getValidEmotion()` - Validates emotions for each character (Mr. Cock vs. Pepe)

#### 4. **Conversation Loop & Episode Control**
- `startConversationLoop()` - Main 15-minute episode conversation loop
- `startEpisodeIntro()` - Episode introduction sequence
- `endEpisodeOutro()` - Episode outro and cleanup

#### 5. **Socket.IO Handlers**
- `setupChatHandlers()` - Sets up all chat-related socket event handlers
  - User join/disconnect
  - Message sending with rate limiting
  - Question queueing

#### 6. **State Management**
- `questions` - Array of all submitted questions
- `connectedUsers` - Map of connected users
- `conversationQueue` - Queue of questions to be answered
- Character emotion configurations

### `server.js` - Main Server
**Contains everything EXCEPT chat:**

- Express server setup
- Video recording & processing (FFmpeg)
- Episode management & database
- File uploads (multer)
- Admin endpoints
- Video creation pipeline
- Recording callbacks for chat system

## 🔗 How They Connect

The two modules are connected via:

1. **Imports in `server.js`:**
   ```javascript
   import {
     questions,
     connectedUsers,
     setupChatHandlers,
     startEpisodeIntro,
     getValidEmotion
   } from './chat.js';
   ```

2. **Recording Callbacks:**
   The chat system needs to save audio/video segments during recording. The server provides callbacks:
   ```javascript
   const recordingCallbacks = {
     isRecording: () => isRecording,
     getRecordingDir: () => recordingDir,
     onAudioSaved: (audioFilename, segmentData) => { /* saves to recording */ },
     addDialogue: (dialogue) => { /* adds to recording */ },
     onEpisodeEnd: () => { /* saves recording */ }
   };
   ```

3. **Function Calls:**
   When the episode starts, the server calls:
   ```javascript
   startEpisodeIntro(io, getAudioDuration, recordingCallbacks, broadcastState);
   ```

## 🎯 Benefits of This Separation

### For Development:
- **Isolated Chat Logic** - All AI/conversation code is in one place
- **Easy Testing** - Test chat functionality independently
- **Clean Separation** - Server handles infrastructure, chat handles AI/conversation
- **No Cross-Contamination** - Changes to chat won't affect video processing, etc.

### For Working on Chat:
You can now focus entirely on `chat.js` to modify:
- AI prompts and personalities
- Emotion detection keywords
- Conversation flow and timing
- Question handling logic
- Banter topics

Without worrying about:
- Breaking video recording
- Affecting episode database
- Messing up file uploads
- Changing server routes

## 🚀 Working with the Chat System

### To modify AI personalities:
1. Edit the system prompts in `getMrCockResponse()` or `getPepeResponse()` in `chat.js`
2. Test by running the server and asking questions

### To change emotion detection:
1. Modify the keyword arrays in `detectEmotion()` or `detectEmotionForSentence()`
2. Add new emotion types (make sure video files exist!)

### To adjust conversation timing:
1. Modify `MAX_BANTER_BEFORE_PAUSE` constant
2. Adjust `PAUSE_DURATION` or `EPISODE_DURATION` 
3. Change `calculateSpeakingTime()` formula

### To change banter topics:
1. Edit the `randomTopics` array in `startConversationLoop()`

## 🛡️ Safety

The rest of the website is **completely safe**:
- ✅ Video recording still works
- ✅ Episode database still works  
- ✅ File uploads still work
- ✅ Admin panel still works
- ✅ Video processing still works

All these features are isolated in `server.js` and won't be affected by chat changes.

## 📝 API Key Note

⚠️ **Security Reminder**: The OpenAI API key is currently in `chat.js`. For production, move it to environment variables:

```javascript
// In chat.js
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
```

Then set it in your environment:
```bash
export OPENAI_API_KEY="your-key-here"
```

---

**Ready to work on the chat system!** 🎉

All changes should be made in `chat.js` - the rest of the website will continue working perfectly.

