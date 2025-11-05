/**
 * CHAT.JS - Main entry point for chat/conversation functionality
 * 
 * This file re-exports all functionality from modularized files.
 * Previously 1024 lines, now split into logical modules.
 */

// AI & Speech
export { getMrCockResponse, getPepeResponse } from './ai/openai.js';
export { generateSpeech } from './ai/tts.js';
export { detectEmotion, detectEmotionForSentence, analyzeEmotionalSegments, getValidEmotion } from './ai/emotions.js';

// Validation & Utilities
export { isQuestion, isSpam, calculateSpeakingTime, sleep, generateUniqueId } from './utils/validation.js';

// Chat Handlers & State
export { setupChatHandlers, connectedUsers, conversationQueue, questions } from './conversation/handlers.js';

// Conversation Flow
export { startConversationLoop, startEpisodeIntro, endEpisodeOutro, getIsConversationActive, setConversationActive } from './conversation/flow.js';
