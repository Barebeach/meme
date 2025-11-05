import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin;

/**
 * Stream Page - ONLY shows the video stream (for OBS streaming to Pump.fun)
 * No UI elements, no chat, just the video
 */
function Stream() {
  const { slotId } = useParams();
  const [socket, setSocket] = useState(null);
  const [hostVideos, setHostVideos] = useState(null);
  const [guestVideos, setGuestVideos] = useState(null);
  const [transitionVideo, setTransitionVideo] = useState(null);
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [currentEmotion, setCurrentEmotion] = useState('normal');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const videoRef1 = useRef(null);
  const videoRef2 = useRef(null);
  const [activeVideo, setActiveVideo] = useState(1);
  const [currentSrc, setCurrentSrc] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(null); // Only show questions, not dialogue
  const audioQueueRef = useRef([]);
  const isPlayingAudioRef = useRef(false);
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  useEffect(() => {
    // AUTO-UNLOCK for OBS streaming (no interaction needed)
    setIsUnlocked(true);
    
    // Load videos immediately
    loadVideos();
    
    // Poll for broadcast state every 5 seconds
    const checkBroadcastState = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/broadcast-state`);
        if (res.ok) {
          const state = await res.json();
          if (state.isLive) {
            setIsUnlocked(true);
          }
        }
      } catch (error) {
        console.error('Failed to check broadcast state:', error);
      }
    };
    
    checkBroadcastState(); // Check immediately
    const pollInterval = setInterval(checkBroadcastState, 5000); // Check every 5 seconds
    
    // Connect to socket
    const newSocket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10
    });

    newSocket.on('connect', () => {
      console.log('🎥 Stream connected:', slotId);
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
    });

    newSocket.on('broadcast-state', (state) => {
      console.log('📡 Broadcast state:', state);
      if (state.isLive) {
        setIsUnlocked(true);
      }
    });

    // Countdown event
    newSocket.on('countdown', (data) => {
      console.log('⏰ Countdown:', data.seconds);
      if (data.seconds === 0) {
        setIsUnlocked(true);
      }
    });

    // Video emotion events (for synced video changes)
    newSocket.on('video-emotion', ({ speaker, emotion }) => {
      console.log('🎭 Video emotion change:', speaker, emotion);
      setCurrentSpeaker(speaker);
      setCurrentEmotion(emotion || 'normal');
    });

    // Dialogue events - play audio and sync video
    let emotionTimeouts = [];
    
    // Process audio queue with video sync (define before using)
    const processAudioQueue = async () => {
      if (isPlayingAudioRef.current || audioQueueRef.current.length === 0) {
        return;
      }

      isPlayingAudioRef.current = true;
      const msg = audioQueueRef.current.shift();

      console.log(`🔊 Playing: ${msg.user}`);

      try {
        // Fetch and play audio
        const response = await fetch(`${API_URL}${msg.audioPath}`);
        if (response.ok) {
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          
          // Clear any previous emotion timeouts
          emotionTimeouts.forEach(timeout => clearTimeout(timeout));
          emotionTimeouts = [];
          
          // Update speaker and emotion based on dialogue
          if (msg.isHost) {
            setCurrentSpeaker('Mr Cock');
            setCurrentEmotion('normal');
            console.log('🎭 Set speaker: Mr Cock (normal)');
            
            // If Mr Cock has questionData, show the question
            if (msg.questionData) {
              console.log('📝 Showing question from:', msg.questionData.username);
              setCurrentQuestion(msg.questionData);
            }
          } else if (msg.isGuest) {
            setCurrentSpeaker('Pepe');
            const initialEmotion = msg.emotion || 'normal';
            setCurrentEmotion(initialEmotion);
            console.log(`🐸 Set speaker: Pepe (${initialEmotion})`);
            
            // Schedule emotion changes if emotion segments exist
            if (msg.emotionSegments && msg.emotionSegments.length > 0) {
              console.log(`🎭 Scheduling ${msg.emotionSegments.length} emotion changes for Pepe`);
              msg.emotionSegments.forEach((segment, index) => {
                const timeout = setTimeout(() => {
                  console.log(`🎭 Emotion change ${index + 1}/${msg.emotionSegments.length}: ${segment.emotion}`);
                  setCurrentEmotion(segment.emotion);
                }, segment.startTime || 0);
                emotionTimeouts.push(timeout);
              });
            }
          }
          
          // Play audio
          await audio.play();
          
          // Wait for audio to finish
          await new Promise((resolve) => {
            audio.onended = () => {
              URL.revokeObjectURL(audioUrl);
              console.log(`✅ Finished playing ${msg.user}`);
              
              // Clear emotion timeouts
              emotionTimeouts.forEach(timeout => clearTimeout(timeout));
              
              // Show transition immediately if no more audio
              setTimeout(() => {
                if (!isPlayingAudioRef.current && audioQueueRef.current.length === 0) {
                  console.log('🎬 Showing transition');
                  setCurrentSpeaker(null);
                  setCurrentEmotion('normal');
                }
              }, 100);
              
              resolve();
            };
          });
          
          isPlayingAudioRef.current = false;
          
          // Process next in queue
          if (audioQueueRef.current.length > 0) {
            processAudioQueue();
          }
        }
      } catch (error) {
        console.error('❌ Audio playback error:', error);
        isPlayingAudioRef.current = false;
        if (audioQueueRef.current.length > 0) {
          processAudioQueue();
        }
      }
    };
    
    // Listen for dialogue events
    newSocket.on('podcast_dialogue', (dialogue) => {
      console.log('💬 Dialogue received:', dialogue.user, 'emotion:', dialogue.emotion);
      
      // Add to audio queue if has audio
      if (dialogue.hasAudio && dialogue.audioPath) {
        console.log('📥 Added to audio queue:', dialogue.user);
        audioQueueRef.current.push(dialogue);
        processAudioQueue();
      }
    });
    
    // Listen for question being answered - clear it from screen
    newSocket.on('question_answered', () => {
      console.log('✅ Question answered - clearing from screen');
      setCurrentQuestion(null);
    });

    // Transition events
    newSocket.on('show_transition', () => {
      console.log('🎬 Showing transition');
      setCurrentSpeaker(null);
      setCurrentEmotion('normal');
    });

    // Episode ended event
    newSocket.on('episode_ended', () => {
      console.log('🎬 Episode ended');
      setCurrentSpeaker(null);
      setCurrentQuestion(null);
    });

    setSocket(newSocket);

    return () => {
      clearInterval(pollInterval);
      emotionTimeouts.forEach(timeout => clearTimeout(timeout));
      newSocket.disconnect();
    };
  }, [slotId]);

  const loadVideos = async () => {
    try {
      console.log('🎥 Loading videos from API...');
      
      // Load host videos (Mr Cock)
      try {
        const hostRes = await fetch(`${API_URL}/api/videos/hosts/mrcock`);
        if (hostRes.ok) {
          const hostData = await hostRes.json();
          setHostVideos(hostData);
          console.log('✅ Host videos loaded:', Object.keys(hostData).length, 'emotions');
        } else {
          console.warn('⚠️ Host videos not available (status:', hostRes.status, ')');
        }
      } catch (err) {
        console.error('❌ Failed to load host videos:', err);
      }
      
      // Load guest videos (Pepe - will be default)
      try {
        const guestRes = await fetch(`${API_URL}/api/videos/guests/pepe`);
        if (guestRes.ok) {
          const guestData = await guestRes.json();
          setGuestVideos(guestData);
          console.log('✅ Guest videos loaded:', Object.keys(guestData).length, 'emotions');
        } else {
          console.warn('⚠️ Guest videos not available (status:', guestRes.status, ')');
        }
      } catch (err) {
        console.error('❌ Failed to load guest videos:', err);
      }
      
      // Load transition video
      try {
        const transitionRes = await fetch(`${API_URL}/api/videos/transition`);
        if (transitionRes.ok) {
          const transitionData = await transitionRes.json();
          setTransitionVideo(transitionData);
          console.log('✅ Transition video loaded');
      } else {
          console.warn('⚠️ Transition video not available (status:', transitionRes.status, ')');
        }
      } catch (err) {
        console.error('❌ Failed to load transition video:', err);
      }
      
      console.log('✅ Video loading complete!');
    } catch (error) {
      console.error('❌ Failed to load videos:', error);
    }
  };

  // Helper function to get video for emotion (same logic as Home.jsx)
  const getVideoForEmotion = (videoMap, emotion, isHost) => {
    if (!videoMap) return null;
    
    if (isHost) {
      const emotionMap = {
        'happy': 'laughing',
        'screaming': 'angry',
        'shocked': 'thinking'
      };
      const mappedEmotion = emotionMap[emotion] || emotion;
      return videoMap[mappedEmotion] || videoMap.normal;
    } else {
      const emotionMap = {
        'laughing': 'happy',
        'shocked': 'thinking'
      };
      const mappedEmotion = emotionMap[emotion] || emotion;
      return videoMap[mappedEmotion] || videoMap.normal;
    }
  };

  // Update current video source
  // PREFER MP4 for OBS Browser Source compatibility (more reliable than WebM)
  useEffect(() => {
    let newSrc = '';
    
    if (!currentSpeaker && transitionVideo) {
      // Show transition when no speaker
      newSrc = isMobile ? transitionVideo.gif : (transitionVideo.mp4 || transitionVideo.webm);
      console.log('🎬 Showing transition video');
    } else if (currentSpeaker === 'Mr Cock' && hostVideos) {
      const urls = getVideoForEmotion(hostVideos, currentEmotion, true);
      if (urls) {
        newSrc = isMobile ? urls.gif : (urls.mp4 || urls.webm);
        console.log(`🎭 Mr Cock speaking with emotion: ${currentEmotion}`);
      }
    } else if (currentSpeaker === 'Pepe' && guestVideos) {
      const urls = getVideoForEmotion(guestVideos, currentEmotion, false);
      if (urls) {
        newSrc = isMobile ? urls.gif : (urls.mp4 || urls.webm);
        console.log(`🐸 Pepe speaking with emotion: ${currentEmotion}`);
      }
    } else if (transitionVideo && !currentSrc) {
      // DEFAULT: Show transition video if nothing else is set
      newSrc = isMobile ? transitionVideo.gif : (transitionVideo.mp4 || transitionVideo.webm);
      console.log('🎬 Default: showing transition');
    }

    if (newSrc && newSrc !== currentSrc) {
      console.log('✅ Video source updated:', newSrc);
      setCurrentSrc(newSrc);
    }
  }, [currentSpeaker, currentEmotion, hostVideos, guestVideos, transitionVideo, isMobile, currentSrc]);

  // Handle video crossfade
  useEffect(() => {
    if (!currentSrc || !isUnlocked) return;

    if (!isMobile) {
      const currentVideo = activeVideo === 1 ? videoRef1.current : videoRef2.current;
      const nextVideo = activeVideo === 1 ? videoRef2.current : videoRef1.current;
      
      if (!currentVideo || !nextVideo) return;

      const needsChange = currentVideo.src !== currentSrc && !currentVideo.src.endsWith(currentSrc);
      
      if (needsChange) {
        nextVideo.src = currentSrc;
        nextVideo.style.opacity = '0';
        nextVideo.style.zIndex = '1';
        
        const onCanPlay = () => {
          nextVideo.play().catch(err => {
            if (err.name !== 'AbortError') {
              console.log('Play delayed, will retry');
            }
          });
          
          nextVideo.style.transition = 'opacity 0.4s ease-in-out';
          nextVideo.style.opacity = '1';
          nextVideo.style.zIndex = '2';
          
          currentVideo.style.transition = 'opacity 0.4s ease-in-out';
          currentVideo.style.opacity = '0';
          currentVideo.style.zIndex = '1';
          
          setTimeout(() => {
            currentVideo.pause();
            setActiveVideo(activeVideo === 1 ? 2 : 1);
          }, 400);
        };
        
        nextVideo.addEventListener('canplay', onCanPlay, { once: true });
        nextVideo.load();
        
        return () => {
          nextVideo.removeEventListener('canplay', onCanPlay);
        };
      }
    }
  }, [currentSrc, isUnlocked, isMobile, activeVideo]);

  // Debug output (commented out to reduce console spam)
  // console.log('🎥 Stream Debug:', {
  //   currentSrc,
  //   isUnlocked,
  //   hostVideos: !!hostVideos,
  //   guestVideos: !!guestVideos,
  //   transitionVideo: !!transitionVideo,
  //   currentSpeaker,
  //   currentEmotion
  // });

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      backgroundColor: '#000',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {!currentSrc ? (
        <div style={{ color: 'white', fontSize: '24px', textAlign: 'center' }}>
          <div>🎥 Stream Ready</div>
          <div style={{ fontSize: '14px', marginTop: '10px', opacity: 0.6 }}>
            Waiting for video data...
          </div>
        </div>
      ) : !isMobile ? (
        <>
          <video
            ref={videoRef1}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              opacity: activeVideo === 1 ? 1 : 0,
              zIndex: activeVideo === 1 ? 2 : 1,
              transition: 'opacity 0.4s ease-in-out'
            }}
          />
          <video
            ref={videoRef2}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              opacity: activeVideo === 2 ? 1 : 0,
              zIndex: activeVideo === 2 ? 2 : 1,
              transition: 'opacity 0.4s ease-in-out'
            }}
          />
        </>
      ) : (
        <img
          src={currentSrc}
          alt="Stream"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
        />
      )}
      
      {/* Question Text Overlay - Only show user questions, not dialogue */}
      {currentQuestion && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          maxWidth: '90%',
          backgroundColor: 'rgba(139, 92, 246, 0.95)',
          color: 'white',
          padding: '15px 25px',
          borderRadius: '12px',
          fontSize: '18px',
          fontWeight: '500',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          zIndex: 1000,
          animation: 'slideUp 0.3s ease-out'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '16px', opacity: 0.9 }}>
            💬 @{currentQuestion.username} asked:
          </div>
          <div style={{ fontSize: '20px', fontWeight: '600' }}>
            {currentQuestion.question}
          </div>
        </div>
      )}
    </div>
  );
}

export default Stream;

