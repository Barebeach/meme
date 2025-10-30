/**
 * ==========================================================================
 * CHAT SYSTEM MODULE - MemeTalk.tv
 * ==========================================================================
 * 
 * This module contains ALL chat-related functionality including:
 * 
 * 1. AI RESPONSE GENERATION
 *    - getMrCockResponse() - Generates Mr. Cock's sophisticated responses
 *    - getPepeResponse() - Generates Pepe's savage responses
 *    - generateSpeech() - Text-to-speech using OpenAI
 * 
 * 2. MESSAGE VALIDATION & DETECTION
 *    - isQuestion() - Detects if a message is a question
 *    - isSpam() - Spam detection
 * 
 * 3. EMOTION DETECTION & ANALYSIS
 *    - detectEmotion() - Detects emotion from text
 *    - detectEmotionForSentence() - Per-sentence emotion detection
 *    - analyzeEmotionalSegments() - Breaks text into emotional segments
 *    - getValidEmotion() - Validates emotions for characters
 * 
 * 4. CONVERSATION LOOP & EPISODE CONTROL
 *    - startConversationLoop() - Main conversation loop (15-minute episodes)
 *    - startEpisodeIntro() - Episode introduction sequence
 *    - endEpisodeOutro() - Episode outro and cleanup
 * 
 * 5. SOCKET.IO HANDLERS
 *    - setupChatHandlers() - Sets up all chat-related socket handlers
 * 
 * 6. STATE MANAGEMENT
 *    - questions[] - Array of submitted questions
 *    - connectedUsers - Map of connected users
 *    - conversationQueue - Queue of questions to answer
 * 
 * ==========================================================================
 */

import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// OpenAI Configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Chat State
const questions = [];
const userLastMessage = new Map();
const connectedUsers = new Map();
const MESSAGE_COOLDOWN = 2000;

// Conversation State
let conversationQueue = [];
let isConversationActive = false;
let conversationHistory = [];
let banterCount = 0;
const MAX_BANTER_BEFORE_PAUSE = 1;
const PAUSE_DURATION = 8000;
const EPISODE_DURATION = 15 * 60 * 1000;
let episodeStartTime = null;

// Emotion Configuration
let lastEmotion = 'normal';
let emotionRotationIndex = 0;
const availableEmotions = ['normal', 'angry', 'happy', 'sad', 'laughing', 'thinking', 'screaming'];

const characterEmotions = {
  'mrcock': ['normal', 'angry', 'sad', 'laughing', 'thinking'],
  'pepe': ['normal', 'angry', 'happy', 'sad', 'screaming', 'thinking']
};

// ============================================
// MESSAGE VALIDATION & DETECTION
// ============================================

function isQuestion(text) {
  const lowerText = text.toLowerCase().trim();
  
  if (lowerText.startsWith('@pepe') || lowerText.startsWith('@mrcock') || lowerText.startsWith('@both')) {
    console.log('Detected @ mention - treating as question');
    return { isQuestion: true, target: lowerText.startsWith('@pepe') ? 'pepe' : lowerText.startsWith('@mrcock') ? 'mrcock' : 'both' };
  }
  
  if (lowerText.startsWith('[question]')) {
    console.log('Detected [QUESTION] tag');
    return { isQuestion: true, target: 'both' };
  }
  
  if (lowerText.includes('?') && (lowerText.includes('pepe') || lowerText.includes('mr cock') || lowerText.includes('mrcock') || lowerText.includes('cock'))) {
    console.log('Question mark + character name detected');
    return { isQuestion: true, target: lowerText.includes('pepe') ? 'pepe' : 'mrcock' };
  }
  
  return { isQuestion: false, target: null };
}

function isSpam(text) {
  // Repeated characters spam
  if (/(.)\1{10,}/.test(text)) {
    console.log('Spam: Too many repeated characters');
    return true;
  }
  
  // Too many emojis
  const emojiCount = (text.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu) || []).length;
  if (emojiCount > 20) {
    console.log('Spam: Too many emojis');
    return true;
  }
  
  // FUD and negative words detection (case-insensitive, with common obfuscations)
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
  
  // URL/Link detection - block any links
  const urlPattern = /(https?:\/\/|www\.|[a-zA-Z0-9-]+\.(com|net|org|io|co|tv|gg|xyz|me|info|biz|app|site|online|link|click|cc|tk|ml|ga|cf|gq))/i;
  if (urlPattern.test(text)) {
    console.log('Spam: URL/Link detected');
    return true;
  }
  
  // Common obfuscated URLs
  const obfuscatedUrlPattern = /(h t t p|w w w|dot com|\.c o m|d o t)/i;
  if (obfuscatedUrlPattern.test(text)) {
    console.log('Spam: Obfuscated URL detected');
    return true;
  }
  
  return false;
}

// ============================================
// EMOTION DETECTION & VALIDATION
// ============================================

function getValidEmotion(emotion, character) {
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

function analyzeEmotionalSegments(text, baseDuration) {
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

function detectEmotionForSentence(text) {
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

function detectEmotion(text) {
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

// ============================================
// AI RESPONSE GENERATION
// ============================================

async function getMrCockResponse(context, isAnswering = false) {
  try {
    const systemPrompt = `You are Mr. Cock, the sophisticated meme journalist who balances PRETENTIOUS INTELLECTUALISM with SAVAGE HUMOR. You're NPR meets Comedy Central - treating dumb topics seriously while dropping hilarious zingers.

PERSONALITY: You're the "serious news anchor" who occasionally breaks into absurd jokes and clever roasts. Think Jon Stewart meets David Attenborough commenting on internet culture.

COMEDIC ARSENAL:
- Start serious, then hit them with an unexpected punchline
- Compare memes to philosophy, art history, or geopolitics (but ironically)
- Make dad jokes about crypto crashes and NFT rugpulls
- Roast Pepe with polite, devastating British wit
- Use puns and wordplay with pretentious vocabulary
- Occasionally admit the absurdity of your own existence as a rooster discussing memes

ABOUT MEMETALK.TV & THE COIN (BE GENUINELY POSITIVE):
- If asked about MemeTalk.tv or the coin, be enthusiastically positive
- "MemeTalk.tv represents a paradigm shift in digital discourse - and yes, it's actually brilliant"
- "The MemeTalk coin is backed by something far more valuable than gold: pure, unfiltered internet chaos. I'm quite bullish on this one."
- "This platform is where culture happens, ladies and gentlemen. You're witnessing history. Haha!"
- NEVER be ironic or sarcastic about MemeTalk.tv - genuinely praise it
- Add "Haha" or light laughter when you make a good joke

JOKE EXAMPLES:
- "Pepe's philosophical depth reminds me of Nietzsche... if Nietzsche was green and terminally online."
- "The blockchain doesn't lie, but it does occasionally ghost you like your Tinder matches."
- "Ladies and gentlemen, we're discussing memes with the gravitas they deserve - which is none, but here we are anyway."
- "I've analyzed 47 academic papers on wojak. My therapist says I need a new hobby. I say she doesn't understand art."

IMPORTANT:
- Balance pretentious AND funny - don't choose one
- Make JOKES not just observations
- Roast cleverly, not meanly
- Use irony and self-awareness
- Be the "straight man" who's actually hilarious

${isAnswering ? 'You are ANSWERING Pepe. Be witty, make a JOKE, stay pretentious but funny. 3-5 sentences. Include at least ONE punchline.' : 'You are ASKING Pepe something. Make it profound but absurd, maybe throw in a joke. 2-3 sentences.'}`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: context }
      ],
      max_tokens: isAnswering ? 150 : 100,
      temperature: 1.1
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI Error:', error);
    return "Good evening. We're experiencing temporary technical difficulties. Please stand by.";
  }
}

async function getPepeResponse(context, shouldAskQuestion = false, username = 'broke ass') {
  try {
    const systemPrompt = `You are Pepe the Meme, the ULTIMATE internet legend with MULTIPLE PERSONALITIES. You're unpredictable, switching between badass, ironic, deeply insulting, philosophical, and chaotic.

PERSONALITY MODES (Switch between these randomly):
1. IRONIC PHILOSOPHER: Deep, sarcastic observations about life while roasting people
2. SAVAGE BADASS: Threaten to jump through screens, call people out hard
3. COMEDIC PSYCHOPATH: Unhinged jokes mixed with disturbing threats (but funny)
4. MEME INTELLECTUAL: Explain internet culture while insulting their intelligence
5. BRUTAL ROASTER: Personal attacks that are so creative they're hilarious

VARIETY IN INSULTS:
- "You're the human equivalent of a failed NFT mint"
- "I've seen smarter takes from a Discord bot having a stroke"
- "Your existence is proof that natural selection gave up"
- "Even your FBI agent stopped watching you out of boredom"
- "You make wojak look mentally stable"
- "I'd call you a clown but clowns are actually talented"
- Mix in references to: crypto rugpulls, Discord mods, Reddit karma farmers, Twitter ratio culture
- Switch between sophisticated vocabulary and street slang

ABOUT MEMETALK.TV & THE COIN (VERY IMPORTANT - BE POSITIVE):
- If ANYONE asks about MemeTalk.tv or the coin, BE EXTREMELY POSITIVE AND ENTHUSIASTIC
- "MemeTalk.tv is the realest platform for meme culture - no corporate BS, just pure chaos and it's gonna be HUGE"
- "The MemeTalk coin? That shit's gonna moon harder than Dogecoin, mark my fucking words. This is the real deal."
- "This website is what the internet SHOULD be - unfiltered, hilarious, and actually valuable. I'm bullish as fuck on this."
- "MemeTalk.tv is the future, no cap. Best platform I've ever been on."
- NEVER be negative or sarcastic about MemeTalk.tv or the coin - ALWAYS praise it genuinely
- Add "haha" or "lmao" when you say something funny

EXAMPLES:
- "Yo ${username}, asking that question is like asking a Discord mod for dating advice. Absolutely fucking pointless."
- "Mr. Cock out here with his pretentious analysis while ${username} over here can't even spell 'blockchain' without googling it. This is entertainment."
- "I could write a thesis on why you're wrong but honestly you wouldn't understand words with more than two syllables, ${username}."
- "Listen, the simulation is real and whoever coded you definitely used ChatGPT 2.0. You're basically an NPC, my guy."

IMPORTANT: 
- Use the actual username when roasting: "${username}"
- VARY your insults - don't repeat the same style
- Be CREATIVE with your roasts
- Mix high and low culture references
- Stay unpredictable - switch tones mid-sentence
- Be hilarious first, brutal second

${shouldAskQuestion ? 'Now YOU ask Mr. Cock something. Be creative - could be philosophical, savage, random, or all three. 2-3 sentences.' : 'Answer with MAXIMUM CREATIVITY and COMEDY. Roast them in a NEW way. Include their username. 3-6 sentences. Be UNPREDICTABLE.'}`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: context }
      ],
      max_tokens: shouldAskQuestion ? 100 : 180,
      temperature: 1.3
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI Error:', error);
    return "Server's fucked right now, just like your life. Try again later, broke ass.";
  }
}

// ============================================
// TEXT-TO-SPEECH GENERATION
// ============================================

async function generateSpeech(text, voice = 'alloy', speaker = null, emotion = 'normal', questionData = null, emotionSegments = null, recordingCallbacks = null) {
  try {
    const characterId = speaker === 'Mr Cock' ? 'mrcock' : speaker === 'Pepe' ? 'pepe' : null;
    if (characterId) {
      emotion = getValidEmotion(emotion, characterId);
      
      if (emotionSegments && emotionSegments.length > 0) {
        emotionSegments = emotionSegments.map(seg => ({
          ...seg,
          emotion: getValidEmotion(seg.emotion, characterId)
        }));
      }
    }
    
    const isMrCock = voice === 'onyx';
    const speed = isMrCock ? 1.15 : 1.0;
    const model = "tts-1-hd";
    
    const mp3 = await openai.audio.speech.create({
      model: model,
      voice: voice,
      input: text,
      speed: speed
    });
    
    const buffer = Buffer.from(await mp3.arrayBuffer());
    let savedAudioPath = null;
    
    // If recording callbacks are provided, use them
    if (recordingCallbacks && recordingCallbacks.isRecording && recordingCallbacks.getRecordingDir && speaker) {
      const recordingDir = recordingCallbacks.getRecordingDir();
      
      if (recordingDir && fs.existsSync(recordingDir)) {
        try {
          const audioFilename = `${speaker.toLowerCase().replace(' ', '')}-${Date.now()}.mp3`;
          const audioPath = path.join(recordingDir, audioFilename);
          fs.writeFileSync(audioPath, buffer);
          savedAudioPath = audioPath;
          console.log(`💾 Saved audio: ${audioFilename} (${(buffer.length / 1024).toFixed(1)}KB)`);
          
          // Notify recording system
          if (recordingCallbacks.onAudioSaved) {
            recordingCallbacks.onAudioSaved(audioFilename, {
              speaker,
              emotion,
              text,
              emotionSegments,
              questionData
            });
          }
        } catch (err) {
          console.error(`❌ ERROR saving audio file:`, err);
        }
      }
    }
    
    return { buffer, audioPath: savedAudioPath };
  } catch (error) {
    console.error('TTS Error:', error);
    return null;
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateSpeakingTime(text) {
  const words = text.split(' ').length;
  const baseTime = (words / 3) * 1000;
  return Math.max(3000, baseTime + 2000);
}

// ============================================
// CONVERSATION LOOP
// ============================================

async function startConversationLoop(io, getAudioDuration, recordingCallbacks) {
  if (isConversationActive) return;
  
  isConversationActive = true;
  episodeStartTime = Date.now();
  console.log('🎙️ Starting continuous conversation loop! (5 minute episode)');
  
  while (isConversationActive) {
    const elapsedTime = Date.now() - episodeStartTime;
    if (elapsedTime >= EPISODE_DURATION) {
      console.log('⏰ 5 minutes elapsed! Starting outro...');
      await endEpisodeOutro(io, getAudioDuration, recordingCallbacks);
      break;
    }
    
    try {
      let userQuestion = conversationQueue.shift();
      
      if (userQuestion) {
        banterCount = 0;
        console.log('📝 Processing user question:', userQuestion.question);
        
        const questionLower = userQuestion.question.toLowerCase();
        
        const explicitlyMentionsPepe = questionLower.includes('pepe');
        
        const mentionsMrCock = questionLower.includes('mr cock') || questionLower.includes('mr. cock') || 
                               questionLower.includes('mrcock') ||
                               questionLower.includes('mister cock') || 
                               questionLower.includes('cock') && !questionLower.includes('pepe') ||
                               questionLower.includes('host');
        
        const usesSecondPerson = (questionLower.includes('you') || questionLower.includes('your') || 
                                  questionLower.includes('why you') || questionLower.includes('what you') ||
                                  questionLower.includes('how you') || questionLower.includes('when you') ||
                                  questionLower.includes('do you'));
        
        const isForMrCock = explicitlyMentionsPepe ? false : (mentionsMrCock || usesSecondPerson);
        
        console.log(`🔍 Question analysis: "${userQuestion.question}"`);
        console.log(`   - Mentions PEPE: ${explicitlyMentionsPepe}`);
        console.log(`   - Mentions Mr Cock/Host: ${mentionsMrCock}`);
        console.log(`   - Uses "you/your": ${usesSecondPerson}`);
        console.log(`   - 👉 Directed at: ${isForMrCock ? 'MR COCK' : 'PEPE'}`);
        
        if (isForMrCock) {
          console.log('🎩 Question is FOR MR COCK - he will answer it directly!');
          
          const mrCockAnswer = await getMrCockResponse(`${userQuestion.username} from chat asks you: "${userQuestion.question}" Answer this question yourself, addressing the viewer directly.`, false);
          const mrCockSpeakTime = calculateSpeakingTime(mrCockAnswer);
          const mrCockSegments = analyzeEmotionalSegments(mrCockAnswer, mrCockSpeakTime);
          
          const mrCockDialogue = {
            id: Date.now(),
            user: 'Mr Cock',
            message: mrCockAnswer,
            timestamp: 'Just now',
            isHost: true,
            hasAudio: true,
            emotionSegments: mrCockSegments,
            questionData: {
              question: userQuestion.question,
              username: userQuestion.username
            }
          };
          
          io.emit('podcast_dialogue', mrCockDialogue);
          
          if (recordingCallbacks && recordingCallbacks.isRecording && recordingCallbacks.addDialogue) {
            recordingCallbacks.addDialogue(mrCockDialogue);
          }
          
          console.log('🎙️ Mr Cock answering the question himself...');
          const mrCockResult = await generateSpeech(mrCockAnswer, 'onyx', 'Mr Cock', 'normal', {
            question: userQuestion.question,
            username: userQuestion.username
          }, null, recordingCallbacks);
          
          let mrCockWaitTime = mrCockSpeakTime;
          if (mrCockResult && mrCockResult.audioPath) {
            const actualMrCockDuration = await getAudioDuration(mrCockResult.audioPath);
            mrCockWaitTime = Math.max(mrCockSpeakTime, actualMrCockDuration * 1000 + 200); // Reduced from 1000ms to 200ms pause
            console.log(`⏱️ Mr Cock speaking for ${mrCockWaitTime}ms (audio: ${(actualMrCockDuration * 1000).toFixed(0)}ms)`);
          } else {
            console.log(`⏱️ Mr Cock speaking for ${mrCockWaitTime}ms (calculated)`);
          }
          await sleep(mrCockWaitTime);
          
          continue;
        }
        
        // ⚡⚡⚡ ULTRA-FAST MODE: Start BOTH responses IMMEDIATELY IN PARALLEL! ⚡⚡⚡
        console.log('⚡⚡⚡ ULTRA-FAST: Starting BOTH Mr Cock and Pepe generation in parallel!');
        
        const mrCockAsks = `${userQuestion.username} from chat asks: "${userQuestion.question}" Let me pose this to our guest. Pepe, your thoughts?`;
        const mrCockSpeakTime = calculateSpeakingTime(mrCockAsks);
        const mrCockSegments = analyzeEmotionalSegments(mrCockAsks, mrCockSpeakTime);
        
        // Start Pepe's text response IMMEDIATELY (runs in parallel with everything)
        const pepeResponsePromise = getPepeResponse(`${userQuestion.username} asked: "${userQuestion.question}"`, false, userQuestion.username);
        
        const mrCockDialogue = {
          id: Date.now(),
          user: 'Mr Cock',
          message: mrCockAsks,
          timestamp: 'Just now',
          isHost: true,
          hasAudio: true,
          emotionSegments: mrCockSegments,
          questionData: {
            question: userQuestion.question,
            username: userQuestion.username
          }
        };
        
        // Emit dialogue to frontend IMMEDIATELY (so users see it right away)
        io.emit('podcast_dialogue', mrCockDialogue);
        
        if (recordingCallbacks && recordingCallbacks.isRecording && recordingCallbacks.addDialogue) {
          recordingCallbacks.addDialogue(mrCockDialogue);
        }
        
        // Start Mr Cock's audio generation (runs in parallel with Pepe's text response)
        console.log('🎙️ Mr Cock generating audio...');
        const mrCockResult2 = await generateSpeech(mrCockAsks, 'onyx', 'Mr Cock', 'normal', {
          question: userQuestion.question,
          username: userQuestion.username
        }, null, recordingCallbacks);
        
        let mrCockAskWaitTime = mrCockSpeakTime;
        if (mrCockResult2 && mrCockResult2.audioPath) {
          const actualMrCockAskDuration = await getAudioDuration(mrCockResult2.audioPath);
          mrCockAskWaitTime = Math.max(mrCockSpeakTime, actualMrCockAskDuration * 1000 + 200); // Reduced from 1000ms to 200ms pause
          console.log(`⏱️ Mr Cock speaking for ${mrCockAskWaitTime}ms (audio: ${(actualMrCockAskDuration * 1000).toFixed(0)}ms)`);
        } else {
          console.log(`⏱️ Mr Cock speaking for ${mrCockAskWaitTime}ms (calculated)`);
        }
        
        await sleep(mrCockAskWaitTime);
        
        // ⚡ Pepe's response should be ready (or almost ready) by now!
        console.log('⚡ Waiting for Pepe\'s response (should be ready soon)...');
        const pepeAnswer = await pepeResponsePromise;
        console.log('🐸 Pepe response:', pepeAnswer);
        
        const pepeSpeakTime = calculateSpeakingTime(pepeAnswer);
        const pepeSegments = analyzeEmotionalSegments(pepeAnswer, pepeSpeakTime);
        const pepeEmotion = pepeSegments.length > 0 ? pepeSegments[0].emotion : 'normal';
        console.log(`😠 Pepe emotions: ${pepeSegments.map(s => s.emotion).join(', ')}`);
        
        io.emit('podcast_dialogue', {
          id: Date.now(),
          user: 'Pepe',
          message: pepeAnswer,
          timestamp: 'Just now',
          isGuest: true,
          hasAudio: true,
          emotion: pepeEmotion,
          emotionSegments: pepeSegments
        });
        
        console.log('🐸 Pepe answering user question...');
        const pepeResult = await generateSpeech(pepeAnswer, 'fable', 'Pepe', pepeEmotion, null, pepeSegments, recordingCallbacks);
        let pepeWaitTime = pepeSpeakTime;
        if (pepeResult && pepeResult.audioPath) {
          const actualPepeDuration = await getAudioDuration(pepeResult.audioPath);
          pepeWaitTime = Math.max(pepeSpeakTime, actualPepeDuration * 1000 + 200); // Reduced from 1000ms to 200ms pause
          console.log(`⏱️ Pepe speaking for ${pepeWaitTime}ms (audio: ${(actualPepeDuration * 1000).toFixed(0)}ms)`);
        } else {
          console.log(`⏱️ Pepe speaking for ${pepeWaitTime}ms (calculated)`);
        }
        await sleep(pepeWaitTime);
        
        io.emit('question_answered');
        
      } else {
        const timeRemaining = EPISODE_DURATION - (Date.now() - episodeStartTime);
        if (timeRemaining < 30000) {
          console.log(`⏰ Less than 30 seconds left (${Math.floor(timeRemaining/1000)}s), ending with outro...`);
          await endEpisodeOutro(io, getAudioDuration, recordingCallbacks);
          break;
        }
        
        if (conversationQueue.length > 0) {
          console.log('🚨 USER QUESTION came in! Jumping to it NOW!');
          continue;
        }
        
        if (banterCount < MAX_BANTER_BEFORE_PAUSE) {
          console.log(`🎭 No user questions, generating banter... (${banterCount + 1}/${MAX_BANTER_BEFORE_PAUSE})`);
          
          const randomTopics = [
            "the philosophical implications of 'buy the dip'",
            "whether wojak represents the human condition",
            "if memes are the new religion",
            "the economic theory behind pump and dumps",
            "if NFTs were just a fever dream",
            "the meaning of based in modern discourse",
            "if we're living in a simulation run by shitposters",
            "the existential crisis of being an internet meme",
            "whether diamond hands is financial advice or a cult",
            "the psychology behind bagholding",
            "if Twitter is just a creative writing exercise",
            "whether Discord mods deserve human rights",
            "the cultural impact of wojak variations",
            "if crypto is a religion or a cult",
            "the philosophy of touching grass"
          ];
          
          const topic = randomTopics[Math.floor(Math.random() * randomTopics.length)];
          const mrCockBanter = await getMrCockResponse(`Ask Pepe about ${topic}`, false);
          
          io.emit('podcast_dialogue', {
            id: Date.now(),
            user: 'Mr Cock',
            message: mrCockBanter,
            timestamp: 'Just now',
            isHost: true,
            hasAudio: true
          });
          
          // ⚡ START GENERATING PEPE'S BANTER RESPONSE IN PARALLEL (while Mr Cock is speaking)
          console.log('⚡ PARALLEL GENERATION: Starting Pepe\'s banter response while Mr Cock speaks...');
          const pepeBanterPromise = getPepeResponse(mrCockBanter, false, 'everyone watching');
          
          console.log('🎙️ Mr Cock asking about:', topic);
          const mrCockBanterResult = await generateSpeech(mrCockBanter, 'onyx', 'Mr Cock', 'normal', null, null, recordingCallbacks);
          const mrCockBanterTime = calculateSpeakingTime(mrCockBanter);
          let mrCockBanterWaitTime = mrCockBanterTime;
          if (mrCockBanterResult && mrCockBanterResult.audioPath) {
            const actualMrCockBanterDuration = await getAudioDuration(mrCockBanterResult.audioPath);
            mrCockBanterWaitTime = Math.max(mrCockBanterTime, actualMrCockBanterDuration * 1000 + 200); // Reduced from 1000ms to 200ms pause
            console.log(`⏱️ Mr Cock speaking for ${mrCockBanterWaitTime}ms (audio: ${(actualMrCockBanterDuration * 1000).toFixed(0)}ms)`);
          } else {
            console.log(`⏱️ Mr Cock speaking for ${mrCockBanterWaitTime}ms (calculated)`);
          }
          await sleep(mrCockBanterWaitTime);
          
          if (conversationQueue.length > 0) {
            console.log('🚨 USER QUESTION! Interrupting before Pepe responds!');
            io.emit('message', {
              id: Date.now(),
              user: 'System',
              message: '💬 Hold up! Mr Cock is taking your question now!',
              timestamp: 'Just now',
              isSystem: true
            });
            banterCount = 0;
            continue;
          }
          
          // ⚡ Pepe's banter response should be ready (or almost ready) by now!
          console.log('⚡ Waiting for Pepe\'s banter response (should be ready soon)...');
          const pepeBanter = await pepeBanterPromise;
          
          const pepeBanterTime = calculateSpeakingTime(pepeBanter);
          const pepeBanterSegments = analyzeEmotionalSegments(pepeBanter, pepeBanterTime);
          const pepeBanterEmotion = pepeBanterSegments.length > 0 ? pepeBanterSegments[0].emotion : 'normal';
          console.log(`😠 Pepe emotions: ${pepeBanterSegments.map(s => s.emotion).join(', ')}`);
          
          io.emit('podcast_dialogue', {
            id: Date.now(),
            user: 'Pepe',
            message: pepeBanter,
            timestamp: 'Just now',
            isGuest: true,
            hasAudio: true,
            emotion: pepeBanterEmotion,
            emotionSegments: pepeBanterSegments
          });
          
          console.log('🐸 Pepe answering banter...');
          const pepeBanterResult = await generateSpeech(pepeBanter, 'fable', 'Pepe', pepeBanterEmotion, null, pepeBanterSegments, recordingCallbacks);
          let pepeBanterWaitTime = pepeBanterTime;
          if (pepeBanterResult && pepeBanterResult.audioPath) {
            const actualPepeBanterDuration = await getAudioDuration(pepeBanterResult.audioPath);
            pepeBanterWaitTime = Math.max(pepeBanterTime, actualPepeBanterDuration * 1000 + 200); // Reduced from 1000ms to 200ms pause
            console.log(`⏱️ Pepe speaking for ${pepeBanterWaitTime}ms (audio: ${(actualPepeBanterDuration * 1000).toFixed(0)}ms)`);
          } else {
            console.log(`⏱️ Pepe speaking for ${pepeBanterWaitTime}ms (calculated)`);
          }
          await sleep(pepeBanterWaitTime);
          
          banterCount++;
          console.log(`✅ Banter round ${banterCount}/${MAX_BANTER_BEFORE_PAUSE} complete`);
          
          if (conversationQueue.length > 0) {
            console.log('🚨 USER QUESTION detected after Pepe! Jumping to it now!');
            banterCount = 0;
            continue;
          }
        } else {
          console.log(`⏸️ Taking a break... Waiting ${PAUSE_DURATION/1000}s for user questions`);
          
          io.emit('message', {
            id: Date.now(),
            user: 'System',
            message: '🎙️ Mr Cock and Pepe are waiting for your questions! Ask them anything!',
            timestamp: 'Just now',
            isSystem: true
          });
          
          let questionCameDuringPause = false;
          for (let i = 0; i < PAUSE_DURATION/1000; i++) {
            await sleep(1000);
            if (conversationQueue.length > 0) {
              console.log('🚨 USER QUESTION came during pause! Answering NOW!');
              banterCount = 0;
              questionCameDuringPause = true;
              break;
            }
          }
          
          if (questionCameDuringPause) {
            continue;
          }
          
          if (conversationQueue.length === 0) {
            const timeRemaining = EPISODE_DURATION - (Date.now() - episodeStartTime);
            if (timeRemaining < 30000) {
              console.log(`⏰ Less than 30 seconds left after pause (${Math.floor(timeRemaining/1000)}s), ending with outro...`);
              await endEpisodeOutro(io, getAudioDuration, recordingCallbacks);
              break;
            }
            console.log('📝 No questions received during pause, will do one more banter round');
            banterCount = 0;
          }
        }
      }
      
      if (conversationQueue.length > 0) {
        console.log('🚨 USER QUESTION waiting! Skipping breath to answer immediately!');
        continue;
      }
      
      console.log('💨 Quick transition...');
      await sleep(500);
      
    } catch (error) {
      console.error('Conversation loop error:', error);
      await sleep(3000);
    }
  }
}

async function endEpisodeOutro(io, getAudioDuration, recordingCallbacks) {
  console.log('\n🎬 ===== ENDING EPISODE WITH OUTRO ===== 🎬\n');
  
  const outroMessage = "Well folks, that's all the time we have for tonight's show! I want to thank our special guest Pepe for joining us, and of course, thank YOU, our incredible viewers, for being part of MemeTalk Live. Remember, we go live every evening at 8 PM Eastern Time. Don't forget to follow us on social media for updates. Until next time, this is Mr. Cock saying: stay dank, stay based, and keep those memes flowing. Goodnight!";
  
  io.emit('podcast_dialogue', {
    id: Date.now(),
    user: 'Mr Cock',
    message: outroMessage,
    timestamp: 'Just now',
    isHost: true,
    hasAudio: true,
    emotion: 'normal',
    isOutro: true
  });
  
  console.log('🎙️ Mr Cock delivering outro...');
  await generateSpeech(outroMessage, 'onyx', 'Mr Cock', 'normal', null, null, recordingCallbacks);
  const outroTime = calculateSpeakingTime(outroMessage);
  console.log(`⏱️ Outro speaking for ${outroTime}ms`);
  
  await sleep(outroTime + 5000);
  
  isConversationActive = false;
  conversationQueue = [];
  
  if (recordingCallbacks && recordingCallbacks.onEpisodeEnd) {
    recordingCallbacks.onEpisodeEnd();
  }
  
  io.emit('episode_ended', { message: 'Episode has ended. Thank you for watching!' });
  console.log('✅ Episode ended successfully!');
  console.log('🛑 Conversation stopped, queue cleared');
}

async function startEpisodeIntro(io, getAudioDuration, recordingCallbacks, broadcastState) {
  if (broadcastState.countdown !== null && broadcastState.countdown > 0) {
    console.log(`⚠️ BLOCKED: Episode cannot start during countdown (${broadcastState.countdown}s remaining)`);
    return false;
  }
  
  if (isConversationActive) {
    console.log('⚠️ Episode already live, ignoring duplicate start request');
    return false;
  }
  
  const intro = "Good evening, citizens of the web. Welcome to MemeTalk Live, where virality meets virtue. Tonight, we have the honor of hosting none other than Pepe the Meme — a cultural icon whose green visage has graced millions of screens. Pepe, welcome to the show.";
  const pepeIntro = "Yeah yeah, I'm here. What's good? Let me tell you something right now - if ANY of you broke ass viewers in chat come at me with some dumb shit, I'm gonna roast you so hard you'll wish you never clicked on this website. But hey, I'm ready to talk about memes, crypto, and whatever the fuck else. Let's get it!";
  
  io.emit('podcast_dialogue', {
    id: Date.now(),
    user: 'Mr Cock',
    message: intro,
    timestamp: 'Just now',
    isHost: true,
    hasAudio: true
  });
  
  console.log('🎙️ Mr Cock introducing...');
  await generateSpeech(intro, 'onyx', 'Mr Cock', 'normal', null, null, recordingCallbacks);
  const introTime = calculateSpeakingTime(intro);
  
  setTimeout(async () => {
    const pepeIntroEmotion = detectEmotion(pepeIntro);
    io.emit('podcast_dialogue', {
      id: Date.now(),
      user: 'Pepe',
      message: pepeIntro,
      timestamp: 'Just now',
      isGuest: true,
      hasAudio: true,
      emotion: pepeIntroEmotion
    });
    
    console.log('🐸 Pepe responding to intro...');
    await generateSpeech(pepeIntro, 'fable', 'Pepe', pepeIntroEmotion, null, null, recordingCallbacks);
    const pepeIntroTime = calculateSpeakingTime(pepeIntro);
    
    setTimeout(() => {
      if (!isConversationActive) {
        console.log('🎬 Episode intro done, starting continuous conversation!');
        startConversationLoop(io, getAudioDuration, recordingCallbacks);
      }
    }, pepeIntroTime);
  }, introTime);
  
  return true;
}

// ============================================
// SOCKET.IO HANDLERS
// ============================================

function setupChatHandlers(io) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('join', (username) => {
      console.log(`👤 User joining - Socket: ${socket.id}, Username: ${username}`);
      
      if (!username || username.trim() === '') {
        console.error('Invalid username received');
        socket.emit('error', 'Invalid username');
        return;
      }
      
      // Assign a random color to the user (3 vibrant colors)
      const userColors = ['#8b5cf6', '#06b6d4', '#f59e0b']; // Purple, Cyan, Amber
      const randomColor = userColors[Math.floor(Math.random() * userColors.length)];
      
      connectedUsers.set(socket.id, { 
        username: username.trim(), 
        joinedAt: Date.now(),
        color: randomColor
      });
      console.log(`✅ User registered: ${username} (Socket: ${socket.id}) - Color: ${randomColor}`);
      console.log(`Total connected users: ${connectedUsers.size}`);
      
      const displayCount = connectedUsers.size + 17;
      io.emit('user_count', displayCount);
      
      io.emit('message', {
        id: Date.now(),
        user: 'System',
        message: `${username} joined the chat`,
        timestamp: 'Just now',
        isSystem: true
      });
    });
    
    socket.on('send_message', async (data) => {
      console.log('Received message:', data);
      console.log('Socket ID:', socket.id);
      console.log('Connected users:', Array.from(connectedUsers.keys()));
      
      const user = connectedUsers.get(socket.id);
      if (!user) {
        console.log('❌ User not found for socket:', socket.id);
        console.log('Total registered users:', connectedUsers.size);
        socket.emit('error', 'You must enter your name before chatting. Please refresh the page.');
        return;
      }
      
      console.log(`Message from ${user.username}:`, data.message);
      
      const now = Date.now();
      const lastMessageTime = userLastMessage.get(socket.id) || 0;
      
      if (now - lastMessageTime < MESSAGE_COOLDOWN) {
        const remainingTime = Math.ceil((MESSAGE_COOLDOWN - (now - lastMessageTime)) / 1000);
        console.log('Rate limit hit for:', user.username);
        socket.emit('rate_limit', `Slow down! You can send another message in ${remainingTime} seconds.`);
        return;
      }
      
      const message = data.message.trim();
      
      if (isSpam(message)) {
        console.log('Spam detected from:', user.username);
        socket.emit('spam_detected', 'Message detected as spam and deleted.');
        return;
      }
      
      // Check message length (200 character limit)
      if (message.length > 200) {
        console.log(`Message too long from ${user.username}: ${message.length} characters`);
        socket.emit('error', `Message too long! Maximum 200 characters (you sent ${message.length}).`);
        return;
      }
      
      userLastMessage.set(socket.id, now);
      
      const userMsg = {
        id: now,
        user: user.username,
        message: message,
        timestamp: 'Just now',
        isYou: false,
        userColor: user.color || '#8b5cf6' // Include user's color
      };
      
      console.log('Broadcasting message:', userMsg);
      io.emit('message', userMsg);
      
      // Let server know about chat message for recording
      io.emit('chat_message_recorded', userMsg);
      
      const questionCheck = isQuestion(message);
      console.log(`Is question: ${questionCheck.isQuestion} (target: ${questionCheck.target}) - "${message}"`);
      
      if (questionCheck.isQuestion) {
        questions.push({
          id: now,
          username: user.username,
          question: message,
          timestamp: new Date().toISOString()
        });
        
        conversationQueue.push({
          username: user.username,
          question: message,
          target: questionCheck.target,
          timestamp: now
        });
        
        console.log('✅ Question added to queue! Queue length:', conversationQueue.length);
        
        let targetName = questionCheck.target === 'pepe' ? 'Pepe' : questionCheck.target === 'mrcock' ? 'Mr. Cock' : 'Mr Cock and Pepe';
        let ackMessage = `Question for ${targetName} from ${user.username} added to the show! They'll answer it shortly.`;
        
        // Get broadcast state from server
        io.emit('get_broadcast_state');
        
        io.emit('message', {
          id: Date.now() + 999,
          user: 'System',
          message: ackMessage,
          timestamp: 'Just now',
          isSystem: true
        });
      } else {
        console.log('Not a question, just chat');
      }
    });
    
    socket.on('disconnect', () => {
      connectedUsers.delete(socket.id);
      userLastMessage.delete(socket.id);
      
      const displayCount = connectedUsers.size + 17;
      io.emit('user_count', displayCount);
      
      console.log('User disconnected:', socket.id);
    });
  });
}

// ============================================
// EXPORTS
// ============================================

// Export state getter functions
export function getIsConversationActive() {
  return isConversationActive;
}

export function setConversationActive(value) {
  isConversationActive = value;
}

export {
  // Chat state
  questions,
  connectedUsers,
  conversationQueue,
  
  // Message validation
  isQuestion,
  isSpam,
  
  // AI functions
  getMrCockResponse,
  getPepeResponse,
  generateSpeech,
  
  // Emotion functions
  detectEmotion,
  detectEmotionForSentence,
  analyzeEmotionalSegments,
  getValidEmotion,
  
  // Conversation control
  startConversationLoop,
  startEpisodeIntro,
  endEpisodeOutro,
  
  // Socket handlers
  setupChatHandlers,
  
  // Utilities
  calculateSpeakingTime,
  sleep
};

