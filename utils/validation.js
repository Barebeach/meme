/**
 * Check if a message is a question directed at a character
 * @param {string} text - The message text
 * @returns {{isQuestion: boolean, target: string|null}} - Whether it's a question and who it's for
 */
export function isQuestion(text) {
  const lowerText = text.toLowerCase().trim();
  
  // Support new @guest and @host mentions (and legacy @pepe/@mrcock for backwards compatibility)
  if (lowerText.startsWith('@guest') || lowerText.startsWith('@pepe')) {
    console.log('Detected @guest/@pepe mention - question for guest');
    return { isQuestion: true, target: 'guest' };
  }
  
  if (lowerText.startsWith('@host') || lowerText.startsWith('@mrcock')) {
    console.log('Detected @host/@mrcock mention - question for host');
    return { isQuestion: true, target: 'host' };
  }
  
  if (lowerText.startsWith('@both')) {
    console.log('Detected @both mention - question for both');
    return { isQuestion: true, target: 'both' };
  }
  
  if (lowerText.startsWith('[question]')) {
    console.log('Detected [QUESTION] tag');
    return { isQuestion: true, target: 'both' };
  }
  
  if (lowerText.includes('?') && (lowerText.includes('pepe') || lowerText.includes('guest') || lowerText.includes('mr cock') || lowerText.includes('mrcock') || lowerText.includes('cock') || lowerText.includes('host'))) {
    console.log('Question mark + character name detected');
    if (lowerText.includes('guest') || lowerText.includes('pepe')) {
      return { isQuestion: true, target: 'guest' };
    } else if (lowerText.includes('host') || lowerText.includes('cock')) {
      return { isQuestion: true, target: 'host' };
    }
  }
  
  return { isQuestion: false, target: null };
}

/**
 * Check if a message is spam/FUD/malicious
 * @param {string} text - The message text
 * @returns {boolean} - Whether it's spam
 */
export function isSpam(text) {
  if (/(.)\1{10,}/.test(text)) {
    console.log('Spam: Too many repeated characters');
    return true;
  }
  
  const emojiCount = (text.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu) || []).length;
  if (emojiCount > 20) {
    console.log('Spam: Too many emojis');
    return true;
  }
  
  const lowerText = text.toLowerCase();
  const fudWords = [
    'scam', 'sc@m', 'sc4m', 'scammer', 'sc@mmer',
    'rug', 'rugpull', 'rug pull', 'rugg', 'rugged',
    'fraud', 'fr@ud', 'fraudulent',
    'ponzi', 'p0nzi', 
    'honeypot', 'honey pot',
    'fake', 'f@ke', 'phishing', 'phish',
    'steal', 'st3al', 'stealing',
    'hack', 'h@ck', 'hacked', 'hacker',
    'exit scam', 'exitscam',
    'dump', 'dumping', 'pump and dump',
    'shitcoin', 'sh1tcoin', 'shit coin'
  ];
  
  for (const word of fudWords) {
    if (lowerText.includes(word)) {
      console.log(`FUD detected: "${word}" in message`);
      return true;
    }
  }
  
  const urlPattern = /(https?:\/\/|www\.|[a-zA-Z0-9-]+\.(com|net|org|io|co|tv|gg|xyz|me|info|biz|app|site|online|link|click|cc|tk|ml|ga|cf|gq))/i;
  if (urlPattern.test(text)) {
    console.log('Spam: URL/Link detected');
    return true;
  }
  
  const obfuscatedUrlPattern = /(h t t p|w w w|dot com|\.c o m|d o t)/i;
  if (obfuscatedUrlPattern.test(text)) {
    console.log('Spam: Obfuscated URL detected');
    return true;
  }
  
  return false;
}

/**
 * Calculate speaking time based on text length
 * @param {string} text - The text to speak
 * @returns {number} - Duration in milliseconds
 */
export function calculateSpeakingTime(text) {
  const words = text.split(' ').length;
  const baseTime = (words / 3) * 1000;
  return Math.max(3000, baseTime + 300);
}

/**
 * Sleep utility
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let messageIdCounter = 0;

/**
 * Generate a unique message ID
 * @returns {string} - Unique ID
 */
export function generateUniqueId() {
  return `${Date.now()}-${messageIdCounter++}-${Math.random().toString(36).substr(2, 9)}`;
}



