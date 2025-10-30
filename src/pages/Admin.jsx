import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'

const ADMIN_PASSWORD = 'memetalk2025'; // Change this to something secure
const API_URL = window.location.origin; // Works in both dev and production

function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [socket, setSocket] = useState(null);
  const [broadcastState, setBroadcastState] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [activeTab, setActiveTab] = useState('broadcast'); // broadcast, videos, schedule, episodes

  // Video upload states
  const [uploadType, setUploadType] = useState('hosts'); // hosts or guests
  const [characterId, setCharacterId] = useState('');
  const [emotion, setEmotion] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState('');

  // Schedule form
  const [scheduleForm, setScheduleForm] = useState({
    guestName: '',
    guestId: '',
    scheduledTime: '',
    duration: 15
  });

  useEffect(() => {
    if (isAuthenticated) {
      const newSocket = io(API_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10,
        timeout: 20000,
        path: '/socket.io/'
      });
      
      newSocket.on('connect', () => {
        console.log('✅ Admin Socket.IO Connected:', newSocket.id);
      });
      
      newSocket.on('connect_error', (error) => {
        console.error('❌ Admin Socket.IO Error:', error.message);
      });
      
      setSocket(newSocket);

      // Load initial data
      loadBroadcastState();
      loadSchedule();
      loadEpisodes();

      return () => newSocket.close();
    }
  }, [isAuthenticated]);

  const loadBroadcastState = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/broadcast-state`);
      const data = await res.json();
      setBroadcastState(data);
    } catch (error) {
      console.error('Failed to load broadcast state:', error);
    }
  };

  const loadSchedule = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/schedule`);
      const data = await res.json();
      setSchedule(data);
    } catch (error) {
      console.error('Failed to load schedule:', error);
    }
  };

  const loadEpisodes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/episodes`);
      const data = await res.json();
      setEpisodes(data);
    } catch (error) {
      console.error('Failed to load episodes:', error);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPassword('');
    } else {
      alert('Invalid password');
    }
  };

  const handleStartWebsite = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/start-website`, {
        method: 'POST'
      });
      if (response.ok) {
        alert('Website started! Countdown beginning...');
        loadBroadcastState();
      }
    } catch (error) {
      console.error('Failed to start website:', error);
      alert('Failed to start website');
    }
  };


  const handleVideoUpload = async (e) => {
    e.preventDefault();
    
    if (!videoFile || !characterId || !emotion) {
      alert('Please fill all fields and select a video file');
      return;
    }

    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('type', uploadType);
    formData.append('characterId', characterId);
    formData.append('emotion', emotion);

    try {
      setUploadProgress('Uploading...');
      const response = await fetch(`${API_URL}/api/admin/upload-video`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setUploadProgress('Upload successful!');
        setVideoFile(null);
        setCharacterId('');
        setEmotion('');
        setTimeout(() => setUploadProgress(''), 3000);
      } else {
        setUploadProgress('Upload failed!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress('Upload failed!');
    }
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_URL}/api/admin/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleForm)
      });

      if (response.ok) {
        alert('Schedule added!');
        setScheduleForm({ guestName: '', guestId: '', scheduledTime: '', duration: 15 });
        loadSchedule();
      }
    } catch (error) {
      console.error('Failed to add schedule:', error);
      alert('Failed to add schedule');
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!confirm('Delete this schedule entry?')) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/schedule/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Schedule deleted!');
        loadSchedule();
      }
    } catch (error) {
      console.error('Failed to delete schedule:', error);
    }
  };

  const handleDeleteEpisode = async (id) => {
    if (!confirm('Delete this episode?')) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/episodes/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Episode deleted!');
        loadEpisodes();
      }
    } catch (error) {
      console.error('Failed to delete episode:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <div className="login-box">
          <h1>🔐 Admin Login</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="admin-input"
            />
            <button type="submit" className="admin-btn">Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>🎛️ MemeTalk.TV Admin Panel</h1>
        <button onClick={() => setIsAuthenticated(false)} className="admin-btn logout-btn">
          Logout
        </button>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'broadcast' ? 'active' : ''}`}
          onClick={() => setActiveTab('broadcast')}
        >
          📡 Broadcast Control
        </button>
        <button 
          className={`tab-btn ${activeTab === 'videos' ? 'active' : ''}`}
          onClick={() => setActiveTab('videos')}
        >
          🎬 Video Management
        </button>
        <button 
          className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          📅 Schedule
        </button>
        <button 
          className={`tab-btn ${activeTab === 'episodes' ? 'active' : ''}`}
          onClick={() => setActiveTab('episodes')}
        >
          🎥 Episodes Archive
        </button>
      </div>

      <div className="admin-content">
        {/* Broadcast Control */}
        {activeTab === 'broadcast' && (
          <div className="admin-section">
            <h2>Broadcast Control</h2>
            {broadcastState && (
              <div className="broadcast-status">
                <p><strong>Status:</strong> {broadcastState.isLive ? '🔴 LIVE' : '⚫ Offline'}</p>
                <p><strong>Episode Started:</strong> {broadcastState.episodeStarted ? 'Yes' : 'No'}</p>
                <p><strong>Countdown:</strong> {broadcastState.countdown !== null ? broadcastState.countdown : 'N/A'}</p>
                {broadcastState.startTime && (
                  <p><strong>Started At:</strong> {new Date(broadcastState.startTime).toLocaleString()}</p>
                )}
              </div>
            )}
            <div className="broadcast-controls">
              <button onClick={handleStartWebsite} className="admin-btn start-btn">
                🚀 Start Website (1.5 min countdown)
              </button>
            </div>
            <div className="info-box">
              <p><strong>ℹ️ Note:</strong> Starting the website will begin a 1 minute 30 second countdown, then automatically start the first scheduled episode.</p>
            </div>
          </div>
        )}

        {/* Video Management */}
        {activeTab === 'videos' && (
          <div className="admin-section">
            <h2>Upload Character Videos</h2>
            <form onSubmit={handleVideoUpload} className="upload-form">
              <div className="form-group">
                <label>Character Type:</label>
                <select value={uploadType} onChange={(e) => setUploadType(e.target.value)} className="admin-select">
                  <option value="hosts">Host (Mr Cock)</option>
                  <option value="guests">Guest</option>
                </select>
              </div>

              <div className="form-group">
                <label>Character ID:</label>
                <input
                  type="text"
                  placeholder={uploadType === 'hosts' ? 'mrcock' : 'pepe, troll, etc.'}
                  value={characterId}
                  onChange={(e) => setCharacterId(e.target.value)}
                  className="admin-input"
                />
              </div>

              <div className="form-group">
                <label>Emotion:</label>
                <select value={emotion} onChange={(e) => setEmotion(e.target.value)} className="admin-select">
                  <option value="">Select emotion...</option>
                  <option value="normal">😐 Normal</option>
                  <option value="happy">😊 Happy</option>
                  <option value="sad">😢 Sad</option>
                  <option value="angry">😠 Angry</option>
                  <option value="laughing">😂 Laughing</option>
                  <option value="screaming">😱 Screaming</option>
                  <option value="shocked">😲 Shocked</option>
                  <option value="thinking">🤔 Thinking</option>
                </select>
              </div>

              <div className="form-group">
                <label>Video File:</label>
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  onChange={(e) => setVideoFile(e.target.files[0])}
                  className="admin-file-input"
                />
              </div>

              <button type="submit" className="admin-btn">Upload Video</button>
              {uploadProgress && <p className="upload-status">{uploadProgress}</p>}
            </form>

            <div className="info-box">
              <p><strong>📝 Instructions:</strong></p>
              <ul>
                <li>For hosts, use ID: "mrcock"</li>
                <li>For guests, use their character ID (e.g., "pepe", "troll")</li>
                <li>Upload all emotion states for each character</li>
                <li>Videos should be MP4 or WebM format</li>
              </ul>
            </div>
          </div>
        )}

        {/* Schedule */}
        {activeTab === 'schedule' && (
          <div className="admin-section">
            <h2>Episode Schedule</h2>
            
            <form onSubmit={handleAddSchedule} className="schedule-form">
              <div className="form-group">
                <label>Guest Name:</label>
                <input
                  type="text"
                  placeholder="Pepe the Frog"
                  value={scheduleForm.guestName}
                  onChange={(e) => setScheduleForm({...scheduleForm, guestName: e.target.value})}
                  className="admin-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Guest ID:</label>
                <input
                  type="text"
                  placeholder="pepe"
                  value={scheduleForm.guestId}
                  onChange={(e) => setScheduleForm({...scheduleForm, guestId: e.target.value})}
                  className="admin-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Scheduled Time:</label>
                <input
                  type="datetime-local"
                  value={scheduleForm.scheduledTime}
                  onChange={(e) => setScheduleForm({...scheduleForm, scheduledTime: e.target.value})}
                  className="admin-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Duration (minutes):</label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={scheduleForm.duration}
                  onChange={(e) => setScheduleForm({...scheduleForm, duration: parseInt(e.target.value)})}
                  className="admin-input"
                  required
                />
              </div>

              <button type="submit" className="admin-btn">Add to Schedule</button>
            </form>

            <div className="schedule-list">
              <h3>Upcoming Episodes</h3>
              {schedule.length === 0 ? (
                <p className="empty-message">No scheduled episodes</p>
              ) : (
                <div className="schedule-items">
                  {schedule.map(item => (
                    <div key={item.id} className="schedule-item">
                      <div className="schedule-info">
                        <h4>{item.guestName} ({item.guestId})</h4>
                        <p>📅 {new Date(item.scheduledTime).toLocaleString()}</p>
                        <p>⏱️ Duration: {item.duration} minutes</p>
                      </div>
                      <button onClick={() => handleDeleteSchedule(item.id)} className="admin-btn delete-btn">
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Episodes Archive */}
        {activeTab === 'episodes' && (
          <div className="admin-section">
            <h2>Recorded Episodes</h2>
            
            {episodes.length === 0 ? (
              <p className="empty-message">No recorded episodes yet</p>
            ) : (
              <div className="episodes-list">
                {episodes.map(ep => (
                  <div key={ep.id} className="episode-item">
                    <div className="episode-info">
                      <h4>{ep.title || `Episode ${ep.id}`}</h4>
                      <p>🎭 Guest: {ep.guestName}</p>
                      <p>📅 {new Date(ep.createdAt).toLocaleString()}</p>
                      <p>⏱️ Duration: {ep.duration || 'N/A'}</p>
                      {ep.videoUrl && (
                        <a href={ep.videoUrl} target="_blank" rel="noopener noreferrer" className="view-link">
                          Watch Recording
                        </a>
                      )}
                    </div>
                    <button onClick={() => handleDeleteEpisode(ep.id)} className="admin-btn delete-btn">
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;

