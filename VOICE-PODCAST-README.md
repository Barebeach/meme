# 🎙️ VOICE PODCAST SYSTEM - MemeTalk.TV

## 🔥 What I Just Built

You now have a REAL podcast with VOICES that plays live on your website!

### The Setup:

**TWO AI PERSONALITIES WITH VOICES:**

1. **Mr Cock** (Host) 🎩
   - Voice: Deep, professional (OpenAI "onyx")
   - Personality: Overly serious BBC-style journalist treating memes like fine art
   - Deadpan humor, asks intellectual questions about silly topics

2. **Pepe** (Guest) 🐸
   - Voice: Casual, friendly (OpenAI "fable")
   - Personality: Chill internet frog with meme energy
   - Self-aware, witty, uses meme slang ("based," "feels good man")

### How It Works:

1. **User asks a question** in chat (anything with ? or starting with question words)
2. **Mr Cock** picks it up, reformulates it professionally
3. **Mr Cock speaks** (you HEAR his voice via OpenAI TTS)
4. **Pepe responds** with his personality
5. **Pepe speaks** (you HEAR his voice)
6. **Both play automatically** on the website!

### Visual Features:

- 🟣 **Purple background** = Mr Cock (Host)
- 🟢 **Green background** = Pepe (Guest)
- 🔵 **Blue background** = Your messages
- 🔊 **Speaker icon** = Voice message (will play audio)
- **Pulsing animation** on speaker icon

### How to Test:

1. Go to **http://localhost:5173**
2. Enter your name
3. Ask a question like:
   - "Pepe, what do you think about crypto?"
   - "how are you pepe?"
   - "what's your take on meme coins?"
   - "why are memes so important?"

4. **WAIT 2-6 seconds** after sending
5. You'll SEE Mr Cock's message appear
6. You'll HEAR Mr Cock ask Pepe your question
7. Then Pepe responds (text + voice)
8. You'll HEAR Pepe's answer

### Question Detection:

Questions are detected if message:
- Contains `?`
- Starts with: what, why, how, when, where, who, can, will, etc.
- Mentions "mr cock", "cock", "pepe"

### Technologies Used:

- **OpenAI GPT-3.5-turbo** - AI personalities
- **OpenAI TTS (Text-to-Speech)** - Voice generation
- **Socket.io** - Real-time chat
- **React** - Frontend
- **Express** - Backend API

### Community-Driven Show:

- Questions from chat shape the conversation
- Mr Cock filters and asks the best ones
- All questions saved to database (`/api/questions`)
- Spam detection (only extreme spam blocked)
- No censorship - uncensored show!

## 🚀 Future Features:

- Episode intro/outro
- Multiple guests (switch between Doge, Wojak, etc.)
- Question voting system
- Save podcast episodes as MP3
- Guest schedule rotation

---

**Your website is NOW a living, breathing podcast with AI voices!** 🎙️🔥


