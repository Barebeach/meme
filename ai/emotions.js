/**
 * Character-specific valid emotions
 */
const characterEmotions = {
  'mrcock': ['normal', 'angry', 'sad', 'laughing', 'thinking'],
  'pepe': ['normal', 'angry', 'happy', 'sad', 'screaming', 'thinking']
};

let lastEmotion = 'normal';
let emotionRotationIndex = 0;
const availableEmotions = ['normal', 'angry', 'happy', 'sad', 'laughing', 'thinking', 'screaming'];

/**
 * Get a valid emotion for a character, with fallback
 * @param {string} emotion - The requested emotion
 * @param {string} character - The character ID ('mrcock' or 'pepe')
 * @returns {string} - A valid emotion for that character
 */
export function getValidEmotion(emotion, character) {
  const validEmotions = characterEmotions[character] || ['normal'];
  
  if (validEmotions.includes(emotion)) return emotion;
  
  const emotionMap = {
    'happy': character === 'mrcock' ? 'laughing' : 'happy',
    'laughing': character === 'pepe' ? 'happy' : 'laughing',
    'screaming': character === 'mrcock' ? 'angry' : 'screaming',
    'shocked': 'thinking'
  };
  
  const mappedEmotion = emotionMap[emotion];
  if (mappedEmotion && validEmotions.includes(mappedEmotion)) {
    console.log(`🔄 Emotion fallback: ${character} - ${emotion} → ${mappedEmotion}`);
    return mappedEmotion;
  }
  
  console.log(`⚠️ Emotion fallback to normal: ${character} - ${emotion}`);
  return 'normal';
}

/**
 * Convert emotion segments for a specific character
 * @param {Array} segments - Array of emotion segments
 * @param {string} character - Character ID ('mrcock' or 'pepe')
 * @returns {Array} - Array of segments with character-appropriate emotions
 */
export function convertSegmentsForCharacter(segments, character) {
  if (!segments || segments.length === 0) return segments;
  
  return segments.map(segment => ({
    ...segment,
    emotion: getValidEmotion(segment.emotion, character)
  }));
}

/**
 * Detect emotion for a sentence
 * @param {string} text - The sentence to analyze
 * @returns {string} - The detected emotion
 */
export function detectEmotionForSentence(text) {
  const lowerText = text.toLowerCase();
  
  if (text === text.toUpperCase() || (text.match(/!/g) || []).length >= 2) return 'screaming';
  
  const aggressiveWords = ['fuck', 'shit', 'ass', 'broke', 'dumb', 'stupid', 'bitch', 'pussy', 'clown', 'pathetic', 'slap', 'punch', 'idiot', 'hate', 'beat'];
  if (aggressiveWords.some(word => lowerText.includes(word))) return 'angry';
  
  const laughWords = ['haha', 'lmao', 'lol', 'hilarious', 'funny', 'comedy', 'joke', 'rofl', 'dead'];
  if (laughWords.some(word => lowerText.includes(word))) return 'laughing';
  
  const sadWords = ['sad', 'unfortunate', 'tragedy', 'terrible', 'awful', 'horrible', 'disappointed', 'sorry'];
  if (sadWords.some(word => lowerText.includes(word))) return 'sad';
  
  const thinkWords = ['wonder', 'think', 'consider', 'perhaps', 'maybe', 'curious', 'interesting', 'question', 'philosophical'];
  if (thinkWords.some(word => lowerText.includes(word))) return 'thinking';
  
  const happyWords = ['love', 'awesome', 'amazing', 'great', 'wonderful', 'fantastic', 'best', 'epic', 'based', 'legend', 'perfect', 'excellent'];
  if (happyWords.some(word => lowerText.includes(word))) return 'happy';
  
  return 'normal';
}

/**
 * Analyze text and create emotional segments
 * @param {string} text - The full text to analyze
 * @param {number} baseDuration - The base duration in milliseconds
 * @returns {Array} - Array of emotion segments with timing
 */
export function analyzeEmotionalSegments(text, baseDuration) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const segments = [];
  let currentTime = 0;
  const avgTimePerSentence = baseDuration / sentences.length;
  
  sentences.forEach((sentence) => {
    const emotion = detectEmotionForSentence(sentence.trim());
    segments.push({
      text: sentence.trim(),
      emotion: emotion,
      startTime: currentTime,
      duration: avgTimePerSentence
    });
    currentTime += avgTimePerSentence;
  });
  
  return segments;
}

/**
 * Detect overall emotion for text (with rotation and context)
 * @param {string} text - The text to analyze
 * @returns {string} - The detected emotion
 */
export function detectEmotion(text) {
  const lowerText = text.toLowerCase();
  
  const screamWords = ['!!!', 'holy shit', 'wtf', 'what the fuck', 'omg', 'jesus', 'damn', 'whoa', 'shocking', 'unbelievable', 'no way'];
  for (const word of screamWords) {
    if (lowerText.includes(word)) {
      lastEmotion = 'screaming';
      return 'screaming';
    }
  }
  
  const aggressiveWords = ['fuck you', 'shit', 'beat', 'ass', 'broke', 'dumb', 'stupid', 'bitch', 'pussy', 'clown', 'pathetic', 'slap', 'punch', 'idiot', 'hate', 'kill', 'destroy', 'piss off', 'shut up'];
  for (const word of aggressiveWords) {
    if (lowerText.includes(word)) {
      lastEmotion = 'angry';
      return 'angry';
    }
  }
  
  const laughWords = ['haha', 'lmao', 'lol', 'hilarious', 'funny as', 'comedy', 'joke', '😂', 'rofl', 'dead', 'crying'];
  for (const word of laughWords) {
    if (lowerText.includes(word)) {
      lastEmotion = 'laughing';
      return 'laughing';
    }
  }
  
  const sadWords = ['sad', 'depressing', 'unfortunate', 'tragedy', 'terrible', 'awful', 'horrible', 'sucks', 'disappointed', 'sorry', 'crying', 'tear'];
  for (const word of sadWords) {
    if (lowerText.includes(word)) {
      lastEmotion = 'sad';
      return 'sad';
    }
  }
  
  const thinkWords = ['wonder', 'think', 'consider', 'perhaps', 'maybe', 'curious', 'interesting', 'question', 'ponder', 'philosophical'];
  for (const word of thinkWords) {
    if (lowerText.includes(word)) {
      lastEmotion = 'thinking';
      return 'thinking';
    }
  }
  
  const happyWords = ['love', 'awesome', 'amazing', 'great', 'wonderful', 'fantastic', 'best', 'epic', 'based', 'legend', 'king', 'perfect', 'vibes', 'feels good', 'excellent', 'beautiful'];
  for (const word of happyWords) {
    if (lowerText.includes(word)) {
      lastEmotion = 'happy';
      return 'happy';
    }
  }
  
  if (Math.random() > 0.6) {
    emotionRotationIndex = (emotionRotationIndex + 1) % availableEmotions.length;
    lastEmotion = availableEmotions[emotionRotationIndex];
    console.log(`🎭 Rotating to emotion: ${lastEmotion}`);
    return lastEmotion;
  }
  
  return lastEmotion;
}

