import { useEffect, useRef, useState } from 'react';
import './VideoPlayer.css';

export const VideoPlayer = ({ 
  hostVideos, 
  guestVideos, 
  transitionVideo,
  currentSpeaker, 
  currentEmotion,
  isUnlocked 
}) => {
  // Use two video refs for smooth crossfading
  const videoRef1 = useRef(null);
  const videoRef2 = useRef(null);
  const mobileVideoRef = useRef(null);
  const [currentSrc, setCurrentSrc] = useState('');
  const [activeVideo, setActiveVideo] = useState(1); // 1 or 2
  const [videoKey, setVideoKey] = useState(0); // Force remount on mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  useEffect(() => {
    let newSrc = '';
    
    if (!currentSpeaker && transitionVideo) {
      // Mobile: Use MP4 (smaller & more compatible than GIF!)
      // Desktop: Use WebM for best quality
      newSrc = isMobile ? transitionVideo.mp4 : (transitionVideo.webm || transitionVideo.mp4);
    } else if (currentSpeaker === 'Mr Cock' && hostVideos) {
      // Try requested emotion, fallback to normal
      const urls = hostVideos[currentEmotion] || hostVideos['normal'];
      if (urls) {
        // Mobile: Use MP4 (smaller & more compatible than GIF!)
        // Desktop: Use WebM for best quality
        newSrc = isMobile ? urls.mp4 : (urls.webm || urls.mp4);
      }
      if (!hostVideos[currentEmotion] && currentEmotion !== 'normal') {
        console.warn(`⚠️ Missing Mr Cock emotion: ${currentEmotion}, using normal`);
      }
    } else if (currentSpeaker === 'Pepe' && guestVideos) {
      // Try requested emotion, fallback to normal
      const urls = guestVideos[currentEmotion] || guestVideos['normal'];
      if (urls) {
        // Mobile: Use MP4 (smaller & more compatible than GIF!)
        // Desktop: Use WebM for best quality
        newSrc = isMobile ? urls.mp4 : (urls.webm || urls.mp4);
      }
      if (!guestVideos[currentEmotion] && currentEmotion !== 'normal') {
        console.warn(`⚠️ Missing Pepe emotion: ${currentEmotion}, using normal`);
      }
    }

    if (newSrc && newSrc !== currentSrc) {
      console.log(`📱 Video source changing to: ${newSrc}`);
      setCurrentSrc(newSrc);
      // Force mobile video to remount by changing key
      if (isMobile) {
        setVideoKey(prev => prev + 1);
      }
    }
  }, [currentSpeaker, currentEmotion, hostVideos, guestVideos, transitionVideo, isMobile, currentSrc]);

  useEffect(() => {
    if (!currentSrc) return;

    if (isMobile) {
      // Mobile: Simple video element with autoplay
      // Video will remount due to key change, causing autoplay
      if (mobileVideoRef.current) {
        console.log(`📱 Mobile: Playing video: ${currentSrc}`);
        // Force play after a tiny delay to ensure video is ready
        setTimeout(() => {
          mobileVideoRef.current?.play().catch(err => {
            console.log('📱 Mobile autoplay (will work due to muted attribute):', err.message);
          });
        }, 50);
      }
    } else {
      // Desktop needs audio unlocked before playing videos
      if (!isUnlocked) return;
      // Desktop: Smooth crossfade between two video elements
      const currentVideo = activeVideo === 1 ? videoRef1.current : videoRef2.current;
      const nextVideo = activeVideo === 1 ? videoRef2.current : videoRef1.current;
      
      if (!currentVideo || !nextVideo) return;

      // Check if we need to change the video
      const needsChange = currentVideo.src !== currentSrc && !currentVideo.src.endsWith(currentSrc);
      
      if (needsChange) {
        // Preload the next video
        nextVideo.src = currentSrc;
        nextVideo.style.opacity = '0';
        nextVideo.style.zIndex = '1';
        
        // Handle load errors
        nextVideo.onerror = () => {
          console.error(`❌ Video failed to load: ${currentSrc}`);
        };
        
        // Wait for next video to be ready
        const onCanPlay = () => {
          // Start playing the new video
          nextVideo.play().catch(err => {
            if (err.name !== 'AbortError') {
              console.log(`Play delayed, will retry automatically`);
            }
          });
          
          // Crossfade transition
          nextVideo.style.transition = 'opacity 0.4s ease-in-out';
          nextVideo.style.opacity = '1';
          nextVideo.style.zIndex = '2';
          
          // Fade out old video
          currentVideo.style.transition = 'opacity 0.4s ease-in-out';
          currentVideo.style.opacity = '0';
          currentVideo.style.zIndex = '1';
          
          // After transition, pause the old video and switch active
          setTimeout(() => {
            currentVideo.pause();
            setActiveVideo(activeVideo === 1 ? 2 : 1);
          }, 400);
        };
        
        nextVideo.addEventListener('canplay', onCanPlay, { once: true });
        nextVideo.load();
        
        // Cleanup
        return () => {
          nextVideo.removeEventListener('canplay', onCanPlay);
        };
      }
    }
  }, [currentSrc, isUnlocked, isMobile, activeVideo, currentSpeaker, currentEmotion]);

  if (!currentSrc) return null;

  if (isMobile) {
    return (
      <video
        key={videoKey}
        ref={mobileVideoRef}
        src={currentSrc}
        className="video-element"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        style={{
          width: '100%',
          height: 'auto',
          objectFit: 'contain'
        }}
      />
    );
  }

  return (
    <>
      <video
        ref={videoRef1}
        className="video-element video-crossfade"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        style={{
          opacity: activeVideo === 1 ? 1 : 0,
          zIndex: activeVideo === 1 ? 2 : 1
        }}
      />
      <video
        ref={videoRef2}
        className="video-element video-crossfade"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        style={{
          opacity: activeVideo === 2 ? 1 : 0,
          zIndex: activeVideo === 2 ? 2 : 1
        }}
      />
    </>
  );
};

export const unlockAllVideos = async () => {
  console.log('🔓 Attempting to unlock audio context...');
  
  // Create a silent audio to unlock audio context on mobile
  const dummyAudio = new Audio();
  dummyAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
  dummyAudio.volume = 0.01; // Very low volume
  
  try {
    // Try to play the dummy audio
    await dummyAudio.play();
    console.log('✅ Audio context unlocked successfully!');
    
    // Pause and cleanup
    setTimeout(() => {
      dummyAudio.pause();
      dummyAudio.src = '';
    }, 100);
    
    return true;
  } catch (err) {
    console.error('❌ Audio unlock failed:', err.message);
    // Even if it fails, return true so the UI can proceed
    // (some browsers might still allow audio after user interaction)
    return true;
  }
};

