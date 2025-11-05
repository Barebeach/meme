import express from 'express';

const router = express.Router();
const R2_BASE_URL = 'https://pub-2210718f3f20481b84992800d4ae8bd1.r2.dev';

/**
 * Get host (Mr. Cock) videos
 */
router.get('/hosts/:id', (req, res) => {
  const videos = {
    angry: { 
      webm: `${R2_BASE_URL}/angrily%20coock.webm`, 
      mp4: `${R2_BASE_URL}/angrily%20coock.mp4`,
      gif: `${R2_BASE_URL}/angrily%20coock.gif`
    },
    laughing: { 
      webm: `${R2_BASE_URL}/laughing%20coock.webm`, 
      mp4: `${R2_BASE_URL}/laughing%20coock.mp4`,
      gif: `${R2_BASE_URL}/laughing%20coock.gif`
    },
    sad: { 
      webm: `${R2_BASE_URL}/sad%20coock.webm`, 
      mp4: `${R2_BASE_URL}/sad%20coock.mp4`,
      gif: `${R2_BASE_URL}/sad%20coock.gif`
    },
    thinking: { 
      webm: `${R2_BASE_URL}/sarcastically%20coock.webm`, 
      mp4: `${R2_BASE_URL}/sarcastically%20coock.mp4`,
      gif: `${R2_BASE_URL}/sarcastically%20coock.gif`
    },
    normal: { 
      webm: `${R2_BASE_URL}/serious%20cooock.webm`, 
      mp4: `${R2_BASE_URL}/serious%20cooock.mp4`,
      gif: `${R2_BASE_URL}/serious%20cooock.gif`
    }
  };
  
  res.json(videos);
});

/**
 * Get guest (Pepe) videos
 */
router.get('/guests/:id', (req, res) => {
  const videos = {
    angry: { 
      webm: `${R2_BASE_URL}/angrily%20pepe.webm`, 
      mp4: `${R2_BASE_URL}/angrily%20pepe.mp4`,
      gif: `${R2_BASE_URL}/angrily%20pepe.gif`
    },
    happy: { 
      webm: `${R2_BASE_URL}/happily%20pepe.webm`, 
      mp4: `${R2_BASE_URL}/happily%20pepe.mp4`,
      gif: `${R2_BASE_URL}/happily%20pepe.gif`
    },
    sad: { 
      webm: `${R2_BASE_URL}/sad%20%20pepe.webm`, 
      mp4: `${R2_BASE_URL}/sad%20%20pepe.mp4`,
      gif: `${R2_BASE_URL}/sad%20%20pepe.gif`
    },
    screaming: { 
      webm: `${R2_BASE_URL}/crazy%20pepe.webm`, 
      mp4: `${R2_BASE_URL}/crazy%20pepe.mp4`,
      gif: `${R2_BASE_URL}/crazy%20pepe.gif`
    },
    thinking: { 
      webm: `${R2_BASE_URL}/sarcastically%20%20pepe.webm`, 
      mp4: `${R2_BASE_URL}/sarcastically%20%20pepe.mp4`,
      gif: `${R2_BASE_URL}/sarcastically%20%20pepe.gif`
    },
    normal: { 
      webm: `${R2_BASE_URL}/serious%20pepe.webm`, 
      mp4: `${R2_BASE_URL}/serious%20pepe.mp4`,
      gif: `${R2_BASE_URL}/serious%20pepe.gif`
    }
  };
  
  res.json(videos);
});

/**
 * Get transition video (bothshutup)
 */
router.get('/transition', (req, res) => {
  res.json({ 
    webm: `${R2_BASE_URL}/bothshutup.webm`,
    mp4: `${R2_BASE_URL}/bothshutup.mp4`,
    gif: `${R2_BASE_URL}/bothshutup.gif`
  });
});

export default router;

