# 🔍 DEBUG GUIDE - Guest Name Not Working

## What I Just Added

I've added **EXTENSIVE DEBUG LOGS** at every step to track exactly where the guest name is failing.

---

## 🚀 **CRITICAL: YOU MUST RESTART THE SERVER!**

The old code is still running in memory. Changes won't take effect until you restart!

```bash
# STOP the server (Ctrl+C)
# Then START it again:
npm run dev
```

---

## 📊 **What You'll See in Console**

When you click "Start Show NOW" on an application, you should see:

### **Step 1: Application Loading** (`routes/admin.js`)
```
🔍🔍🔍 APPLICATION ID PROVIDED: app-123456789
   Looking for applications file: C:\...\applications.json
   File exists: true
   Total applications: 1
   Found guest app: YES
   Guest app name: Final Boss of Monaco
   Guest app voice: deep
🎭🎭🎭 Guest data loaded for: Final Boss of Monaco 🎭🎭🎭
```

**❌ If you DON'T see this:**
- You clicked the WRONG button (Broadcast Control → Start Show)
- You need to click Applications → Start Show NOW on a specific guest

### **Step 2: Guest Data Set** (`ai/guest-prompts.js`)
```
🎭🎭🎭 GUEST DATA SET!!! 🎭🎭🎭
   Name: Final Boss of Monaco
   Voice: deep
   Prompt length: 250 chars
   Full data: { ... }
```

**❌ If you DON'T see this:**
- `setCurrentGuestData()` was never called
- Application ID wasn't passed correctly
- Check Step 1 logs

### **Step 3: Guest Info Loaded** (`conversation/flow.js`)
```
✅✅✅ GLOBAL GUEST SET!!! ✅✅✅
   currentGuestName = "Final Boss of Monaco"
   currentGuestVoice = "onyx"
   guestName variable = "Final Boss of Monaco"
   guestVoice variable = "onyx"
```

**❌ If this shows "Pepe":**
- `getGuestName()` didn't find the guest data
- `currentGuestData` is null
- Check Step 2 logs

### **Step 4: Question Asked** (`conversation/flow.js`)
```
🔍 DEBUG: Guest name for question reformulation: "Final Boss of Monaco"
```

**❌ If this shows "Pepe":**
- `currentGuestName` global variable is wrong
- Check Step 3 logs

### **Step 5: Mr Cock Response** (`ai/openai.js`)
```
🔍 getMrCockResponse called with guestName: "Final Boss of Monaco"
```

**❌ If this shows "Pepe":**
- Function call didn't pass the right parameter
- Check Step 4 logs

---

## 🐛 **Possible Issues**

### Issue 1: Application Not Found
**Symptoms:**
```
❌ NO APPLICATION FOUND WITH ID: app-123456789
```

**Solution:**
1. Check `applications.json` exists
2. Verify the application ID matches
3. Make sure application status is "approved"

### Issue 2: Guest Data Not Set
**Symptoms:**
```
⚠️ NO APPLICATION ID PROVIDED - Using default Pepe
```

**Solution:**
- You clicked the WRONG button
- Use: **Applications tab → Start Show NOW** (on a specific guest)
- NOT: **Broadcast Control → Start Show**

### Issue 3: Name Still Says "Pepe" in Questions
**Symptoms:**
- Console shows correct name
- But Mr. Cock still says "Pepe, your thoughts?"

**Solution:**
- Question text contains "@pepe"
- My fix replaces "@pepe" with guest name
- If not working, check `conversation/flow.js` lines 273-278

---

## 🔬 **Step-by-Step Test**

### 1. **RESTART THE SERVER**
```bash
# Kill it (Ctrl+C)
npm run dev
```

### 2. **Go to Admin Panel**
```
http://localhost:5173/admin
```

### 3. **Navigate to Applications Tab**
Click the "Applications" tab (NOT "Broadcast Control")

### 4. **Find Your Application**
Example: "Final Boss of Monaco"
Status: ✅ Approved

### 5. **Click "Start Show NOW"**
The button should be under the approved application

### 6. **WATCH THE CONSOLE**
You should see all the debug messages in order:
1. 🔍 APPLICATION ID PROVIDED
2. 🎭 Guest data loaded
3. ✅ GLOBAL GUEST SET
4. (countdown starts)

### 7. **Ask a Question in Chat**
Type: "@pepe test question"

### 8. **Check Console Again**
You should see:
```
🔍 DEBUG: Guest name for question reformulation: "Final Boss of Monaco"
🔍 getMrCockResponse called with guestName: "Final Boss of Monaco"
```

### 9. **Listen to Mr. Cock**
He should say: "Final Boss of Monaco, your thoughts?"

---

## 📝 **What Changed**

### Files Modified:

1. **`routes/admin.js`** (Lines 86-116)
   - Added debug logs for application loading
   - Shows if application ID was provided
   - Shows if guest data was found
   - Shows guest name and voice

2. **`ai/guest-prompts.js`** (Lines 174-181)
   - Added detailed logging when guest data is set
   - Shows full guest object
   - Shows name, voice, and prompt length

3. **`ai/guest-prompts.js`** (Lines 139-148)
   - Added logging in `getGuestName()`
   - Shows what name is being returned
   - Shows if `currentGuestData` exists

4. **`conversation/flow.js`** (Lines 66-73)
   - Added debug logs when global guest is set
   - Shows both the variable and global values

5. **`conversation/flow.js`** (Lines 273-278)
   - Added question text cleaning (replaces @pepe with actual name)
   - Shows the cleaned question text

6. **`ai/openai.js`** (Line 15)
   - Added log showing what guestName parameter was passed

---

## ❌ **If It STILL Says "Pepe"**

**Copy and paste this ENTIRE section from your console:**

```
[Paste everything from when you clicked "Start Show NOW" 
 to when Mr. Cock said the name]
```

Then I can see EXACTLY where it's breaking!

---

## ✅ **Expected Full Flow**

```
🔍🔍🔍 APPLICATION ID PROVIDED: app-1762266373449
   Looking for applications file: ...
   File exists: true
   Total applications: 1
   Found guest app: YES
   Guest app name: Final Boss of Monaco
   Guest app voice: deep
🎭🎭🎭 Guest data loaded for: Final Boss of Monaco 🎭🎭🎭

[countdown starts]

🔍 getGuestName() called - returning: "Final Boss of Monaco"
   currentGuestData: EXISTS
   currentGuestData.memeName: Final Boss of Monaco

✅✅✅ GLOBAL GUEST SET!!! ✅✅✅
   currentGuestName = "Final Boss of Monaco"
   currentGuestVoice = "onyx"

[user asks question]

🔍 DEBUG: Guest name for question reformulation: "Final Boss of Monaco"
🔍 getMrCockResponse called with guestName: "Final Boss of Monaco"

[Mr. Cock says "Final Boss of Monaco, your thoughts?"]
```

---

**RESTART THE SERVER AND TRY AGAIN!**

If it still doesn't work, paste the console logs and I'll find the exact problem!



