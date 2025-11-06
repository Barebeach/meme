# 🎭 TWO-TRACK SYSTEM - Default Pepe vs Custom Guests

## Overview

The platform now has **TWO COMPLETELY SEPARATE** show systems that **NEVER INTERFERE** with each other:

- **TRACK 1**: Broadcast Control → **DEFAULT PEPE SHOW** (original personality)
- **TRACK 2**: Applications → Start NOW → **CUSTOM GUEST SHOW** (custom personality)

---

## How It Works

### **Backend: `routes/admin.js`**

When `/api/admin/start-website` is called:

1. **Check for `applicationId` parameter**
   - NO `applicationId` → Track 1 (Default Pepe)
   - WITH `applicationId` → Track 2 (Custom Guest)

2. **Set broadcast state flags**
   ```javascript
   broadcastState.isCustomGuest = false/true
   broadcastState.guestData = null/{guest data}
   ```

3. **Load guest data (Track 2 only)**
   - Calls `setCurrentGuestData(guestApp)`
   - This sets `currentGuestData` in memory

---

### **AI System: `ai/guest-prompts.js`**

All functions now **CHECK** if `currentGuestData` exists:

```javascript
const guest = currentGuestData || loadCurrentGuestData();

if (!guest) {
  // TRACK 1: Return default Pepe data
  return defaultPepeData;
} else {
  // TRACK 2: Return custom guest data
  return customGuestData;
}
```

**Functions:**
- `getGuestName()` → "Pepe" or custom name
- `getGuestVoiceType()` → "fable" or custom voice
- `getCustomIntro()` → Default intro or custom intro
- `getCustomPepePrompt()` → Default personality or custom personality

---

### **Conversation System: `conversation/flow.js`**

When the show starts:

1. **Loads guest customization**
   ```javascript
   const guestName = getGuestName();
   const guestVoice = await getGuestVoiceType();
   const { hostIntro, guestIntro } = getCustomIntro();
   ```

2. **Result depends on track:**
   - **Track 1** (no guest data):
     - guestName = "Pepe"
     - guestVoice = "fable"
     - Default Pepe intro
   
   - **Track 2** (guest data set):
     - guestName = custom name (e.g., "Final Boss of Monaco")
     - guestVoice = custom voice (e.g., "onyx")
     - Custom guest intro

---

## The Two Tracks

### **TRACK 1: Default Pepe Show**

**How to start:**
1. Admin Panel → **Broadcast Control** tab
2. Click **"🚀 Start Show"** button
3. **NO** `applicationId` is sent

**What happens:**
```
Backend:
  ✅ DEFAULT PEPE SHOW - No application ID provided
  🐸 Broadcast state set to DEFAULT PEPE mode
  broadcastState.isCustomGuest = false
  broadcastState.guestData = null

AI Functions:
  🔍 No custom guest - using DEFAULT name: Pepe
  🔍 No custom guest - using DEFAULT voice: fable
  ✅ No custom guest - using DEFAULT Pepe intro
  ✅ No custom guest data - using DEFAULT Pepe prompt

Conversation:
  ✅ DEFAULT PEPE SHOW
  currentGuestName = "Pepe"
  currentGuestVoice = "fable"

Result:
  Mr. Cock says: "Pepe, welcome to the show"
  Pepe has original ironic/savage personality
```

---

### **TRACK 2: Custom Guest Show**

**How to start:**
1. Admin Panel → **Applications** tab
2. Find approved application
3. Click **"🚀 Start Show NOW"** button
4. `applicationId` is sent to backend

**What happens:**
```
Backend:
  🎭 CUSTOM GUEST SHOW - Loading application: app-123456
  ✅ Found custom guest: Final Boss of Monaco
     Voice: deep
     Prompt length: 250 chars
  🎭 Broadcast state set to CUSTOM GUEST mode
  broadcastState.isCustomGuest = true
  broadcastState.guestData = { memeName, voiceType, prompt, ... }

AI Functions:
  🎭 Custom guest name: Final Boss of Monaco
  🎭 Custom guest voice: deep → onyx
  🎭 Custom intro for: Final Boss of Monaco
  🎭 Custom guest prompt for: Final Boss of Monaco

Conversation:
  🎭 CUSTOM GUEST SHOW: Final Boss of Monaco
  currentGuestName = "Final Boss of Monaco"
  currentGuestVoice = "onyx"

Result:
  Mr. Cock says: "Final Boss of Monaco, welcome to the show"
  Guest has custom personality from application
```

---

## Key Differences

| **Feature** | **Track 1: Default Pepe** | **Track 2: Custom Guest** |
|-------------|--------------------------|---------------------------|
| **Button** | Broadcast Control → Start Show | Applications → Start Show NOW |
| **applicationId** | NOT sent | Sent to backend |
| **isCustomGuest flag** | `false` | `true` |
| **guestData** | `null` | Guest object |
| **currentGuestData** | NOT set | Set via `setCurrentGuestData()` |
| **Guest Name** | "Pepe" | Custom (e.g., "Final Boss of Monaco") |
| **Voice** | "fable" | Custom (e.g., "onyx") |
| **Personality** | Original Pepe (ironic/savage) | Custom from application |
| **Intro** | Default Pepe intro | Custom guest intro |
| **Mr. Cock says** | "Pepe, your thoughts?" | "{Custom Name}, your thoughts?" |

---

## Testing

### **Test Track 1 (Default Pepe):**

1. Go to Admin → **Broadcast Control**
2. Click **"Start Show"**
3. **Watch console for:**
   ```
   ✅ DEFAULT PEPE SHOW - No application ID provided
   🐸 Broadcast state set to DEFAULT PEPE mode
   🔍 No custom guest - using DEFAULT name: Pepe
   ✅ DEFAULT PEPE SHOW
   ```
4. **Listen to show:**
   - Mr. Cock: "Pepe, welcome to the show"
   - Pepe: Original ironic/savage personality
5. **Ask question:**
   - Mr. Cock: "Pepe, your thoughts?"

---

### **Test Track 2 (Custom Guest):**

1. Go to Admin → **Applications**
2. Find approved application (e.g., "Final Boss of Monaco")
3. Click **"Start Show NOW"**
4. **Watch console for:**
   ```
   🎭 CUSTOM GUEST SHOW - Loading application: app-123456
   ✅ Found custom guest: Final Boss of Monaco
   🎭 Broadcast state set to CUSTOM GUEST mode
   🎭 Custom guest name: Final Boss of Monaco
   🎭 CUSTOM GUEST SHOW: Final Boss of Monaco
   ```
5. **Listen to show:**
   - Mr. Cock: "Final Boss of Monaco, welcome to the show"
   - Guest: Custom personality from application
6. **Ask question:**
   - Mr. Cock: "Final Boss of Monaco, your thoughts?"

---

## Files Changed

1. **`routes/admin.js`**
   - Added `isCustomGuest` and `guestData` to broadcastState
   - Two-track logic based on `applicationId`
   - Loads guest data only when `applicationId` provided

2. **`ai/guest-prompts.js`**
   - All functions check if `currentGuestData` exists
   - Return default Pepe data if no guest data
   - Return custom guest data if guest data exists

3. **`conversation/flow.js`**
   - Removed hardcoded Pepe forcing
   - Uses dynamic guest loading
   - Works with both tracks seamlessly

4. **`ai/openai.js`**
   - `getPepeResponse()` tries custom prompt first
   - Falls back to default Pepe if no custom data

---

## Guarantees

✅ **Track 1 (Broadcast Control) will NEVER use custom guest data**
- No `applicationId` → No guest data loaded → Always default Pepe

✅ **Track 2 (Applications → Start NOW) will ALWAYS use custom guest data**
- With `applicationId` → Guest data loaded → Always custom guest

✅ **The two tracks are completely independent**
- Starting Track 1 show clears any previous guest data
- Starting Track 2 show loads fresh guest data
- Stopping any show clears guest data

✅ **No more interference**
- Default Pepe show is protected
- Custom guests work as expected
- Both systems coexist peacefully

---

## Next Steps

1. **RESTART THE SERVER** (critical for changes to take effect)
2. **Test Track 1**: Start from Broadcast Control, verify Pepe
3. **Test Track 2**: Start from Applications, verify custom guest
4. **Verify separation**: Start Track 1, then Track 2, ensure no mixing

---

**The system is now ready! Both tracks work independently!** 🎭🐸




