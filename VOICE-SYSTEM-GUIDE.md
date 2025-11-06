# 🎤 Voice System Guide - MemeTalk.TV

## Overview
Guests can now choose from **5 different voice types** when applying for an interview. Mr. Cock's voice remains unchanged (deep, authoritative "onyx").

---

## 🎙️ Available Guest Voices

### 1. **Deep & Authoritative** (`deep`)
- **OpenAI Voice**: `onyx`
- **Description**: Like a movie trailer narrator
- **Icon**: 🎙️
- **Best For**: Serious memes, professional personas, authoritative characters

### 2. **High & Bright** (`high`)
- **OpenAI Voice**: `shimmer`
- **Description**: Energetic and expressive
- **Icon**: ✨
- **Best For**: Cute memes, energetic characters, high-pitched personas

### 3. **Calm & Neutral** (`calm`)
- **OpenAI Voice**: `alloy`
- **Description**: Smooth and balanced
- **Icon**: 🧘
- **Best For**: Chill memes, zen characters, neutral personas

### 4. **Energetic & Warm** (`energetic`)
- **OpenAI Voice**: `nova`
- **Description**: Enthusiastic and friendly
- **Icon**: ⚡
- **Best For**: Excited memes, hyper characters, friendly personas

### 5. **Raspy & Character** (`raspy`) ⭐ *DEFAULT*
- **OpenAI Voice**: `fable`
- **Description**: British expressive narrator
- **Icon**: 🎭
- **Best For**: The original Pepe voice, character actors, storytellers

---

## How It Works

### 1. **Guest Selection** (Apply Page)
When users apply for an interview:
1. They select their preferred voice from the dropdown
2. Each option shows an icon and description
3. The voice type is stored with their application

### 2. **Admin Review** (Admin Panel)
Admins can see the selected voice type for each application:
- Displayed with icon and full name (e.g., "🎙️ Deep & Authoritative")
- Shows in the Applications tab

### 3. **Live Show** (Broadcast)
When the show starts:
1. The guest's selected voice type is loaded from their application
2. The voice mapping converts it to the OpenAI voice ID
3. All guest audio uses the selected voice throughout the show

---

## Technical Implementation

### Voice Mapping (`ai/voice-mapping.js`)
```javascript
const VOICE_MAP = {
  deep: { openaiVoice: 'onyx', ... },
  high: { openaiVoice: 'shimmer', ... },
  calm: { openaiVoice: 'alloy', ... },
  energetic: { openaiVoice: 'nova', ... },
  raspy: { openaiVoice: 'fable', ... }
};
```

### Key Functions
- `getOpenAIVoice(voiceType)` - Converts user-friendly name to OpenAI voice ID
- `getVoiceDescription(voiceType)` - Returns display name
- `getAllVoices()` - Returns all available voices for UI

---

## File Changes

### New Files
- `ai/voice-mapping.js` - Voice type to OpenAI voice ID mapping

### Modified Files
- `ai/guest-prompts.js` - Uses voice mapping to get OpenAI voice
- `src/pages/Apply.jsx` - Enhanced voice selector with descriptions
- `src/pages/Admin.jsx` - Displays voice type with icons
- `src/styles/Apply.css` - Styling for voice selector

---

## Default Voice
**Raspy & Character** (`fable`) is the default to maintain consistency with the original Pepe voice.

---

## Mr. Cock's Voice
Mr. Cock ALWAYS uses the **onyx** voice (deep, authoritative) and cannot be changed.

---

## Testing the Voice System

### Test as Guest:
1. Go to `/apply`
2. Connect wallet
3. Select a time slot
4. Choose different voice types from the dropdown
5. Submit application

### Test as Admin:
1. Go to `/admin`
2. View Applications tab
3. Approve an application with a specific voice
4. Start the show
5. Verify the guest speaks with the selected voice

### Test Live:
1. Start broadcast with an approved application
2. Ask questions in chat
3. Listen to the guest's voice during responses
4. Verify it matches the selected voice type

---

## Future Enhancements (Optional)
- Voice preview samples on Apply page
- Audio clips for each voice type
- Custom voice speed/pitch adjustments
- More voice options as OpenAI adds them

---

## Troubleshooting

**Voice not changing?**
- Check that the application was saved with the correct voiceType
- Verify `ai/voice-mapping.js` is being imported correctly
- Check console logs for voice loading messages

**Voice sounds wrong?**
- Make sure OpenAI API key is configured
- Check that the mapping is correct in `voice-mapping.js`
- Verify TTS generation in `ai/tts.js` is using the voice parameter

**Default voice not working?**
- Check `guest-prompts.js` line 132 for default fallback
- Verify applications are storing voiceType field





