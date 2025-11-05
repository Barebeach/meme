# 🐛 QUESTIONS NOT WORKING - TROUBLESHOOTING CHECKLIST

## ⚠️ CRITICAL: Questions ONLY work when show is LIVE!

---

## 📋 Step-by-Step Checklist

### **Step 1: Start the Show**

1. Open **Admin Panel**: http://localhost:5173/admin
2. Scroll down to **"Broadcast Control"**
3. Click **"Start Website"** button
4. **DO NOT SKIP THIS!** Questions won't work without starting!

---

### **Step 2: Check Backend Console**

After clicking "Start Website", your **BACKEND CONSOLE** (where you ran `npm run server`) should show:

```
✅ Broadcast started from admin
🎬 Starting episode intro...
⚡⚡⚡ PARALLEL GENERATION: Generating BOTH intro audios at the same time!
✅ BOTH intro audios ready! Emitting Mr Cock first...
🎬 Episode intro done, starting continuous conversation!
🎙️ Starting continuous conversation loop! (15 minute episode)
✅ broadcastState updated: isLive=true, episodeStarted=true
```

**IF YOU DON'T SEE THIS** → Show didn't start → Questions won't work!

---

### **Step 3: Ask a Question**

1. Go to **Main Site**: http://localhost:5173
2. Enter your name (modal popup)
3. In chat, type: `@guest hello there`
4. Press Enter

---

### **Step 4: Check Backend Console Again**

Your **BACKEND CONSOLE** should now show:

```
Incoming message: @guest hello there
Is question: true (target: guest) - "@guest hello there"
✅ Question added to queue! Queue length: 1
Question for Pepe from YourName added to the show! They'll answer it shortly.
📝 Processing user question: @guest hello there
🔍 Question analysis: "@guest hello there"
   - Mentions GUEST: true
   - Mentions HOST/Mr Cock: false
   - Uses "you/your": false
   - 👉 Directed at: GUEST (Pepe)
⚡⚡⚡ ULTRA-FAST: Starting BOTH Mr Cock and Pepe generation in parallel!
🎙️ Mr Cock generating audio FIRST...
✅ Mr Cock dialogue emitted to frontend
🎙️ Pepe generating audio response...
✅ Pepe dialogue emitted to frontend
```

**IF YOU DON'T SEE "Question added to queue!"** → Question wasn't recognized!

---

### **Step 5: Check Frontend Console**

Your **BROWSER CONSOLE** (F12 → Console tab) should show:

```
Asking Pepe: @guest hello there
🎤 PODCAST DIALOGUE RECEIVED: Mr Cock
📥 Added Mr Cock to audio queue
🔊 PREPARING: Mr Cock
⚡ FETCHING PRE-GENERATED AUDIO: /temp/episode-XX/mrcock-XXXXX.mp3
🎬 NOW PLAYING (SYNCED): Mr Cock
[Mr. Cock asks your question]
🎤 PODCAST DIALOGUE RECEIVED: Pepe
[Pepe answers your question]
```

---

## 🚨 Common Problems & Solutions

### **Problem 1: "Episode already live, ignoring duplicate start request"**

**Cause:** You clicked "Start Website" twice  
**Solution:** This is OK! Show is already running. Just ask questions.

---

### **Problem 2: Backend shows nothing when you ask questions**

**Cause:** Show was never started  
**Solution:** 
1. Go to Admin → Stop Broadcast
2. Wait 3 seconds
3. Click "Start Website" again
4. Wait for "Starting continuous conversation loop!" message
5. Then ask questions

---

### **Problem 3: "Question added to queue" but nothing happens**

**Cause:** Conversation loop crashed or isn't running  
**Solution:**
1. Check backend console for errors
2. Restart backend: Ctrl+C → `npm run server`
3. Start show from Admin again
4. Try asking questions

---

### **Problem 4: Questions work but take FOREVER**

**Cause:** OpenAI API slow or rate limited  
**Expected:** Questions should take 5-15 seconds total  
**Solution:** Wait patiently - AI generation takes time

---

### **Problem 5: Backend says "BLOCKED: Episode cannot start during countdown"**

**Cause:** Countdown hasn't finished yet  
**Solution:** Wait 10 seconds for countdown to finish, then intro plays, THEN questions work

---

## 🎯 Quick Diagnostic Test

### **Run this EXACT sequence:**

1. **Backend Terminal:**
   - Make sure you see: `Server running on port 3001`

2. **Admin Panel (http://localhost:5173/admin):**
   - Click "Start Website"
   - Wait 30 seconds

3. **Backend Console should show:**
   ```
   🎙️ Starting continuous conversation loop!
   ```

4. **Main Site (http://localhost:5173):**
   - Type: `@guest test`
   - Press Enter

5. **Backend Console should show:**
   ```
   ✅ Question added to queue! Queue length: 1
   📝 Processing user question: @guest test
   ```

6. **If you see these messages** → Questions ARE working! Just wait 10-15 seconds for AI to generate response.

7. **If you DON'T see these messages** → Copy your ENTIRE backend console output and share it!

---

## 📞 What to Share if Still Broken

### **Copy and paste these 3 things:**

1. **Backend Console Output** (everything from when you started server)
2. **Browser Console Output** (when you ask a question)
3. **What you typed in chat**

This will help identify exactly where the flow is breaking!

---

## ✅ When It Works Correctly

### **Timeline:**

```
T+0s:  You type "@guest test" and press Enter
T+0s:  Backend: "✅ Question added to queue!"
T+1s:  Backend: "📝 Processing user question"
T+3s:  Backend: "🎙️ Mr Cock generating audio FIRST..."
T+8s:  Backend: "✅ Mr Cock dialogue emitted"
T+8s:  Frontend: "🎤 PODCAST DIALOGUE RECEIVED: Mr Cock"
T+8s:  [Mr. Cock starts asking your question with audio]
T+15s: [Mr. Cock finishes asking]
T+15s: Backend: "🎙️ Pepe generating audio response..."
T+20s: Backend: "✅ Pepe dialogue emitted"
T+20s: Frontend: "🎤 PODCAST DIALOGUE RECEIVED: Pepe"
T+20s: [Pepe starts answering your question with audio]
T+35s: [Pepe finishes answering]
T+35s: [Show continues with banter or next question]
```

**Total time: ~35 seconds** from asking to answer finishing

---

## 🔥 Nuclear Option (If Nothing Works)

```bash
# Kill everything
Ctrl+C on backend
Ctrl+C on frontend

# Delete temp files (optional)
rm -rf temp/episode-*

# Restart everything
npm run server
# (in another terminal)
npm run dev

# Start show from Admin
# Wait for "Starting continuous conversation loop!"
# Ask question
```

---

## 💡 Remember

**Questions ONLY work when:**
✅ Backend server is running  
✅ Frontend is running  
✅ Show was started from Admin panel  
✅ Countdown finished (10 seconds)  
✅ Intro played (30-40 seconds)  
✅ "Starting continuous conversation loop!" appeared  
✅ You use @guest or @host in your message  

**If ANY of these are missing, questions won't work!**

