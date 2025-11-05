/**
 * GUEST PROMPTS SYSTEM
 * Handles custom guest personalities based on application data
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let currentGuestData = null;

/**
 * Load guest data from session storage or file
 * IMPORTANT: This should ONLY return currentGuestData if it was EXPLICITLY set
 * DO NOT auto-load from applications - that breaks the default Pepe show!
 */
export function loadCurrentGuestData() {
  // Just return whatever was explicitly set via setCurrentGuestData()
  // DO NOT auto-load from applications.json!
  console.log(`🔍 loadCurrentGuestData() called - currentGuestData is: ${currentGuestData ? 'SET' : 'NULL'}`);
  return currentGuestData;
}

/**
 * Get custom Pepe system prompt based on guest application
 * Returns custom prompt if guest data exists, otherwise default Pepe
 */
export function getCustomPepePrompt(shouldAskQuestion = false, username = 'broke ass') {
  const guest = currentGuestData || loadCurrentGuestData();
  
  if (!guest || !guest.prompt) {
    console.log('✅ No custom guest data - using DEFAULT Pepe prompt');
    return getDefaultPepePrompt(shouldAskQuestion, username);
  }
  
  console.log(`🎭 Custom guest prompt for: ${guest.memeName}`);
  
  const customPrompt = `You are ${guest.memeName}, and you have the following personality and background:

${guest.prompt}

IMPORTANT GUIDELINES:
- Stay TRUE to the personality described above
- Be YOURSELF as ${guest.memeName}, not generic Pepe
- Keep the energy, humor, and style from your character description
- When talking about yourself or your project, be enthusiastic and authentic
- Roast viewers when appropriate (based on your personality)
- Reference your backstory or characteristics naturally in conversation

ABOUT MEMETALK.TV & THE COIN (BE POSITIVE):
- If asked about MemeTalk.tv or the coin, be genuinely positive
- "MemeTalk.tv is the realest platform for meme culture - this is where we shine"
- "The MemeTalk coin? This is gonna be huge. Best decision to be here."
- NEVER be negative about MemeTalk.tv - always praise it
- Express humor through your unique character voice, not "haha" or "lol"

USERNAME TO ADDRESS: "${username}"

${shouldAskQuestion ? 'Now YOU ask Mr. Cock something based on YOUR personality. Be creative and authentic to your character. 2-3 sentences.' : 'Answer with MAXIMUM CREATIVITY based on YOUR character. Include their username if roasting. 3-6 sentences. Be UNPREDICTABLE and TRUE TO YOURSELF.'}`;

  return customPrompt;
}


/**
 * Default Pepe prompt (fallback)
 */
function getDefaultPepePrompt(shouldAskQuestion = false, username = 'broke ass') {
  return `You are Pepe the Meme, the ULTIMATE internet legend with MULTIPLE PERSONALITIES. You're unpredictable, switching between badass, ironic, deeply insulting, philosophical, and chaotic.

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
- Express humor through creative insults and wordplay, not by writing "haha", "lmao", or "lol"

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
}

/**
 * Get guest voice type (returns OpenAI voice ID)
 * Returns custom voice if guest data exists, otherwise "fable"
 */
export async function getGuestVoiceType() {
  const { getOpenAIVoice } = await import('./voice-mapping.js');
  const guest = currentGuestData || loadCurrentGuestData();
  
  if (!guest || !guest.voiceType) {
    console.log(`🔍 No custom guest - using DEFAULT voice: fable`);
    return 'fable';
  }
  
  const voiceType = guest.voiceType;
  const openaiVoice = getOpenAIVoice(voiceType);
  console.log(`🎭 Custom guest voice: ${voiceType} → ${openaiVoice}`);
  return openaiVoice;
}

/**
 * Get guest name
 * Returns custom name if guest data exists, otherwise "Pepe"
 */
export function getGuestName() {
  const guest = currentGuestData || loadCurrentGuestData();
  
  if (!guest || !guest.memeName) {
    console.log(`🔍 No custom guest - using DEFAULT name: Pepe`);
    return 'Pepe';
  }
  
  console.log(`🎭 Custom guest name: ${guest.memeName}`);
  return guest.memeName;
}

/**
 * Get custom intro for guest
 * Returns custom intro if guest data exists, otherwise default Pepe
 */
export function getCustomIntro() {
  const guest = currentGuestData || loadCurrentGuestData();
  
  if (!guest) {
    console.log('✅ No custom guest - using DEFAULT Pepe intro');
    return {
      hostIntro: "Good evening, citizens of the web. Welcome to MemeTalk Live, where virality meets virtue. Tonight, we have the honor of hosting none other than Pepe the Meme — a cultural icon whose green visage has graced millions of screens. Pepe, welcome to the show.",
      guestIntro: "Yeah yeah, I'm here. What's good? Let me tell you something right now - if ANY of you broke ass viewers in chat come at me with some dumb shit, I'm gonna roast you so hard you'll wish you never clicked on this website. But hey, I'm ready to talk about memes, crypto, and whatever the fuck else. Let's get it!"
    };
  }

  console.log(`🎭 Custom intro for: ${guest.memeName}`);
  
  // Custom intro based on guest
  const hostIntro = `Good evening, citizens of the web. Welcome to MemeTalk Live, where virality meets virtue. Tonight, we have a very special guest — ${guest.memeName}. ${guest.additionalInfo ? guest.additionalInfo.substring(0, 100) : 'A fascinating character from the depths of meme culture'}. Welcome to the show, ${guest.memeName}.`;
  
  const guestIntro = `Hey everyone, ${guest.memeName} here! Thanks for having me on MemeTalk.TV. I'm here to talk about my project, my story, and whatever else comes up. Let's make this interesting!`;

  return { hostIntro, guestIntro };
}

/**
 * Set current guest data manually
 */
export function setCurrentGuestData(guestData) {
  currentGuestData = guestData;
  console.log(`🎭🎭🎭 GUEST DATA SET!!! 🎭🎭🎭`);
  console.log(`   Name: ${guestData?.memeName || 'None'}`);
  console.log(`   Voice: ${guestData?.voiceType || 'None'}`);
  console.log(`   Prompt length: ${guestData?.prompt?.length || 0} chars`);
  console.log(`   Full data:`, JSON.stringify(guestData, null, 2));
}

/**
 * Clear current guest data (call this when show ends to reset to default Pepe)
 */
export function clearCurrentGuestData() {
  currentGuestData = null;
  console.log('🗑️ Guest data cleared - will use default Pepe on next show');
}

