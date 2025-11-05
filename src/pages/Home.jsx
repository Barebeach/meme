import { useState, useRef, useEffect } from 'react'
import { io } from 'socket.io-client'
import { VideoPlayer, unlockAllVideos } from '../components/VideoPlayer'

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin;

function Home() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [socket, setSocket] = useState(null);
  const [username, setUsername] = useState('');
  const [showUsernameModal, setShowUsernameModal] = useState(true);
  const [tempUsername, setTempUsername] = useState('');
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);
  const [onlineCount, setOnlineCount] = useState(17);
  const [rateLimitMessage, setRateLimitMessage] = useState('');
  const [episodeStarted, setEpisodeStarted] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [currentEmotion, setCurrentEmotion] = useState('normal');
  const [countdown, setCountdown] = useState(15);
  const [dialogueMessages, setDialogueMessages] = useState([]);
  const [hostVideos, setHostVideos] = useState({});
  const [guestVideos, setGuestVideos] = useState({});
  const [currentGuest, setCurrentGuest] = useState('pepe');
  const [currentGuestInfo, setCurrentGuestInfo] = useState(null); // Meme name, image from application
  const [transitionVideo, setTransitionVideo] = useState(null);
  const [showTransition, setShowTransition] = useState(false);
  const [episodeEnded, setEpisodeEnded] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const chatEndRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const videoRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingAudioRef = useRef(false);
  const lastMessageTimeRef = useRef(0);
  
  const getVideoForEmotion = (videoMap, emotion, isHost) => {
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
  
  useEffect(() => {
    window.scrollTo(0, 0);
    
    const loadVideoMappings = async () => {
      try {
        const hostRes = await fetch(`${API_URL}/api/videos/hosts/mrcock`);
        if (hostRes.ok) {
          const hostData = await hostRes.json();
          setHostVideos(hostData);
          console.log('✅ Host videos loaded:', hostData);
        }
        
        const guestRes = await fetch(`${API_URL}/api/videos/guests/${currentGuest}`);
        if (guestRes.ok) {
          const guestData = await guestRes.json();
          setGuestVideos(guestData);
          console.log('✅ Guest videos loaded:', guestData);
        }
        
        const transitionRes = await fetch(`${API_URL}/api/videos/transition`);
        if (transitionRes.ok) {
          const transitionData = await transitionRes.json();
          setTransitionVideo(transitionData);
          console.log('✅ Transition video loaded:', transitionData);
        }
      } catch (error) {
        console.error('Failed to load video mappings:', error);
      }
    };
    
    const checkBroadcastState = async () => {
      try {
        const stateRes = await fetch(`${API_URL}/api/admin/broadcast-state`);
        if (stateRes.ok) {
          const state = await stateRes.json();
          
          // Update guest info if custom guest is set
          if (state.isCustomGuest && state.guestData) {
            setCurrentGuestInfo({
              name: state.guestData.memeName,
              image: state.guestData.memeImage
            });
            console.log(`🎭 Custom guest detected: ${state.guestData.memeName}`);
          } else {
            setCurrentGuestInfo(null); // Reset to default Pepe
          }
          
          if (state.isLive) {
            if (state.countdown !== null && state.countdown > 0) {
              setCountdown(state.countdown);
            } else if (state.episodeStarted) {
              setEpisodeStarted(true);
              setCountdown(null);
            }
          } else {
            if (audioQueueRef.current.length === 0 && !isPlayingAudioRef.current) {
              console.log('🛑 Backend stopped and audio queue empty - resetting to waiting state');
              setCountdown(null);
              setEpisodeStarted(false);
            } else {
              console.log(`⏳ Backend stopped but ${audioQueueRef.current.length} audio items still in queue - keeping episode started`);
            }
          }
        }
      } catch (error) {
        console.error('Failed to check broadcast state:', error);
      }
    };

    const loadEpisodes = async () => {
      try {
        const episodesRes = await fetch(`${API_URL}/api/episodes`);
        if (episodesRes.ok) {
          const episodesData = await episodesRes.json();
          setEpisodes(episodesData);
          console.log('✅ Episodes loaded:', episodesData.length, 'episodes');
        }
      } catch (error) {
        console.error('Failed to load episodes:', error);
      }
    };

    loadVideoMappings();
    checkBroadcastState();
    loadEpisodes();
    
    const pollInterval = setInterval(checkBroadcastState, 5000);

    const fluctuateOnlineCount = setInterval(() => {
      setOnlineCount(prev => {
        const variation = Math.floor(Math.random() * 3) - 1;
        return Math.max(16, Math.min(18, prev + variation));
      });
    }, 5000);
    
    return () => {
      clearInterval(pollInterval);
      clearInterval(fluctuateOnlineCount);
    };
  }, [currentGuest]);

  const processAudioQueue = async () => {
    if (isPlayingAudioRef.current || audioQueueRef.current.length === 0) {
      return;
    }

    isPlayingAudioRef.current = true;
    const msg = audioQueueRef.current.shift(); // Get first item

    console.log(`🔊 PREPARING: ${msg.user}`);

    try {
      if (!msg.audioPath) {
        console.error(`❌ No audio path provided for ${msg.user}`);
        isPlayingAudioRef.current = false;
        if (audioQueueRef.current.length > 0) {
          processAudioQueue();
        }
        return;
      }
      
      console.log(`⚡ FETCHING PRE-GENERATED AUDIO: ${msg.audioPath}`);
      
      const response = await fetch(`${API_URL}${msg.audioPath}`);
      
      console.log(`📡 Audio fetch status: ${response.status}`);
      
      if (response.ok) {
        const fetchEndTime = performance.now();
        console.log(`✅ Audio loaded INSTANTLY for: ${msg.user} (fetch took ${(fetchEndTime - performance.now() + 50).toFixed(0)}ms)`);
        const audioBlob = await response.blob();
        console.log(`📦 Blob size: ${(audioBlob.size / 1024).toFixed(1)}KB, type: ${audioBlob.type}`);
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.type = 'audio/mpeg';
        
        // FAST PRELOAD - wait for "canplay" not "canplaythrough" (much faster!)
        await new Promise((resolve) => {
          audio.oncanplay = () => {
            console.log(`🎵 Audio ready to play for: ${msg.user}`);
            resolve();
          };
          audio.onerror = (e) => {
            console.error(`❌ Audio load error for ${msg.user}:`, e);
            resolve();
          };
          audio.load();
          // Timeout fallback - don't wait more than 500ms
          setTimeout(resolve, 500);
        });
        
        console.log(`🎬 NOW PLAYING (SYNCED): ${msg.user}`);
        
        // Wait for audio to finish before playing next
        const emotionTimeouts = [];
        const audioStartTime = performance.now();
        
        await new Promise((resolve) => {
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            const audioEndTime = performance.now();
            const audioDuration = audioEndTime - audioStartTime;
            console.log(`✅ Finished playing ${msg.user} (duration: ${(audioDuration / 1000).toFixed(1)}s)`);
            
            if (audioQueueRef.current.length > 0) {
              console.log(`⚡ NEXT SPEAKER READY: Queue has ${audioQueueRef.current.length} messages waiting`);
            } else {
              console.log(`⏸️ NO NEXT SPEAKER: Queue is empty - will show transition`);
            }
            
            // Clear all emotion timeouts
            emotionTimeouts.forEach(timeout => clearTimeout(timeout));
            // DON'T clear speaker yet - keep showing until next audio is ready
            // Quick check if next speaker is coming (minimal delay for smooth flow)
            setTimeout(() => {
              // Only check if audio is currently playing - don't care about queue length!
              if (!isPlayingAudioRef.current) {
                console.log(`🎬 Switching to TRANSITION video (bothshutup) - no audio playing`);
                setCurrentSpeaker(null);
              } else {
                console.log(`⚡ SKIPPING TRANSITION: Audio still playing!`);
              }
            }, 100);
            
            // If Pepe just finished answering a question, clear it from screen
            if (msg.isGuest && currentQuestion) {
              console.log('✅ Pepe finished answering - clearing question from screen');
              setCurrentQuestion(null);
            }
            
            // If this was the OUTRO, automatically end the episode
            if (msg.isOutro) {
              console.log('🎬 OUTRO FINISHED - Ending episode now!');
              setTimeout(() => {
                console.log('📊 Final check - Audio queue length:', audioQueueRef.current.length);
                setEpisodeEnded(true);
                setEpisodeStarted(false);
                setCurrentSpeaker(null);
                setShowTransition(false);
                audioQueueRef.current = []; // Clear any remaining queue
                isPlayingAudioRef.current = false;
                console.log('✅ Episode completely ended - all audio finished');
              }, 1000); // 1 second delay after outro
            }
            
            resolve();
          };
          audio.onerror = () => {
            console.error(`❌ Error playing ${msg.user}`);
            emotionTimeouts.forEach(timeout => clearTimeout(timeout));
            // Keep showing speaker, don't immediately switch to transition
            setTimeout(() => {
              if (!isPlayingAudioRef.current || audioQueueRef.current.length === 0) {
                setCurrentSpeaker(null);
              }
            }, 300);
            // Also clear question if there was an error
            if (msg.isGuest && currentQuestion) {
              setCurrentQuestion(null);
            }
            resolve();
          };
          
          // START audio playback
          const playPromise = audio.play();
          
          // ALWAYS switch video immediately (don't wait for audio on mobile)
          const newSpeaker = msg.isGuest ? 'Pepe' : msg.isHost ? 'Mr Cock' : null;
          const isHost = msg.isHost || false;
          const validEmotion = getVideoForEmotion(isHost ? hostVideos : guestVideos, msg.emotion || 'normal', isHost) ? (msg.emotion || 'normal') : 'normal';
          console.log(`🔊 Switching video to: ${newSpeaker || 'TRANSITION (bothshutup)'} (${validEmotion})`);
          setCurrentSpeaker(newSpeaker);
          setCurrentEmotion(validEmotion);
          
          playPromise.then(() => {
            console.log(`✅ Audio playing successfully for ${msg.user}`);
            
            // 🎬 NOW schedule emotion changes - SYNCED with audio start!
            if (msg.emotionSegments && msg.emotionSegments.length > 0) {
              console.log(`🎭 Scheduling ${msg.emotionSegments.length} emotion changes...`);
              console.log(`🎭 Segments:`, msg.emotionSegments.map(s => `${s.emotion}@${s.startTime}ms`));
              msg.emotionSegments.forEach((segment, index) => {
                const timeout = setTimeout(() => {
                  const segmentEmotion = segment.emotion || 'normal';
                  console.log(`🎭🎬 SWITCHING VIDEO NOW! From ${currentEmotion} → ${segmentEmotion} (segment ${index + 1}/${msg.emotionSegments.length})`);
                  setCurrentEmotion(segmentEmotion);
                }, segment.startTime);
                emotionTimeouts.push(timeout);
              });
            } else {
              console.log(`⚠️ No emotion segments for ${msg.user}!`);
            }
            
            // Show question if this dialogue has one (Mr. Cock asking a user question)
            if (msg.questionData) {
              console.log('📝 Showing question NOW - audio is playing!');
              setCurrentQuestion(msg.questionData);
            } else if (msg.isHost && currentQuestion) {
              // If Mr. Cock is speaking about something else (not a question), clear the old question
              console.log('🗑️ Mr. Cock moved to new topic - clearing old question');
              setCurrentQuestion(null);
            }
          }).catch(err => {
            console.error('⚠️ Audio play blocked (mobile autoplay policy):', err.message);
            console.log('📱 Video will still play, but audio is muted. User needs to interact with page.');
            // Video will still switch (already done above), just no audio
            // Still schedule emotion changes
            if (msg.emotionSegments && msg.emotionSegments.length > 0) {
              msg.emotionSegments.forEach((segment, index) => {
                const timeout = setTimeout(() => {
                  setCurrentEmotion(segment.emotion || 'normal');
                }, segment.startTime);
                emotionTimeouts.push(timeout);
              });
            }
          });
        });
      }
    } catch (error) {
      console.error('Failed to play audio:', error);
      setCurrentSpeaker(null);
    }

    const processingEndTime = performance.now();
    isPlayingAudioRef.current = false;
    
    // Play next in queue
    if (audioQueueRef.current.length > 0) {
      const nextProcessStartTime = performance.now();
      const gap = nextProcessStartTime - processingEndTime;
      console.log(`🔄 Processing next in queue (${audioQueueRef.current.length} remaining) - Transition gap: ${gap.toFixed(0)}ms`);
      processAudioQueue();
    }
  };

  // Episodes are loaded from the backend (recorded live shows)

  // Smart auto-scroll: only scroll if user is near bottom
  useEffect(() => {
    const chatContainer = chatMessagesRef.current;
    if (!chatContainer) return;

    // Check if user is near bottom (within 150px)
    const isNearBottom = 
      chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < 150;

    // Only auto-scroll if user is already at/near bottom
    if (isNearBottom) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages]);

  const handleUnlock = async () => {
    if (audioUnlocked) return;
    
    await unlockAllVideos();
    setAudioUnlocked(true);
  };

  useEffect(() => {
    const handleFirstInteraction = () => {
      handleUnlock();
    };
    
    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('touchstart', handleFirstInteraction, { once: true });
    
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [audioUnlocked]);


  // Initialize Socket.io connection
  useEffect(() => {
    // Connect to the same server (works in both dev and production)
    const newSocket = io(API_URL, {
      transports: ['websocket', 'polling'], // Try WebSocket first, fallback to polling
      reconnection: true, // Auto-reconnect
      reconnectionDelay: 1000, // Wait 1s before reconnecting
      reconnectionDelayMax: 5000, // Max 5s between reconnection attempts
      reconnectionAttempts: 10, // Try 10 times before giving up
      timeout: 20000, // 20s connection timeout
      forceNew: false, // Reuse existing connection if available
      upgrade: true, // Allow transport upgrades
      rememberUpgrade: true, // Remember successful upgrade
      path: '/socket.io/' // Explicit path
    });
    
    newSocket.on('connect', () => {
      console.log('✅ Socket.IO Connected:', newSocket.id);
      console.log('   Transport:', newSocket.io.engine.transport.name);
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket.IO Connection Error:', error.message);
    });
    
    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO Disconnected:', reason);
    });
    
    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket.IO Reconnected after', attemptNumber, 'attempts');
    });
    
    newSocket.io.engine.on('upgrade', (transport) => {
      console.log('🔄 Socket.IO Transport Upgraded to:', transport.name);
    });
    
    setSocket(newSocket);

    // Listen for USER messages ONLY (not podcast dialogue)
    newSocket.on('message', (msg) => {
      // Ensure unique ID for every message to prevent React key conflicts
      const uniqueMsg = {
        ...msg,
        id: msg.id ? `${msg.id}-${Math.random()}` : `${Date.now()}-${Math.random()}`
      };
      setMessages(prev => [...prev, uniqueMsg]);
    });

    // Listen for PODCAST DIALOGUE (separate from chat) - ADD TO AUDIO QUEUE!
    newSocket.on('podcast_dialogue', (msg) => {
      console.log('🎤 PODCAST DIALOGUE RECEIVED:', msg);
      console.log('   Speaker:', msg.user);
      console.log('   Has Audio:', msg.hasAudio);
      console.log('   Audio Path:', msg.audioPath);
      
      setDialogueMessages(prev => [...prev, msg]); // Store in separate dialogue list
      
      // Add to audio queue for playback
      if (msg.hasAudio) {
        console.log(`📥 Added ${msg.user} to audio queue`);
        audioQueueRef.current.push(msg);
        processAudioQueue(); // Start processing if not already playing
      }
    });

    // Listen for countdown from admin
    newSocket.on('countdown', (data) => {
      if (data.seconds > 0) {
        setCountdown(data.seconds);
        setEpisodeStarted(false);
      } else {
        setCountdown(null);
        setEpisodeStarted(true);
      }
    });

    // Listen for episode ending
    newSocket.on('episode_ended', (data) => {
      console.log('🎬 Episode ending signal received from backend!', data);
      
      // DON'T immediately stop - let the outro finish!
      // The outro's onended callback will handle the actual ending
      // Just mark that no new audio should be queued
      console.log('⏳ Waiting for outro to finish before ending episode...');
      console.log(`📊 Audio queue has ${audioQueueRef.current.length} items remaining`);
      
      // Check if there's an outro in the queue - if so, let it play
      const hasOutro = audioQueueRef.current.some(msg => msg.isOutro);
      
      if (!hasOutro && !isPlayingAudioRef.current) {
        // If no outro is queued or playing, end immediately
        console.log('⚠️ No outro found - ending episode now');
        setEpisodeEnded(true);
        setEpisodeStarted(false);
        setCurrentSpeaker(null);
        setShowTransition(false);
        audioQueueRef.current = [];
        isPlayingAudioRef.current = false;
      } else {
        console.log('✅ Outro will play - episode will end when it finishes');
      }
    });

    // Listen for user count updates
    newSocket.on('user_count', (count) => {
      setOnlineCount(count);
    });

    // Listen for rate limit warnings
    newSocket.on('rate_limit', (msg) => {
      setRateLimitMessage(msg);
      setTimeout(() => setRateLimitMessage(''), 3000);
    });

    // Listen for spam detection
    newSocket.on('spam_detected', (msg) => {
      setRateLimitMessage(msg);
      setTimeout(() => setRateLimitMessage(''), 3000);
    });

    // Listen for question being answered - clear it from screen
    newSocket.on('question_answered', () => {
      console.log('✅✅✅ QUESTION ANSWERED - CLEARING FROM SCREEN ✅✅✅');
      setCurrentQuestion(null);
    });

    return () => newSocket.close();
  }, []);

  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    
    const name = tempUsername.trim();
    
    if (!name) {
      setRateLimitMessage('Please enter a username!');
      setTimeout(() => setRateLimitMessage(''), 3000);
      return;
    }
    
    if (name.length > 20) {
      setRateLimitMessage('Username must be 20 characters or less!');
      setTimeout(() => setRateLimitMessage(''), 3000);
      return;
    }
    
    if (name.length < 2) {
      setRateLimitMessage('Username must be at least 2 characters!');
      setTimeout(() => setRateLimitMessage(''), 3000);
      return;
    }
    
    console.log('Setting username:', name);
    setUsername(name);
    setShowUsernameModal(false);
    
    if (socket && socket.connected) {
      socket.emit('join', name);
    }
    
    setMessages(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      user: 'System',
      message: `✅ Welcome, ${name}! You can now chat and ask questions.`,
      timestamp: 'Just now',
      isSystem: true
    }]);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!socket || !socket.connected) {
      console.error('Socket not connected');
      setRateLimitMessage('Connection lost. Refreshing...');
      setTimeout(() => window.location.reload(), 2000);
      return;
    }

    const message = newMessage.trim();
    if (!message) return;
    
    // Client-side rate limiting (2 seconds)
    const now = Date.now();
    const timeSinceLastMessage = now - lastMessageTimeRef.current;
    if (timeSinceLastMessage < 2000) {
      const remainingTime = Math.ceil((2000 - timeSinceLastMessage) / 1000);
      setRateLimitMessage(`Slow down! Wait ${remainingTime} second${remainingTime > 1 ? 's' : ''} before sending another message.`);
      setTimeout(() => setRateLimitMessage(''), 2000);
      return;
    }
    
    lastMessageTimeRef.current = now;
    console.log('Sending message:', message);
    socket.emit('send_message', { message });
    
    setMessages(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      user: username,
      message: message,
      timestamp: 'Just now',
      isYou: true,
      userColor: '#8b5cf6' // Default color for own messages
    }]);
    
    setNewMessage('');
  };

  // Send question directly to Pepe
  const handleAskPepe = () => {
    if (!socket || !socket.connected) {
      setRateLimitMessage('Connection lost. Refreshing...');
      setTimeout(() => window.location.reload(), 2000);
      return;
    }

    const message = newMessage.trim();
    if (!message) {
      setRateLimitMessage('Type your question first!');
      setTimeout(() => setRateLimitMessage(''), 3000);
      return;
    }

    // Character limit validation (200 characters max)
    if (message.length > 200) {
      setRateLimitMessage(`Question too long! Maximum 200 characters (you have ${message.length})`);
      setTimeout(() => setRateLimitMessage(''), 4000);
      return;
    }

    // Client-side rate limiting (2 seconds)
    const now = Date.now();
    const timeSinceLastMessage = now - lastMessageTimeRef.current;
    if (timeSinceLastMessage < 2000) {
      const remainingTime = Math.ceil((2000 - timeSinceLastMessage) / 1000);
      setRateLimitMessage(`Slow down! Wait ${remainingTime} second${remainingTime > 1 ? 's' : ''} before sending another message.`);
      setTimeout(() => setRateLimitMessage(''), 2000);
      return;
    }

    lastMessageTimeRef.current = now;
    const guestName = currentGuestInfo?.name || 'Pepe';
    const questionMessage = `@guest ${message}`;
    console.log(`Asking ${guestName}:`, questionMessage);
    socket.emit('send_message', { message: questionMessage });
    
    // Don't add message locally - let socket broadcast handle it to avoid duplicates
    
    setNewMessage('');
  };

  // Send question directly to Mr. Cock
  const handleAskCock = () => {
    if (!socket || !socket.connected) {
      setRateLimitMessage('Connection lost. Refreshing...');
      setTimeout(() => window.location.reload(), 2000);
      return;
    }

    const message = newMessage.trim();
    if (!message) {
      setRateLimitMessage('Type your question first!');
      setTimeout(() => setRateLimitMessage(''), 3000);
      return;
    }

    // Character limit validation (200 characters max)
    if (message.length > 200) {
      setRateLimitMessage(`Question too long! Maximum 200 characters (you have ${message.length})`);
      setTimeout(() => setRateLimitMessage(''), 4000);
      return;
    }

    // Client-side rate limiting (2 seconds)
    const now = Date.now();
    const timeSinceLastMessage = now - lastMessageTimeRef.current;
    if (timeSinceLastMessage < 2000) {
      const remainingTime = Math.ceil((2000 - timeSinceLastMessage) / 1000);
      setRateLimitMessage(`Slow down! Wait ${remainingTime} second${remainingTime > 1 ? 's' : ''} before sending another message.`);
      setTimeout(() => setRateLimitMessage(''), 2000);
      return;
    }

    lastMessageTimeRef.current = now;
    const questionMessage = `@host ${message}`;
    console.log('Asking Host (Mr. Cock):', questionMessage);
    socket.emit('send_message', { message: questionMessage });
    
    // Don't add message locally - let socket broadcast handle it to avoid duplicates
    
    setNewMessage('');
  };

  // NEW: Explicit Ask Question function
  const handleAskQuestion = () => {
    if (!username) {
      setRateLimitMessage('Please enter your name first!');
      setTimeout(() => setRateLimitMessage(''), 3000);
      return;
    }

    const question = prompt('Ask Mr Cock and Pepe a question:');
    if (!question || !question.trim()) return;

    // Send as question (will be picked up by conversation loop)
    socket.emit('send_message', { message: question.trim() });
    
    // Add to chat
    setMessages(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      user: username,
      message: question.trim(),
      timestamp: 'Just now',
      isYou: true
    }]);
  };

  // Video Modal Functions
  const openEpisodeModal = (episode) => {
    setSelectedEpisode(episode);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  };

  const closeEpisodeModal = () => {
    setIsModalOpen(false);
    setSelectedEpisode(null);
    document.body.style.overflow = 'auto'; // Re-enable scrolling
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeEpisodeModal();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isModalOpen]);


  return (
    <>

      {episodeStarted && (
        <div className="live-badge">
          <span className="live-dot"></span>
          LIVE NOW
        </div>
      )}

      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <div className="host-container">
            <img src="/host.png" alt="Mr. Cock - Host" className="host-image" />
            <span className="host-subtitle">The Mr Cock Show</span>
          </div>
          <div className="hero-text">
            <h1 className="hero-title">The First On-Chain Podcast</h1>
            <p className="hero-subtitle">Put your questions in the chat, and <strong>Mr. Cock</strong>, our AI meme host, will ask them. <strong>No scripts</strong>, just <strong>chaos</strong>.</p>
            <div className="hero-info">
              <p className="info-line">Every interview <strong>recorded</strong>, published to <strong>MemeTalk.TV, X (Twitter), and YouTube</strong>, and displayed here</p>
              <p className="info-line">Use <strong>live chat</strong> to ask questions — <strong>Mr Cock</strong> reads them <strong>live</strong></p>
              <p className="info-line"><strong>AI + Community + Blockchain</strong> = The future of podcasting</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-container">
        {/* Video Section */}
        <div className="video-section">
          <div className="video-wrapper">
            {/* Countdown Overlay */}
            {countdown !== null && countdown > 0 && (
              <div className="countdown-overlay">
                <video
                  className="countdown-promo-video"
                  src="/cock startcount.mp4"
                  style={{ width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  autoPlay
                  loop
                  muted
                  playsInline
                />
                <div className="countdown-badge">
                  <div className="countdown-number">{countdown}</div>
                  <div className="countdown-text">Show starting in...</div>
                </div>
              </div>
            )}
            
            {/* Waiting for admin to start */}
            {!episodeStarted && countdown === null && !episodeEnded && (
              <div className="countdown-overlay">
                <div className="countdown-text">⏳ Waiting for broadcast to start...</div>
              </div>
            )}
            
            {/* Episode Ended */}
            {episodeEnded && (
              <div className="countdown-overlay">
                <div className="countdown-text">🎬 Episode Ended!</div>
                <div className="countdown-subtitle">Thank you for watching MemeTalk Live!</div>
                <div className="countdown-subtitle" style={{marginTop: '20px'}}>Next show: Every evening at 8 PM ET</div>
              </div>
            )}

            {/* Question overlay removed per user request */}

            {/* Always show video player - shows transition video when not live */}
            <div className="character-display">
              <VideoPlayer
                hostVideos={hostVideos}
                guestVideos={guestVideos}
                transitionVideo={transitionVideo}
                currentSpeaker={currentSpeaker}
                currentEmotion={currentEmotion}
                isUnlocked={audioUnlocked}
              />
              
              {episodeStarted && countdown === null && (
                <>
                  {!audioUnlocked && (
                    <div 
                    className="audio-unlock-prompt"
                    onClick={handleUnlock}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      background: 'rgba(0, 0, 0, 0.9)',
                      color: '#00ff41',
                      padding: '30px 40px',
                      borderRadius: '15px',
                      border: '2px solid #00ff41',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      zIndex: 1000,
                      textAlign: 'center',
                      animation: 'pulse 2s infinite'
                    }}
                  >
                    🔊 TAP TO ENABLE AUDIO
                    <div style={{ fontSize: '14px', marginTop: '10px', opacity: 0.8 }}>
                      Required for mobile playback
                    </div>
                  </div>
                )}
                
                {currentQuestion && (currentSpeaker === 'Pepe' || currentSpeaker === 'Mr Cock') && (
                  <div className="talking-indicator question-indicator">
                    <span className="indicator-label">💬 @{currentQuestion.username} asked:</span>
                    <span className="indicator-question">{currentQuestion.question}</span>
                  </div>
                )}
                {currentSpeaker === 'Mr Cock' && !currentQuestion && (
                  <div className="talking-indicator">
                    <span className="indicator-text">🎩 Mr. Cock Speaking</span>
                  </div>
                )}
                {currentSpeaker === 'Pepe' && !currentQuestion && (
                  <div className="talking-indicator">
                    <span className="indicator-text">🐸 Pepe Speaking</span>
                  </div>
                )}
                </>
              )}
            </div>

            {/* Ask Question Button */}
            {episodeStarted && username && (
              <button className="ask-question-btn" onClick={handleAskQuestion}>
                Ask our Guest?
              </button>
            )}
          </div>
        </div>

        {/* Chat Section */}
        <div className="chat-section">
          {/* Username Overlay - Shows over chat */}
          {showUsernameModal && (
            <div className="chat-username-overlay" style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              borderRadius: '24px',
              pointerEvents: 'none'
            }}>
              <div className="username-overlay-content" style={{
                background: 'linear-gradient(135deg, rgba(30, 30, 40, 0.95) 0%, rgba(20, 20, 30, 0.95) 100%)',
                border: '2px solid rgba(139, 92, 246, 0.6)',
                borderRadius: '20px',
                padding: '32px',
                minWidth: '320px',
                maxWidth: '400px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(139, 92, 246, 0.2)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                pointerEvents: 'auto',
                margin: '0 auto'
              }}>
                <h2 className="username-overlay-title" style={{
                  fontSize: '28px',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: '8px',
                  textAlign: 'center'
                }}>Live Chat</h2>
                <p className="username-overlay-subtitle" style={{
                  fontSize: '15px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  marginBottom: '24px',
                  textAlign: 'center'
                }}>Choose a username to join the chat</p>
                
                <form onSubmit={handleUsernameSubmit} className="username-overlay-form" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  <input
                    type="text"
                    placeholder="Enter your username..."
                    value={tempUsername}
                    onChange={(e) => setTempUsername(e.target.value)}
                    className="username-overlay-input"
                    maxLength={20}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '2px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'all 0.3s ease'
                    }}
                  />
                  <p className="username-overlay-hint" style={{
                    fontSize: '13px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    marginTop: '-8px'
                  }}>2-20 characters</p>
                  
                  {rateLimitMessage && (
                    <div className="username-overlay-error" style={{
                      padding: '12px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      borderRadius: '8px',
                      color: '#ef4444',
                      fontSize: '14px',
                      fontWeight: '600',
                      textAlign: 'center'
                    }}>
                      {rateLimitMessage}
                    </div>
                  )}
                  
                  <button type="submit" className="username-overlay-submit" style={{
                    width: '100%',
                    padding: '14px 24px',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)'
                  }}>
                    Join Chat
                  </button>
                </form>
              </div>
            </div>
          )}
          
          <div className="chat-header">
            <h3>Live Chat</h3>
            <div className="chat-header-right">
              <span className="chat-count">{onlineCount} online</span>
            </div>
          </div>
          
          <div className="chat-messages" ref={chatMessagesRef}>
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`chat-message ${msg.isHost ? 'host-message' : ''} ${msg.isGuest ? 'guest-message' : ''} ${msg.isYou ? 'your-message' : ''} ${msg.isSystem ? 'system-message' : ''}`}
              >
                <div className="message-header">
                  <span 
                    className="message-user" 
                    style={{ color: msg.userColor || 'rgba(255, 255, 255, 0.9)' }}
                  >
                    {msg.user}
                    {msg.hasAudio && <span className="audio-indicator"> 🔊</span>}
                  </span>
                  <span className="message-time">{msg.timestamp}</span>
                </div>
                <p className="message-text">{msg.message}</p>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {rateLimitMessage && (
            <div className="rate-limit-warning">
              {rateLimitMessage}
            </div>
          )}

          <form className="chat-input-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              placeholder="Type your message or question..."
              className="chat-input"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              maxLength={200}
            />
            {newMessage.length > 0 && (
              <div className={`char-counter ${newMessage.length > 180 ? 'warning' : ''} ${newMessage.length >= 200 ? 'error' : ''}`}>
                {newMessage.length}/200
              </div>
            )}
            <div className="chat-buttons">
              <button 
                type="button" 
                className="ask-guest-btn"
                onClick={handleAskPepe}
                title="Send question to Pepe"
              >
                🐸 Ask Guest
              </button>
              <button 
                type="button" 
                className="ask-host-btn"
                onClick={handleAskCock}
                title="Send question to Mr. Cock"
              >
                🐓 Ask Host
              </button>
              <button 
                type="button" 
                className="help-btn"
                onMouseEnter={() => setShowHelpTooltip(true)}
                onMouseLeave={() => setShowHelpTooltip(false)}
                onClick={() => setShowHelpTooltip(!showHelpTooltip)}
                title="Help"
              >
                ?
              </button>
              {showHelpTooltip && (
                <div className="help-tooltip">
                  <strong>💡 How to use chat:</strong>
                  <p>• <strong>Regular chat:</strong> Type and press Enter</p>
                  <p>• <strong>Ask Guest:</strong> Type your question, click "Ask Guest"</p>
                  <p>• <strong>Ask Host:</strong> Type your question, click "Ask Host"</p>
                  <p>• Questions will be answered live on the show!</p>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Episodes Grid */}
      <section className="episodes-section" id="episodes">
        <div className="section-header">
          <h2 className="section-title">All Episodes</h2>
          <p className="section-subtitle">Where memes interview crypto memes</p>
        </div>
        
        <div className="episodes-grid">
          {episodes.length > 0 ? episodes.map((episode, index) => (
            <div 
              key={`${episode.number}-${index}-${episode.date || ''}`}
              className="episode-card"
              onClick={() => openEpisodeModal(episode)}
            >
              <div className="episode-thumbnail">
                <video 
                  className="episode-preview"
                  src={episode.videoUrl || `/episodes/${episode.videoFile}`}
                  muted
                  preload="metadata"
                />
                <div className="play-overlay">
                  <div className="play-icon">▶</div>
                </div>
                <span className="episode-number-badge">EP {episode.number}</span>
              </div>
              
              <div className="episode-info">
                <h3 className="episode-card-title">{episode.title}</h3>
                <p className="episode-card-guests">{episode.guest || 'Guest'}</p>
                <p className="episode-card-desc">{episode.description}</p>
                <div className="episode-meta">
                  <span>{episode.views || 0} views</span>
                  <span>•</span>
                  <span>{episode.date}</span>
                </div>
              </div>
            </div>
          )) : (
            <div className="no-episodes">
              <p>📼 No episodes yet. Check back after the first live show!</p>
            </div>
          )}
        </div>
      </section>

      {/* Video Player Modal */}
      {isModalOpen && selectedEpisode && (
        <div className="video-modal-overlay" onClick={closeEpisodeModal}>
          <div className="video-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="video-modal-close" onClick={closeEpisodeModal}></div>
            
            <div className="video-modal-player-wrapper">
              <video
                className="video-modal-player"
                src={selectedEpisode.videoUrl || `/episodes/${selectedEpisode.videoFile}`}
                controls
                autoPlay
                controlsList="nodownload"
              />
            </div>
            
            <div className="video-modal-info">
              <div className="video-modal-meta">
                <span className="video-modal-ep-badge">EPISODE {selectedEpisode.number}</span>
                <span>{selectedEpisode.views || 0} views</span>
                <span>•</span>
                <span>{selectedEpisode.date}</span>
              </div>
              <h2 className="video-modal-title">{selectedEpisode.title}</h2>
              <p className="video-modal-guest">{selectedEpisode.guest || 'Guest'}</p>
              <p className="video-modal-desc">{selectedEpisode.description}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Home

