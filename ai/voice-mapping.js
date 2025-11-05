/**
 * Voice Mapping - Maps user-friendly voice types to OpenAI TTS voices
 * 
 * OpenAI TTS Voices Available:
 * - alloy: Neutral, balanced (good for calm)
 * - echo: Warm, friendly male
 * - fable: British, expressive male (character voice)
 * - onyx: Deep, authoritative male
 * - nova: Warm, energetic female
 * - shimmer: Bright, expressive female
 */

const VOICE_MAP = {
  deep: {
    openaiVoice: 'onyx',
    description: 'Deep & Authoritative',
    example: 'Like a movie trailer narrator',
    icon: '🎙️'
  },
  high: {
    openaiVoice: 'shimmer',
    description: 'High & Bright',
    example: 'Energetic and expressive',
    icon: '✨'
  },
  calm: {
    openaiVoice: 'alloy',
    description: 'Calm & Neutral',
    example: 'Smooth and balanced',
    icon: '🧘'
  },
  energetic: {
    openaiVoice: 'nova',
    description: 'Energetic & Warm',
    example: 'Enthusiastic and friendly',
    icon: '⚡'
  },
  raspy: {
    openaiVoice: 'fable',
    description: 'Raspy & Character',
    example: 'British expressive narrator',
    icon: '🎭'
  }
};

/**
 * Get OpenAI voice ID from user-friendly voice type
 */
export function getOpenAIVoice(voiceType) {
  const voice = VOICE_MAP[voiceType];
  if (!voice) {
    console.warn(`⚠️ Unknown voice type: ${voiceType}, defaulting to 'fable'`);
    return 'fable';
  }
  return voice.openaiVoice;
}

/**
 * Get voice description for UI display
 */
export function getVoiceDescription(voiceType) {
  const voice = VOICE_MAP[voiceType];
  return voice ? voice.description : 'Unknown';
}

/**
 * Get voice example for UI display
 */
export function getVoiceExample(voiceType) {
  const voice = VOICE_MAP[voiceType];
  return voice ? voice.example : '';
}

/**
 * Get voice icon for UI display
 */
export function getVoiceIcon(voiceType) {
  const voice = VOICE_MAP[voiceType];
  return voice ? voice.icon : '🔊';
}

/**
 * Get all available voices for UI display
 */
export function getAllVoices() {
  return Object.keys(VOICE_MAP).map(key => ({
    id: key,
    ...VOICE_MAP[key]
  }));
}

export default {
  getOpenAIVoice,
  getVoiceDescription,
  getVoiceExample,
  getVoiceIcon,
  getAllVoices
};



