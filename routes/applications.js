import express from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Application storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'public', 'uploads', 'memes');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `meme-${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /png|jpg|jpeg/;
    const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    cb(isValid ? null : new Error('Only PNG/JPG images allowed'), isValid);
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * Generate schedule for next 20 days (1 spot per day at 4 PM EST)
 */
function generateSchedule() {
  const schedule = [];
  const now = new Date();
  
  for (let i = 0; i < 20; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + i);
    date.setHours(16, 0, 0, 0); // 4 PM EST (16:00)
    
    schedule.push({
      id: `slot-${date.getTime()}`,
      date: date.toISOString(),
      displayDate: date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      displayTime: '4:00 PM EST',
      isBooked: false,
      bookedBy: null,
      applicationId: null
    });
  }
  
  return schedule;
}

/**
 * Get all applications
 */
router.get('/applications', (req, res) => {
  try {
    const applicationsFile = path.join(__dirname, '..', 'applications.json');
    
    if (fs.existsSync(applicationsFile)) {
      const applications = JSON.parse(fs.readFileSync(applicationsFile, 'utf8'));
      res.json(applications);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error loading applications:', error);
    res.status(500).json({ error: 'Failed to load applications' });
  }
});

/**
 * Submit application
 */
router.post('/applications/submit', upload.single('memeImage'), async (req, res) => {
  try {
    const { 
      memeName, 
      prompt, 
      voiceType, 
      additionalInfo, 
      walletAddress, 
      txSignature,
      scheduleSlotId 
    } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Meme image is required' });
    }
    
    if (!memeName || !prompt || !voiceType || !walletAddress || !txSignature || !scheduleSlotId) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Load existing applications
    const applicationsFile = path.join(__dirname, '..', 'applications.json');
    let applications = [];
    
    if (fs.existsSync(applicationsFile)) {
      applications = JSON.parse(fs.readFileSync(applicationsFile, 'utf8'));
    }
    
    // Generate unique stream link IMMEDIATELY
    const date = new Date(parseInt(scheduleSlotId.replace('slot-', '')));
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const streamToken = `${dateStr}-${Math.random().toString(36).substr(2, 8)}`;
    const streamLink = `/stream/${streamToken}`;
    
    // Create new application with stream link
    const newApplication = {
      id: `app-${Date.now()}`,
      memeName,
      prompt,
      voiceType,
      additionalInfo: additionalInfo || '',
      memeImage: `/uploads/memes/${req.file.filename}`,
      walletAddress,
      txSignature,
      scheduleSlotId,
      status: 'approved', // Auto-approved - admin can reject later if needed
      submittedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      streamLink,
      streamToken,
      scheduledDate: date.toISOString(),
      scheduledTime: date.toLocaleString('en-US', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        timeZone: 'America/New_York'
      }) + ' EST'
    };
    
    applications.unshift(newApplication);
    
    // Save applications
    fs.writeFileSync(applicationsFile, JSON.stringify(applications, null, 2));
    
    // Update schedule to mark slot as booked
    const scheduleFile = path.join(__dirname, '..', 'schedule.json');
    let schedule = [];
    
    if (fs.existsSync(scheduleFile)) {
      schedule = JSON.parse(fs.readFileSync(scheduleFile, 'utf8'));
    } else {
      schedule = generateSchedule();
    }
    
    // Find and book the slot
    const slotIndex = schedule.findIndex(slot => slot.id === scheduleSlotId);
    let slotDetails = null;
    if (slotIndex !== -1) {
      schedule[slotIndex].isBooked = true;
      schedule[slotIndex].bookedBy = walletAddress;
      schedule[slotIndex].applicationId = newApplication.id;
      slotDetails = schedule[slotIndex];
    }
    
    fs.writeFileSync(scheduleFile, JSON.stringify(schedule, null, 2));
    
    console.log(`✅ New application submitted: ${memeName} by ${walletAddress}`);
    console.log(`🔗 Stream link: ${streamLink}`);
    console.log(`📅 Scheduled: ${newApplication.scheduledTime}`);
    
    res.json({ 
      success: true, 
      message: 'Slot booked successfully! Your interview is confirmed.',
      applicationId: newApplication.id,
      streamLink: streamLink,
      fullStreamUrl: `${process.env.PUBLIC_URL || 'http://localhost:5173'}${streamLink}`,
      scheduledTime: newApplication.scheduledTime,
      scheduledDate: slotDetails?.displayDate || dateStr,
      memeName: memeName
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ error: 'Failed to submit application', details: error.message });
  }
});

/**
 * Get schedule
 */
router.get('/schedule', (req, res) => {
  try {
    const scheduleFile = path.join(__dirname, '..', 'schedule.json');
    let schedule = [];
    
    if (fs.existsSync(scheduleFile)) {
      schedule = JSON.parse(fs.readFileSync(scheduleFile, 'utf8'));
    } else {
      schedule = generateSchedule();
      fs.writeFileSync(scheduleFile, JSON.stringify(schedule, null, 2));
    }
    
    res.json(schedule);
  } catch (error) {
    console.error('Error loading schedule:', error);
    res.status(500).json({ error: 'Failed to load schedule' });
  }
});

/**
 * Approve application
 */
router.post('/applications/:id/approve', (req, res) => {
  try {
    const { id } = req.params;
    const applicationsFile = path.join(__dirname, '..', 'applications.json');
    
    if (!fs.existsSync(applicationsFile)) {
      return res.status(404).json({ error: 'Applications not found' });
    }
    
    const applications = JSON.parse(fs.readFileSync(applicationsFile, 'utf8'));
    const appIndex = applications.findIndex(app => app.id === id);
    
    if (appIndex === -1) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // Generate unique stream link
    const scheduleSlotId = applications[appIndex].scheduleSlotId;
    const date = new Date(parseInt(scheduleSlotId.replace('slot-', '')));
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const streamToken = `${dateStr}-${Math.random().toString(36).substr(2, 8)}`;
    const streamLink = `/stream/${streamToken}`;
    
    applications[appIndex].status = 'approved';
    applications[appIndex].approvedAt = new Date().toISOString();
    applications[appIndex].streamLink = streamLink;
    applications[appIndex].streamToken = streamToken;
    
    fs.writeFileSync(applicationsFile, JSON.stringify(applications, null, 2));
    
    console.log(`✅ Application approved: ${applications[appIndex].memeName}`);
    console.log(`🔗 Stream link: ${streamLink}`);
    
    res.json({ 
      success: true, 
      message: 'Application approved!',
      streamLink,
      application: applications[appIndex]
    });
  } catch (error) {
    console.error('Error approving application:', error);
    res.status(500).json({ error: 'Failed to approve application' });
  }
});

/**
 * Reject application
 */
router.post('/applications/:id/reject', (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const applicationsFile = path.join(__dirname, '..', 'applications.json');
    
    if (!fs.existsSync(applicationsFile)) {
      return res.status(404).json({ error: 'Applications not found' });
    }
    
    const applications = JSON.parse(fs.readFileSync(applicationsFile, 'utf8'));
    const appIndex = applications.findIndex(app => app.id === id);
    
    if (appIndex === -1) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    applications[appIndex].status = 'rejected';
    applications[appIndex].rejectedAt = new Date().toISOString();
    applications[appIndex].rejectionReason = reason || 'Not specified';
    
    // Unbook the schedule slot
    const scheduleFile = path.join(__dirname, '..', 'schedule.json');
    if (fs.existsSync(scheduleFile)) {
      let schedule = JSON.parse(fs.readFileSync(scheduleFile, 'utf8'));
      const slotIndex = schedule.findIndex(slot => slot.applicationId === id);
      if (slotIndex !== -1) {
        schedule[slotIndex].isBooked = false;
        schedule[slotIndex].bookedBy = null;
        schedule[slotIndex].applicationId = null;
        fs.writeFileSync(scheduleFile, JSON.stringify(schedule, null, 2));
      }
    }
    
    fs.writeFileSync(applicationsFile, JSON.stringify(applications, null, 2));
    
    console.log(`❌ Application rejected: ${applications[appIndex].memeName}`);
    
    res.json({ 
      success: true, 
      message: 'Application rejected',
      application: applications[appIndex]
    });
  } catch (error) {
    console.error('Error rejecting application:', error);
    res.status(500).json({ error: 'Failed to reject application' });
  }
});

/**
 * Get single application by ID
 */
router.get('/applications/:id', (req, res) => {
  try {
    const { id } = req.params;
    const applicationsFile = path.join(__dirname, '..', 'applications.json');
    
    if (!fs.existsSync(applicationsFile)) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    const applications = JSON.parse(fs.readFileSync(applicationsFile, 'utf8'));
    const application = applications.find(app => app.id === id);
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json(application);
  } catch (error) {
    console.error('Error loading application:', error);
    res.status(500).json({ error: 'Failed to load application' });
  }
});

export default router;


