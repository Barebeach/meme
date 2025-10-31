import { useEffect, useRef } from 'react';

export const VideoPlayer = ({ 
  hostVideos, 
  guestVideos, 
  transitionVideo,
  currentSpeaker, 
  currentEmotion,
  isUnlocked 
}) => {
  const containerRef = useRef(null);
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  useEffect(() => {
    if (!containerRef.current || !isUnlocked) return;

    const videos = containerRef.current.querySelectorAll('video');
    
    videos.forEach(video => {
      const isActive = video.classList.contains('active');
      
      if (isActive && video.paused) {
        video.play().catch(err => {
          console.log('Video play attempt:', err.message);
          setTimeout(() => video.play().catch(() => {}), 100);
        });
      } else if (!isActive && !video.paused) {
        video.pause();
      }
    });
  }, [currentSpeaker, currentEmotion, isUnlocked]);

  const getVideoUrl = (urls) => {
    if (!urls) return '';
    return isMobile ? urls.mp4 : (urls.webm || urls.mp4);
  };

  const renderVideo = (id, url, isActive) => {
    if (!url) return null;
    
    return (
      <video
        key={id}
        className={`video-element ${isActive ? 'active' : ''}`}
        src={url}
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
          display: isActive ? 'block' : 'none'
        }}
      />
    );
  };

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%'
      }}
    >
      {!currentSpeaker && renderVideo(
        'transition',
        getVideoUrl(transitionVideo),
        true
      )}
      
      {currentSpeaker === 'Mr Cock' && hostVideos && Object.entries(hostVideos).map(([emotion, urls]) =>
        renderVideo(
          `host-${emotion}`,
          getVideoUrl(urls),
          emotion === currentEmotion
        )
      )}
      
      {currentSpeaker === 'Pepe' && guestVideos && Object.entries(guestVideos).map(([emotion, urls]) =>
        renderVideo(
          `guest-${emotion}`,
          getVideoUrl(urls),
          emotion === currentEmotion
        )
      )}
    </div>
  );
};

export const unlockAllVideos = async () => {
  const allVideos = document.querySelectorAll('video.video-element');
  
  for (const video of allVideos) {
    try {
      video.muted = true;
      await video.play();
      video.pause();
    } catch (err) {
      // Silent fail OK
    }
  }

  const dummyAudio = new Audio();
  dummyAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
  try {
    await dummyAudio.play();
    dummyAudio.pause();
  } catch (err) {
    // Silent fail OK
  }
  
  return true;
};

