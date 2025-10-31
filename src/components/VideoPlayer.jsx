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
  const videoRef = useRef(null);
  const imgRef = useRef(null);
  const [currentSrc, setCurrentSrc] = useState('');
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  useEffect(() => {
    let newSrc = '';
    
    if (!currentSpeaker && transitionVideo) {
      newSrc = isMobile ? transitionVideo.gif : (transitionVideo.webm || transitionVideo.mp4);
    } else if (currentSpeaker === 'Mr Cock' && hostVideos && hostVideos[currentEmotion]) {
      const urls = hostVideos[currentEmotion];
      newSrc = isMobile ? urls.gif : (urls.webm || urls.mp4);
    } else if (currentSpeaker === 'Pepe' && guestVideos && guestVideos[currentEmotion]) {
      const urls = guestVideos[currentEmotion];
      newSrc = isMobile ? urls.gif : (urls.webm || urls.mp4);
    }

    if (newSrc && newSrc !== currentSrc) {
      setCurrentSrc(newSrc);
    }
  }, [currentSpeaker, currentEmotion, hostVideos, guestVideos, transitionVideo, isMobile, currentSrc]);

  useEffect(() => {
    if (!currentSrc || !isUnlocked) return;

    if (isMobile) {
      // Mobile: GIFs load automatically, no play() needed
      if (imgRef.current) {
        imgRef.current.src = currentSrc;
      }
    } else {
      // Desktop: Videos need play() call
      const video = videoRef.current;
      if (!video) return;

      if (video.src !== currentSrc) {
        video.src = currentSrc;
        video.load();
        
        const attemptPlay = () => {
          video.play().catch(err => {
            console.log('Play blocked, retrying...', err.message);
            setTimeout(attemptPlay, 100);
          });
        };
        attemptPlay();
      }
    }
  }, [currentSrc, isUnlocked, isMobile]);

  if (!currentSrc) return null;

  if (isMobile) {
    return (
      <img
        ref={imgRef}
        src={currentSrc}
        alt="Character animation"
        className="video-element"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
      />
    );
  }

  return (
    <video
      ref={videoRef}
      className="video-element"
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain'
      }}
    />
  );
};

export const unlockAllVideos = async () => {
  const dummyAudio = new Audio();
  dummyAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
  try {
    await dummyAudio.play();
    dummyAudio.pause();
  } catch (err) {
    console.log('Audio unlock failed');
  }
  
  return true;
};

