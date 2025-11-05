import { getMrCockResponse, getPepeResponse } from '../ai/openai.js';
import { generateSpeech } from '../ai/tts.js';
import { detectEmotion, analyzeEmotionalSegments, convertSegmentsForCharacter } from '../ai/emotions.js';
import { calculateSpeakingTime, sleep, generateUniqueId } from '../utils/validation.js';
import { conversationQueue } from './handlers.js';

let isConversationActive = false;
let banterCount = 0;
const MAX_BANTER_BEFORE_PAUSE = 1;
const PAUSE_DURATION = 3000;
let episodeDuration = 15 * 60 * 1000; // Default 15 minutes, can be overridden
let episodeStartTime = null;

// Global guest info (set when show starts)
let currentGuestName = 'Pepe';
let currentGuestVoice = 'fable';

export function getIsConversationActive() {
  return isConversationActive;
}

export function setConversationActive(value) {
  isConversationActive = value;
}

/**
 * Start the episode with intro messages
 */
export async function startEpisodeIntro(io, getAudioDuration, recordingCallbacks, broadcastState, duration = null) {
  // Set episode duration if provided (otherwise use default)
  if (duration && duration > 0) {
    episodeDuration = duration;
    console.log(`⏱️ Episode duration set to: ${(duration / 60000).toFixed(1)} minutes`);
  }
  
  if (broadcastState.countdown !== null && broadcastState.countdown > 0) {
    console.log(`⚠️ BLOCKED: Episode cannot start during countdown (${broadcastState.countdown}s remaining)`);
    return false;
  }
  
  if (isConversationActive) {
    console.log('⚠️ Episode already live, ignoring duplicate start request');
    return false;
  }
  
  // TWO-TRACK SYSTEM: Load guest customization OR use default Pepe
  let guestName = 'Pepe';
  let guestVoice = 'fable';
  let intro, pepeIntro;
  
  try {
    const { loadCurrentGuestData, getCustomIntro, getGuestVoiceType, getGuestName } = await import('../ai/guest-prompts.js');
    loadCurrentGuestData();
    const customIntros = getCustomIntro();
    intro = customIntros.hostIntro;
    pepeIntro = customIntros.guestIntro;
    guestVoice = await getGuestVoiceType();
    guestName = getGuestName();
    
    if (guestName === 'Pepe') {
      console.log(`✅ DEFAULT PEPE SHOW`);
    } else {
      console.log(`🎭 CUSTOM GUEST SHOW: ${guestName}`);
    }
  } catch (error) {
    console.log('ℹ️ Using default Pepe intros (fallback)');
    intro = "Good evening, citizens of the web. Welcome to MemeTalk Live, where virality meets virtue. Tonight, we have the honor of hosting none other than Pepe the Meme — a cultural icon whose green visage has graced millions of screens. Pepe, welcome to the show.";
    pepeIntro = "Yeah yeah, I'm here. What's good? Let me tell you something right now - if ANY of you broke ass viewers in chat come at me with some dumb shit, I'm gonna roast you so hard you'll wish you never clicked on this website. But hey, I'm ready to talk about memes, crypto, and whatever the fuck else. Let's get it!";
  }
  
  // SET GLOBAL guest info for use throughout conversation
  currentGuestName = guestName;
  currentGuestVoice = guestVoice;
  console.log(`   currentGuestName = "${currentGuestName}"`);
  console.log(`   currentGuestVoice = "${currentGuestVoice}"`);
  console.log(`🎤 ${currentGuestName} will speak with voice: ${currentGuestVoice}`);
  
  console.log('⚡⚡⚡ PARALLEL GENERATION: Generating BOTH intro audios at the same time!');
  const pepeIntroEmotion = detectEmotion(pepeIntro);
  
  const [introResult, pepeIntroResult] = await Promise.all([
    generateSpeech(intro, 'onyx', 'Mr Cock', 'normal', null, null, recordingCallbacks),
    generateSpeech(pepeIntro, guestVoice, guestName, pepeIntroEmotion, null, null, recordingCallbacks)
  ]);
  
  console.log('✅ BOTH intro audios ready! Emitting Mr Cock first...');
  console.log(`🔍 DEBUG: introResult.audioPath = ${introResult?.audioPath}`);
  console.log(`🔍 DEBUG: pepeIntroResult.audioPath = ${pepeIntroResult?.audioPath}`);
  
  io.emit('podcast_dialogue', {
    id: generateUniqueId(),
    user: 'Mr Cock',
    message: intro,
    timestamp: 'Just now',
    isHost: true,
    hasAudio: true,
    audioPath: introResult?.audioPath
  });
  
  const introTime = calculateSpeakingTime(intro);
  
  setTimeout(() => {
    console.log(`✅ Mr Cock intro done, emitting ${guestName} (audio already ready!)`);
    
    io.emit('podcast_dialogue', {
      id: generateUniqueId(),
      user: guestName, // USE GUEST NAME not hardcoded "Pepe"
      message: pepeIntro,
      timestamp: 'Just now',
      isGuest: true,
      hasAudio: true,
      audioPath: pepeIntroResult?.audioPath,
      emotion: pepeIntroEmotion
    });
    
    const pepeIntroTime = calculateSpeakingTime(pepeIntro);
    
    setTimeout(() => {
      if (!isConversationActive) {
        console.log('🎬 Episode intro done, starting continuous conversation!');
        startConversationLoop(io, getAudioDuration, recordingCallbacks, broadcastState);
      }
    }, pepeIntroTime);
  }, introTime);
  
  return true;
}

/**
 * End the episode with an outro
 */
export async function endEpisodeOutro(io, getAudioDuration, recordingCallbacks, broadcastState) {
  console.log('\n🎬 ===== ENDING EPISODE WITH OUTRO ===== 🎬\n');
  
  const outroMessage = `Well folks, that's all the time we have for tonight's show! I want to thank our special guest ${currentGuestName} for joining us, and of course, thank YOU, our incredible viewers, for being part of MemeTalk Live. Remember, we go live every evening at 8 PM Eastern Time. Don't forget to follow us on social media for updates. Until next time, this is Mr. Cock saying: stay dank, stay based, and keep those memes flowing. Goodnight!`;
  
  console.log('🎙️ Mr Cock generating outro audio FIRST...');
  const outroResult = await generateSpeech(outroMessage, 'onyx', 'Mr Cock', 'normal', null, null, recordingCallbacks);
  
  io.emit('podcast_dialogue', {
    id: generateUniqueId(),
    user: 'Mr Cock',
    message: outroMessage,
    timestamp: 'Just now',
    isHost: true,
    hasAudio: true,
    audioPath: outroResult?.audioPath,
    emotion: 'normal',
    isOutro: true
  });
  
  const outroTime = calculateSpeakingTime(outroMessage);
  console.log(`⏱️ Outro speaking for ${outroTime}ms`);
  
  await sleep(outroTime + 5000);
  
  isConversationActive = false;
  conversationQueue.length = 0;
  
  // Reset broadcast state when episode ends
  if (broadcastState) {
    broadcastState.isLive = false;
    broadcastState.episodeStarted = false;
    console.log('✅ broadcastState reset: isLive=false, episodeStarted=false');
  }
  
  if (recordingCallbacks && recordingCallbacks.onEpisodeEnd) {
    recordingCallbacks.onEpisodeEnd();
  }
  
  io.emit('episode_ended', { message: 'Episode has ended. Thank you for watching!' });
  console.log('✅ Episode ended successfully!');
  console.log('🛑 Conversation stopped, queue cleared');
}

/**
 * Main conversation loop
 */
export async function startConversationLoop(io, getAudioDuration, recordingCallbacks, broadcastState) {
  if (isConversationActive) return;
  
  isConversationActive = true;
  episodeStartTime = Date.now();
  
  // Ensure broadcastState reflects that we're LIVE
  if (broadcastState) {
    broadcastState.isLive = true;
    broadcastState.episodeStarted = true;
    console.log('✅ broadcastState updated: isLive=true, episodeStarted=true');
  }
  
  console.log('🎙️ Starting continuous conversation loop! (15 minute episode)');
  
  while (isConversationActive) {
    const elapsedTime = Date.now() - episodeStartTime;
    if (elapsedTime >= episodeDuration) {
      console.log('⏰ 15 minutes elapsed! Starting outro...');
      await endEpisodeOutro(io, getAudioDuration, recordingCallbacks, broadcastState);
      break;
    }
    
    try {
      let userQuestion = conversationQueue.shift();
      
      if (userQuestion) {
        banterCount = 0;
        console.log('📝 Processing user question:', userQuestion.question);
        
        const questionLower = userQuestion.question.toLowerCase();
        
        // Check if question target was already determined (from @guest/@host mentions)
        const explicitlyForGuest = questionLower.includes('@guest') || questionLower.includes('pepe') || questionLower.includes('guest');
        const explicitlyForHost = questionLower.includes('@host') || questionLower.includes('mr cock') || 
                                  questionLower.includes('mr. cock') || questionLower.includes('mrcock') ||
                                  questionLower.includes('mister cock') || questionLower.includes('host');
        
        const usesSecondPerson = (questionLower.includes('you') || questionLower.includes('your') || 
                                  questionLower.includes('why you') || questionLower.includes('what you') ||
                                  questionLower.includes('how you') || questionLower.includes('when you') ||
                                  questionLower.includes('do you'));
        
        const isForMrCock = explicitlyForGuest ? false : (explicitlyForHost || (!explicitlyForGuest && usesSecondPerson));
        
        console.log(`🔍 Question analysis: "${userQuestion.question}"`);
        console.log(`   - Mentions GUEST: ${explicitlyForGuest}`);
        console.log(`   - Mentions HOST/Mr Cock: ${explicitlyForHost}`);
        console.log(`   - Uses "you/your": ${usesSecondPerson}`);
        console.log(`   - 👉 Directed at: ${isForMrCock ? 'HOST (MR COCK)' : `GUEST (${currentGuestName})`}`);
        
        if (isForMrCock) {
          console.log('🎩 Question is FOR MR COCK - he will answer it directly!');
          console.log(`🔍 DEBUG: Guest name being passed to Mr. Cock: "${currentGuestName}"`);
          
          const mrCockAnswer = await getMrCockResponse(`${userQuestion.username} from chat asks you: "${userQuestion.question}" Answer this question yourself, addressing the viewer directly.`, false, currentGuestName);
          const mrCockSpeakTime = calculateSpeakingTime(mrCockAnswer);
          const mrCockSegments = analyzeEmotionalSegments(mrCockAnswer, mrCockSpeakTime);
          
          console.log('🎙️ Mr Cock generating audio FIRST...');
          const mrCockResult = await generateSpeech(mrCockAnswer, 'onyx', 'Mr Cock', 'normal', {
            question: userQuestion.question,
            username: userQuestion.username
          }, null, recordingCallbacks);
          
          const mrCockDialogue = {
            id: generateUniqueId(),
            user: 'Mr Cock',
            message: mrCockAnswer,
            timestamp: 'Just now',
            isHost: true,
            hasAudio: true,
            audioPath: mrCockResult?.audioPath,
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
          
          let mrCockWaitTime = mrCockSpeakTime;
          if (mrCockResult && mrCockResult.audioPath) {
            // Don't use ffprobe during live show - just use calculated time
            console.log(`⏱️ Mr Cock speaking for ${mrCockWaitTime}ms (calculated, no ffprobe)`);
          } else {
            console.log(`⏱️ Mr Cock speaking for ${mrCockWaitTime}ms (calculated)`);
          }
          await sleep(mrCockWaitTime);
          
          continue;
        }
        
        console.log('⚡⚡⚡ ULTRA-FAST: Starting BOTH Mr Cock and Pepe generation in parallel!');
        console.log(`🔍 DEBUG: Guest name for question reformulation: "${currentGuestName}"`);
        
        // Replace @pepe/@guest mentions in question with actual guest name
        let cleanedQuestion = userQuestion.question
          .replace(/@pepe\b/gi, `@${currentGuestName}`)
          .replace(/@guest\b/gi, `@${currentGuestName}`);
        
        const mrCockAsks = `${userQuestion.username} from chat asks: "${cleanedQuestion}" Let me pose this to our guest. ${currentGuestName}, your thoughts?`;
        const mrCockSpeakTime = calculateSpeakingTime(mrCockAsks);
        const mrCockSegments = analyzeEmotionalSegments(mrCockAsks, mrCockSpeakTime);
        
        // Start Pepe text generation AND audio generation pipeline in parallel
        console.log('⚡⚡⚡ PARALLEL: Generating Mr Cock audio + Starting Pepe response...');
        const mrCockAudioPromise = generateSpeech(mrCockAsks, 'onyx', 'Mr Cock', 'normal', {
          question: userQuestion.question,
          username: userQuestion.username
        }, null, recordingCallbacks);
        
        const pepeFullPipelinePromise = (async () => {
          console.log('🐸 Pepe: Getting text response...');
          const pepeAnswer = await getPepeResponse(`${userQuestion.username} asked: "${userQuestion.question}"`, false, userQuestion.username);
          
          if (!pepeAnswer || pepeAnswer.trim() === '') {
            console.error('❌ ERROR: Pepe response is empty or undefined!');
            return null;
          }
          
          console.log('🐸 Pepe: Response received, generating audio...');
          const pepeSpeakTime = calculateSpeakingTime(pepeAnswer);
          const rawPepeSegments = analyzeEmotionalSegments(pepeAnswer, pepeSpeakTime);
          const pepeSegments = convertSegmentsForCharacter(rawPepeSegments, 'pepe');
          const pepeEmotion = pepeSegments.length > 0 ? pepeSegments[0].emotion : 'normal';
          
          const pepeResult = await generateSpeech(pepeAnswer, currentGuestVoice, currentGuestName, pepeEmotion, null, pepeSegments, recordingCallbacks);
          
          if (!pepeResult || !pepeResult.audioPath) {
            console.error('❌ ERROR: Pepe audio generation failed!');
            return null;
          }
          
          console.log('✅ Pepe: Audio ready!');
          return { pepeAnswer, pepeResult, pepeEmotion, pepeSegments, pepeSpeakTime };
        })();
        
        // Wait for Mr Cock audio and emit immediately
        const mrCockResult2 = await mrCockAudioPromise;
        
        const mrCockDialogue = {
          id: generateUniqueId(),
          user: 'Mr Cock',
          message: mrCockAsks,
          timestamp: 'Just now',
          isHost: true,
          hasAudio: true,
          audioPath: mrCockResult2?.audioPath,
          emotionSegments: mrCockSegments,
          questionData: {
            question: userQuestion.question,
            username: userQuestion.username
          }
        };
        
        io.emit('podcast_dialogue', mrCockDialogue);
        console.log('✅ Mr Cock dialogue emitted to frontend');
        
        if (recordingCallbacks && recordingCallbacks.isRecording && recordingCallbacks.addDialogue) {
          recordingCallbacks.addDialogue(mrCockDialogue);
        }
        
        // Wait for Pepe's full pipeline to complete
        const pepeData = await pepeFullPipelinePromise;
        
        if (!pepeData) {
          console.error('❌ ERROR: Pepe pipeline failed, skipping this question');
          continue;
        }
        
        const { pepeAnswer, pepeResult, pepeEmotion, pepeSegments, pepeSpeakTime } = pepeData;
        
        // Emit guest immediately (frontend will queue it)
        io.emit('podcast_dialogue', {
          id: generateUniqueId(),
          user: currentGuestName, // USE DYNAMIC GUEST NAME
          message: pepeAnswer,
          timestamp: 'Just now',
          isGuest: true,
          hasAudio: true,
          audioPath: pepeResult?.audioPath,
          emotion: pepeEmotion,
          emotionSegments: pepeSegments
        });
        console.log(`✅ ${currentGuestName} dialogue emitted to frontend (queued for playback)`);
        
        // 🔥 PIPELINE OPTIMIZATION: Start preparing NEXT question while Pepe speaks!
        let nextMrCockPipeline = null;
        let nextPepePipeline = null;
        
        if (conversationQueue.length > 0) {
          console.log('🚀 PIPELINE: Next question detected! Pre-generating while Pepe speaks...');
          const nextQuestion = conversationQueue[0]; // Peek at next question
          
          // Replace @pepe/@guest mentions with actual guest name
          let cleanedNextQuestion = nextQuestion.question
            .replace(/@pepe\b/gi, `@${currentGuestName}`)
            .replace(/@guest\b/gi, `@${currentGuestName}`);
          
          const nextMrCockAsks = `${nextQuestion.username} from chat asks: "${cleanedNextQuestion}" Let me pose this to our guest. ${currentGuestName}, your thoughts?`;
          const nextMrCockSpeakTime = calculateSpeakingTime(nextMrCockAsks);
          const nextMrCockSegments = analyzeEmotionalSegments(nextMrCockAsks, nextMrCockSpeakTime);
          
          // Generate Mr Cock audio FIRST (separate from Pepe)
          console.log('🚀 PIPELINE: Starting Mr Cock audio generation...');
          nextMrCockPipeline = {
            question: nextQuestion,
            audioPromise: generateSpeech(nextMrCockAsks, 'onyx', 'Mr Cock', 'normal', {
              question: nextQuestion.question,
              username: nextQuestion.username
            }, null, recordingCallbacks),
            message: nextMrCockAsks,
            speakTime: nextMrCockSpeakTime,
            segments: nextMrCockSegments
          };
          
          // Start Pepe pipeline in parallel (but independently)
          console.log('🚀 PIPELINE: Starting Pepe pipeline...');
          nextPepePipeline = (async () => {
            const nextPepeAnswer = await getPepeResponse(`${nextQuestion.username} asked: "${nextQuestion.question}"`, false, nextQuestion.username);
            if (!nextPepeAnswer || nextPepeAnswer.trim() === '') return null;
            
            const nextPepeSpeakTime = calculateSpeakingTime(nextPepeAnswer);
            const rawNextPepeSegments = analyzeEmotionalSegments(nextPepeAnswer, nextPepeSpeakTime);
            const nextPepeSegments = convertSegmentsForCharacter(rawNextPepeSegments, 'pepe');
            const nextPepeEmotion = nextPepeSegments.length > 0 ? nextPepeSegments[0].emotion : 'normal';
            
            const nextPepeResult = await generateSpeech(nextPepeAnswer, currentGuestVoice, currentGuestName, nextPepeEmotion, null, nextPepeSegments, recordingCallbacks);
            if (!nextPepeResult || !nextPepeResult.audioPath) return null;
            
            return { nextPepeAnswer, nextPepeResult, nextPepeEmotion, nextPepeSegments, nextPepeSpeakTime };
          })();
        }
        
        // Only wait for Pepe's speaking time (Mr Cock already emitted and playing on frontend)
        console.log(`⏱️ Waiting for Pepe to finish speaking: ${pepeSpeakTime}ms`);
        await sleep(pepeSpeakTime);
        
        console.log('✅ Pepe finished speaking, clearing question from screen...');
        io.emit('question_answered');
        
        // 🔥 If next question was pre-generated, emit Mr Cock IMMEDIATELY!
        if (nextMrCockPipeline) {
          console.log('⚡⚡⚡ INSTANT EMIT: Mr Cock audio ready, emitting NOW!');
          conversationQueue.shift(); // Remove from queue
          
          // Wait for Mr Cock audio to be ready
          const nextMrCockResult = await nextMrCockPipeline.audioPromise;
          
          // Emit Mr Cock IMMEDIATELY (don't wait for Pepe!)
          const nextMrCockDialogue = {
            id: generateUniqueId(),
            user: 'Mr Cock',
            message: nextMrCockPipeline.message,
            timestamp: 'Just now',
            isHost: true,
            hasAudio: true,
            audioPath: nextMrCockResult?.audioPath,
            emotionSegments: nextMrCockPipeline.segments,
            questionData: {
              question: nextMrCockPipeline.question.question,
              username: nextMrCockPipeline.question.username
            }
          };
          io.emit('podcast_dialogue', nextMrCockDialogue);
          console.log('✅ Mr Cock emitted INSTANTLY - no delay!');
          
          if (recordingCallbacks && recordingCallbacks.isRecording && recordingCallbacks.addDialogue) {
            recordingCallbacks.addDialogue(nextMrCockDialogue);
          }
          
          // Wait for Pepe pipeline to complete (in background)
          if (nextPepePipeline) {
            const nextPepeData = await nextPepePipeline;
            
            if (nextPepeData) {
              // Emit guest as soon as ready
              io.emit('podcast_dialogue', {
                id: generateUniqueId(),
                user: currentGuestName, // USE DYNAMIC GUEST NAME
                message: nextPepeData.nextPepeAnswer,
                timestamp: 'Just now',
                isGuest: true,
                hasAudio: true,
                audioPath: nextPepeData.nextPepeResult?.audioPath,
                emotion: nextPepeData.nextPepeEmotion,
                emotionSegments: nextPepeData.nextPepeSegments
              });
              console.log(`✅ ${currentGuestName} emitted (queued for after Mr Cock)`);
              
              // Wait for them to finish speaking
              const nextTotalTime = nextMrCockPipeline.speakTime + nextPepeData.nextPepeSpeakTime;
              console.log(`⏱️ Next question speaking time: ${nextTotalTime}ms`);
              await sleep(nextTotalTime);
              io.emit('question_answered');
            } else {
              console.error('❌ Pepe pipeline failed for next question');
              // Just wait for Mr Cock to finish
              await sleep(nextMrCockPipeline.speakTime);
              io.emit('question_answered');
            }
          } else {
            // No Pepe pipeline, just wait for Mr Cock
            await sleep(nextMrCockPipeline.speakTime);
          }
        }
        
      } else {
        const timeRemaining = episodeDuration - (Date.now() - episodeStartTime);
        if (timeRemaining < 30000) {
          console.log(`⏰ Less than 30 seconds left (${Math.floor(timeRemaining/1000)}s), ending with outro...`);
          await endEpisodeOutro(io, getAudioDuration, recordingCallbacks, broadcastState);
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
          console.log(`🔍 DEBUG: Guest name for banter: "${currentGuestName}"`);
          const mrCockBanter = await getMrCockResponse(`Ask ${currentGuestName} about ${topic}`, false, currentGuestName);
          
          console.log('⚡ PARALLEL: Mr Cock audio + Pepe full pipeline...');
          const mrCockBanterAudioPromise = generateSpeech(mrCockBanter, 'onyx', 'Mr Cock', 'normal', null, null, recordingCallbacks);
          
          const pepeBanterPipelinePromise = (async () => {
            console.log('🐸 Pepe: Getting banter response...');
            const pepeBanter = await getPepeResponse(mrCockBanter, false, 'everyone watching');
            
            console.log('🐸 Pepe: Banter received, generating audio...');
            const pepeBanterTime = calculateSpeakingTime(pepeBanter);
            const rawPepeBanterSegments = analyzeEmotionalSegments(pepeBanter, pepeBanterTime);
            const pepeBanterSegments = convertSegmentsForCharacter(rawPepeBanterSegments, 'pepe');
            const pepeBanterEmotion = pepeBanterSegments.length > 0 ? pepeBanterSegments[0].emotion : 'normal';
            
            const pepeBanterResult = await generateSpeech(pepeBanter, currentGuestVoice, currentGuestName, pepeBanterEmotion, null, pepeBanterSegments, recordingCallbacks);
            
            console.log('✅ Pepe: Banter audio ready!');
            return { pepeBanter, pepeBanterResult, pepeBanterEmotion, pepeBanterSegments, pepeBanterTime };
          })();
          
          // Emit Mr Cock immediately
          const mrCockBanterResult = await mrCockBanterAudioPromise;
          io.emit('podcast_dialogue', {
            id: generateUniqueId(),
            user: 'Mr Cock',
            message: mrCockBanter,
            timestamp: 'Just now',
            isHost: true,
            hasAudio: true,
            audioPath: mrCockBanterResult?.audioPath
          });
          console.log('✅ Mr Cock banter emitted to frontend');
          
          // Wait for Pepe pipeline
          const pepeBanterData = await pepeBanterPipelinePromise;
          const { pepeBanter, pepeBanterResult, pepeBanterEmotion, pepeBanterSegments, pepeBanterTime } = pepeBanterData;
          
          // Emit guest immediately (frontend will queue)
          io.emit('podcast_dialogue', {
            id: generateUniqueId(),
            user: currentGuestName, // USE DYNAMIC GUEST NAME
            message: pepeBanter,
            timestamp: 'Just now',
            isGuest: true,
            hasAudio: true,
            audioPath: pepeBanterResult?.audioPath,
            emotion: pepeBanterEmotion,
            emotionSegments: pepeBanterSegments
          });
          console.log(`✅ ${currentGuestName} banter emitted to frontend (queued)`);
          
          // Only wait for Pepe to finish (Mr Cock already emitted and playing)
          console.log(`⏱️ Waiting for Pepe banter to finish: ${pepeBanterTime}ms`);
          await sleep(pepeBanterTime);
          
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
            id: generateUniqueId(),
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
            const timeRemaining = episodeDuration - (Date.now() - episodeStartTime);
            if (timeRemaining < 30000) {
              console.log(`⏰ Less than 30 seconds left after pause (${Math.floor(timeRemaining/1000)}s), ending with outro...`);
              await endEpisodeOutro(io, getAudioDuration, recordingCallbacks, broadcastState);
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
      console.error('❌❌❌ CONVERSATION LOOP ERROR ❌❌❌');
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('This will cause the loop to skip the current question!');
      await sleep(3000);
    }
  }
}

