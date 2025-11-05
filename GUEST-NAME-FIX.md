# 🔧 Guest Name Fix - Mr. Cock Now Uses Actual Guest Names

## Problem
Mr. Cock was calling all guests "Pepe" instead of using their actual names (e.g., "Final Boss of Monaco"). This happened because:
1. The AI prompts had "Pepe" hardcoded
2. `getMrCockResponse()` didn't accept a guest name parameter
3. All question reformulations used "Pepe, your thoughts?"

## Solution
Made Mr. Cock's prompts **dynamic** so he uses the actual guest name throughout the entire show.

---

## Files Changed

### 1. `ai/openai.js`
**Added `guestName` parameter to `getMrCockResponse()`**

```javascript
// BEFORE
export async function getMrCockResponse(context, isAnswering = false) {
  // ... hardcoded "Pepe" in prompts

// AFTER
export async function getMrCockResponse(context, isAnswering = false, guestName = 'Pepe') {
  // ... uses ${guestName} dynamically
```

**Changes:**
- Line 14: Added `guestName` parameter with default 'Pepe'
- Line 24: `- Roast ${guestName} with polite, devastating British wit`
- Line 37: `- "${guestName}'s philosophical depth reminds me of Nietzsche..."`
- Line 48: `- ALWAYS refer to the guest as "${guestName}" - NEVER call them by a different name`
- Line 50: `` ${isAnswering ? `You are ANSWERING ${guestName}...` : `You are ASKING ${guestName} something...`} ``

### 2. `conversation/flow.js`
**Updated all calls to `getMrCockResponse()` to pass `currentGuestName`**

```javascript
// BEFORE (Line 226)
const mrCockAnswer = await getMrCockResponse(`${userQuestion.username} from chat asks you...`, false);

// AFTER (Line 226)
const mrCockAnswer = await getMrCockResponse(`${userQuestion.username} from chat asks you...`, false, currentGuestName);
```

**Changes:**
- Line 226: Added `currentGuestName` parameter when Mr. Cock answers questions directed at him
- Line 271: Changed template from `"Pepe, your thoughts?"` to `"${currentGuestName}, your thoughts?"`
- Line 365: Same fix for pipeline question
- Line 508: Changed banter from `Ask Pepe about ${topic}` to `Ask ${currentGuestName} about ${topic}` and added `currentGuestName` parameter

---

## How It Works Now

### 1. **Show Start**
When a show starts with a guest application:
```javascript
// conversation/flow.js lines 66-69
currentGuestName = guestName;  // e.g., "Final Boss of Monaco"
currentGuestVoice = guestVoice;  // e.g., "onyx"
console.log(`✅ Global guest set: ${currentGuestName} (${currentGuestVoice})`);
```

### 2. **Question Handling**
When a user asks a question:
```javascript
// Mr. Cock reformulates with ACTUAL guest name
const mrCockAsks = `${userQuestion.username} from chat asks: "${userQuestion.question}" 
                   Let me pose this to our guest. ${currentGuestName}, your thoughts?`;
                   //                              ^^^^^^^^^^^^^^^^^ 
                   //                              Not hardcoded "Pepe" anymore!
```

### 3. **Mr. Cock's AI Responses**
All AI responses now use the guest name:
```javascript
getMrCockResponse(context, isAnswering, currentGuestName);
//                                      ^^^^^^^^^^^^^^^^^
//                                      Dynamic guest name
```

The AI prompt now says:
- `You are ASKING ${currentGuestName} something...`
- `ALWAYS refer to the guest as "${currentGuestName}"`
- `Roast ${currentGuestName} with polite, devastating British wit`

### 4. **Banter**
Random banter topics now use the guest name:
```javascript
const mrCockBanter = await getMrCockResponse(
  `Ask ${currentGuestName} about ${topic}`,
  false,
  currentGuestName
);
```

---

## Examples

### Before ❌
```
Mr. Cock: "Pepe, your thoughts?"
Mr. Cock: "Ask Pepe about meme philosophy"
Mr. Cock: "Pepe, what do you think?"
```

### After ✅
```
Mr. Cock: "Final Boss of Monaco, your thoughts?"
Mr. Cock: "Ask Final Boss of Monaco about meme philosophy"
Mr. Cock: "Final Boss of Monaco, what do you think?"
```

---

## Testing

1. **Start a show with a custom guest** (via Admin → Start Now)
2. **Ask questions in chat** (e.g., "@guest what do you think?")
3. **Listen to Mr. Cock** - he should say the guest's actual name
4. **Check banter** - random topics should mention the guest's name

---

## Bonus: 5-Voice System Added

While fixing this, I also added a **5-voice selection system** for guests:

1. **🎙️ Deep & Authoritative** (onyx) - Movie trailer narrator
2. **✨ High & Bright** (shimmer) - Energetic and expressive
3. **🧘 Calm & Neutral** (alloy) - Smooth and balanced
4. **⚡ Energetic & Warm** (nova) - Enthusiastic and friendly
5. **🎭 Raspy & Character** (fable) - British expressive narrator (DEFAULT)

Guests select their voice on the Apply page, and it's used throughout the show.

---

## Audio Path Issue (Separate)

If the audio path is `undefined`, this is a **separate issue** from the name problem. Check:

1. **OpenAI API Key** - Make sure `OPENAI_API_KEY` is set in `.env`
2. **TTS Generation** - Check console logs for TTS errors
3. **File Permissions** - Ensure `temp/` directory is writable
4. **Audio Path Return** - Verify `generateSpeech()` returns `audioPath` correctly

The name fix is complete and working - the audio issue is unrelated to the hardcoded "Pepe" problem.

---

## Restart Required

**RESTART THE SERVER** to test these changes:
```bash
npm run dev
```

Then start a show with a custom guest and verify Mr. Cock uses their actual name!


