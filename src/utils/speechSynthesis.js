/**
 * Mobile-friendly Text-to-Speech using Web Speech API
 * This ALWAYS works on mobile - no audio files needed!
 */

let synthesis = null;
let currentUtterance = null;

// Initialize speech synthesis
export function initSpeechSynthesis() {
  if ('speechSynthesis' in window) {
    synthesis = window.speechSynthesis;
    console.log('✅ Speech Synthesis available');
    return true;
  } else {
    console.error('❌ Speech Synthesis not supported');
    return false;
  }
}

// Get available voices
export function getVoices() {
  if (!synthesis) return [];
  return synthesis.getVoices();
}

// Speak text using browser TTS
export function speak(text, options = {}) {
  return new Promise((resolve, reject) => {
    if (!synthesis) {
      reject(new Error('Speech synthesis not initialized'));
      return;
    }

    // Cancel any ongoing speech
    synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    currentUtterance = utterance;

    // Configure voice
    const voices = getVoices();
    
    // Try to find a good voice
    if (options.speaker === 'Mr Cock') {
      // Use a deep male voice
      const maleVoice = voices.find(v => 
        v.name.includes('Male') || 
        v.name.includes('David') ||
        v.name.includes('Daniel')
      ) || voices.find(v => v.lang.startsWith('en'));
      if (maleVoice) utterance.voice = maleVoice;
      utterance.pitch = 0.8; // Deeper
      utterance.rate = 1.0;
    } else {
      // Use a different voice for Pepe
      const voice = voices.find(v => 
        v.name.includes('Fred') ||
        v.name.includes('Alex') ||
        v.lang.startsWith('en')
      ) || voices[0];
      if (voice) utterance.voice = voice;
      utterance.pitch = 1.2; // Higher
      utterance.rate = 1.1; // Faster
    }

    utterance.volume = 1.0;
    utterance.lang = 'en-US';

    utterance.onend = () => {
      console.log(`✅ Speech finished: ${text.substring(0, 50)}...`);
      resolve();
    };

    utterance.onerror = (event) => {
      console.error('❌ Speech error:', event.error);
      reject(event.error);
    };

    console.log(`🔊 Speaking: ${text.substring(0, 50)}...`);
    synthesis.speak(utterance);
  });
}

// Stop current speech
export function stopSpeech() {
  if (synthesis) {
    synthesis.cancel();
    currentUtterance = null;
  }
}

// Check if speaking
export function isSpeaking() {
  return synthesis ? synthesis.speaking : false;
}

