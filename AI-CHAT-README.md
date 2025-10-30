# 🤖 AI Chat Implementation - Mr Cock Host

## ⚠️ IMPORTANT: REGENERATE YOUR API KEY!
You shared your OpenAI API key publicly. **Immediately regenerate it** at: https://platform.openai.com/api-keys

Then update it in `server.js` line 18.

## How to Run

### 1. Start the Backend Server (AI Host)
```bash
npm run server
```
This runs on **http://localhost:3001**

### 2. Start the Frontend (in another terminal)
```bash
npm run dev
```
This runs on **http://localhost:5173**

## Features Implemented ✅

1. **Name Prompt** - Users must enter their name before chatting
2. **Rate Limiting** - 2-second cooldown between messages
3. **Spam Detection** - Auto-deletes spam (excessive caps, repeated chars, too many emojis)
4. **User Count** - Shows actual users +17
5. **AI Host "Mr Cock"** - Responds to questions using OpenAI GPT-3.5-turbo
6. **Question Storage** - Automatically saves all questions (not other messages)
7. **Uncensored** - No word filtering, keeps messages as users type them
8. **Real-time Chat** - Using Socket.io for instant messaging

## How It Works

- Users enter name → Modal appears
- Messages have 2-sec cooldown → Warning shows if too fast
- Questions (detected by ? or question words) → Saved to database
- Mr Cock AI responds to questions within 2 seconds
- Spam messages → Automatically deleted with warning
- Bad words → Allowed (uncensored show)

## Question Database

Questions are stored in memory. To view them:
```bash
GET http://localhost:3001/api/questions
```

For persistent storage, connect a real database (MongoDB, PostgreSQL, etc.)

## Customization

Edit `server.js` to:
- Change AI personality (line 44-48)
- Adjust spam detection rules (line 65-77)
- Modify rate limit time (line 22)
- Add more AI responses


