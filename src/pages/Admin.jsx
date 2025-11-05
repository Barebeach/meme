import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'

const ADMIN_PASSWORD = 'memetalk2025';
const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin;

function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [socket, setSocket] = useState(null);
  const [broadcastState, setBroadcastState] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [applications, setApplications] = useState([]);
  const [tokenAddress, setTokenAddress] = useState('D6AQDyi8AVX7oHTdiY1MfQRfYmzjYHkfENUxx1uQpump');
  const [activeTab, setActiveTab] = useState('broadcast'); // broadcast, videos, schedule, episodes, applications, settings

  // Video upload states
  const [uploadType, setUploadType] = useState('hosts'); // hosts or guests
  const [characterId, setCharacterId] = useState('');
  const [emotion, setEmotion] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState('');
  
  // Podcast duration (in minutes)
  const [podcastDuration, setPodcastDuration] = useState(5);

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
      loadApplications();

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

  const loadApplications = async () => {
    try {
      const res = await fetch(`${API_URL}/api/applications`);
      const data = await res.json();
      setApplications(data);
    } catch (error) {
      console.error('Failed to load applications:', error);
    }
  };

  const handleApproveApplication = async (appId) => {
    if (!confirm('Approve this application? A stream link will be generated.')) return;
    
    try {
      const res = await fetch(`${API_URL}/api/applications/${appId}/approve`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        alert(`Application approved!\n\nStream link: ${window.location.origin}${data.streamLink}\n\nShare this with the guest.`);
        loadApplications();
      } else {
        alert('Failed to approve: ' + data.error);
      }
    } catch (error) {
      console.error('Error approving application:', error);
      alert('Failed to approve application');
    }
  };

  const handleRejectApplication = async (appId) => {
    const reason = prompt('Reason for rejection (optional):');
    if (reason === null) return; // User cancelled
    
    try {
      const res = await fetch(`${API_URL}/api/applications/${appId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (data.success) {
        alert('Application rejected. Slot freed up for others.');
        loadApplications();
      } else {
        alert('Failed to reject: ' + data.error);
      }
    } catch (error) {
      console.error('Error rejecting application:', error);
      alert('Failed to reject application');
    }
  };

  const handleStartNow = async (app) => {
    if (!confirm(`Start show NOW for ${app.memeName}?\n\nThis will begin a live broadcast immediately.`)) return;
    
    try {
      // Start the show with APPLICATION ID so backend can load guest data
      const res = await fetch(`${API_URL}/api/admin/start-website`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          duration: podcastDuration,
          applicationId: app.id  // PASS APPLICATION ID to backend
        })
      });
      
      const data = await res.json();
      if (data.success) {
        alert(`Show starting now for ${app.memeName}!`);
        loadBroadcastState();
      } else {
        alert('Failed to start show: ' + data.error);
      }
    } catch (error) {
      console.error('Error starting show:', error);
      alert('Failed to start show');
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
      console.log('🚀 Calling start-website API at:', `${API_URL}/api/admin/start-website`);
      console.log('⏱️ Podcast duration:', podcastDuration, 'minutes');
      const response = await fetch(`${API_URL}/api/admin/start-website`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration: podcastDuration })
      });
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Success:', data);
        alert(`Website started! Countdown beginning... (${podcastDuration} min podcast)`);
        loadBroadcastState();
      } else {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        alert(`Failed to start: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Failed to start website:', error);
      alert(`Error: ${error.message}`);
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
          className={`tab-btn ${activeTab === 'obs' ? 'active' : ''}`}
          onClick={() => setActiveTab('obs')}
        >
          🎥 OBS Stream Links
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
        <button 
          className={`tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          📝 Applications
        </button>
        <button 
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings
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
              <div className="duration-control">
                <label htmlFor="podcast-duration">
                  <strong>⏱️ Podcast Duration:</strong>
                </label>
                <input
                  id="podcast-duration"
                  type="number"
                  min="1"
                  max="60"
                  value={podcastDuration}
                  onChange={(e) => setPodcastDuration(parseInt(e.target.value) || 1)}
                  className="admin-input duration-input"
                  style={{ width: '80px', display: 'inline-block', margin: '0 10px' }}
                />
                <span>minutes</span>
              </div>
              <button onClick={handleStartWebsite} className="admin-btn start-btn">
                🚀 Start Show ({podcastDuration} min)
              </button>
            </div>
            <div className="info-box">
              <p><strong>ℹ️ Note:</strong> Starting the website will begin a 1 minute 30 second countdown, then run the podcast for the specified duration.</p>
            </div>
          </div>
        )}

        {/* OBS Stream Links */}
        {activeTab === 'obs' && (
          <div className="admin-section">
            <h2>🎥 OBS Stream Links</h2>
            <div className="obs-info-box">
              <p><strong>📡 Stream to Pump.fun Live & MemeTalk.TV</strong></p>
              <p>Use these links in OBS Studio or any streaming software to broadcast the show.</p>
            </div>

            <div className="stream-link-section">
              <h3>🔴 Admin Stream Link (Your View)</h3>
              <p className="link-description">Use this link to stream your interview. Add as "Browser Source" in OBS.</p>
              <div className="link-box">
                <code>{window.location.origin}/?admin=true</code>
                <button 
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/?admin=true`)}
                  className="copy-link-btn"
                >
                  📋 Copy
                </button>
              </div>
            </div>

            <div className="stream-link-section">
              <h3>🎬 Approved Guests Stream Links</h3>
              <p className="link-description">Each approved guest gets a unique stream link. Find them in the Applications tab.</p>
              {applications.filter(app => app.status === 'approved').length === 0 ? (
                <div style={{ color: '#888', padding: '16px' }}>
                  No approved applications yet. Approve applications to generate stream links.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {applications.filter(app => app.status === 'approved').map(app => (
                    <div key={app.id} style={{ 
                      background: 'rgba(0,0,0,0.7)', 
                      padding: '16px', 
                      borderRadius: '8px',
                      border: '1px solid rgba(139, 92, 246, 0.3)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        {app.memeImage && (
                          <img src={`${API_URL}${app.memeImage}`} alt={app.memeName} style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                        )}
                        <strong style={{ color: '#8b5cf6' }}>{app.memeName}</strong>
                      </div>
                      <div className="link-box">
                        <code>{window.location.origin}{app.streamLink}</code>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}${app.streamLink}`);
                            alert('Stream link copied!');
                          }}
                          className="copy-link-btn"
                        >
                          📋 Copy
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="obs-setup-guide">
              <h3>📝 OBS Studio Setup Guide</h3>
              <ol>
                <li><strong>Add Browser Source:</strong> In OBS, click "+" → "Browser Source"</li>
                <li><strong>Paste URL:</strong> Copy the stream link above and paste it</li>
                <li><strong>Set Resolution:</strong> Width: 1920, Height: 1080</li>
                <li><strong>Enable Audio:</strong> Check "Control audio via OBS"</li>
                <li><strong>Start Streaming:</strong> Click "Start Broadcast" in Admin Panel, then go live on Pump.fun</li>
              </ol>
              <div className="obs-tip">
                <strong>💡 Pro Tip:</strong> You (admin) can start shows manually at any time, even before scheduled time, 
                to test or give guests flexibility.
              </div>
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

        {/* Applications */}
        {activeTab === 'applications' && (
          <div className="admin-section">
            <h2>Guest Applications</h2>
            <p className="section-subtitle">Review and approve applications for upcoming shows</p>
            
            {applications.length === 0 ? (
              <p className="empty-message">No applications yet</p>
            ) : (
              <div className="applications-list">
                {applications.map(app => (
                  <div key={app.id} className="application-item">
                    <div className="application-header">
                      <div className="meme-preview">
                        {app.memeImage && (
                          <img 
                            src={`${API_URL}${app.memeImage}`} 
                            alt={app.memeName}
                          />
                        )}
                      </div>
                      <div className="application-info">
                        <h3>{app.memeName}</h3>
                        <p className="app-voice">
                          {app.voiceType === 'deep' && '🎙️ Deep & Authoritative'}
                          {app.voiceType === 'high' && '✨ High & Bright'}
                          {app.voiceType === 'calm' && '🧘 Calm & Neutral'}
                          {app.voiceType === 'energetic' && '⚡ Energetic & Warm'}
                          {app.voiceType === 'raspy' && '🎭 Raspy & Character'}
                          {!['deep', 'high', 'calm', 'energetic', 'raspy'].includes(app.voiceType) && `🎤 ${app.voiceType}`}
                        </p>
                        <p className="app-wallet">💎 Wallet: {app.walletAddress.slice(0, 6)}...{app.walletAddress.slice(-6)}</p>
                        <p className="app-date">📅 Submitted: {new Date(app.submittedAt).toLocaleString()}</p>
                      </div>
                      <div className={`app-status status-${app.status}`}>
                        {app.status === 'pending' ? '⏳ Pending' : app.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                      </div>
                    </div>
                    
                    <div className="application-body">
                      <div className="app-field">
                        <label>Personality Prompt:</label>
                        <p>{app.prompt}</p>
                      </div>
                      
                      {app.additionalInfo && (
                        <div className="app-field">
                          <label>Additional Info:</label>
                          <p>{app.additionalInfo}</p>
                        </div>
                      )}
                      
                      <div className="app-field">
                        <label>Transaction Signature:</label>
                        <a 
                          href={`https://solscan.io/tx/${app.txSignature}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tx-link"
                        >
                          {app.txSignature.slice(0, 12)}...{app.txSignature.slice(-12)}
                        </a>
                      </div>
                      
                      {app.streamLink && (
                        <div className="app-field">
                          <label>🔗 OBS Stream Link:</label>
                          <div className="stream-link-box">
                            <input 
                              type="text" 
                              value={app.streamLink} 
                              readOnly 
                              className="stream-link-input"
                            />
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(app.streamLink);
                                alert('Stream link copied!');
                              }}
                              className="copy-btn"
                            >
                              Copy
                            </button>
                          </div>
                          <p className="stream-info">Share this link with the creator for OBS/Pump.fun streaming</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="application-actions">
                      {app.status === 'pending' && (
                        <>
                          <button 
                            className="admin-btn approve-btn"
                            onClick={() => handleApproveApplication(app.id)}
                          >
                            ✅ Approve
                          </button>
                          <button 
                            className="admin-btn reject-btn"
                            onClick={() => handleRejectApplication(app.id)}
                          >
                            ❌ Reject
                          </button>
                        </>
                      )}
                      {app.status === 'approved' && (
                        <button 
                          onClick={() => handleStartNow(app)}
                          className="admin-btn start-now-btn"
                        >
                          🚀 Start Show NOW
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings */}
        {activeTab === 'settings' && (
          <div className="admin-section">
            <h2>Platform Settings</h2>
            
            <div className="settings-form">
              <div className="setting-group">
                <label>Platform Token Address (for burning)</label>
                <input 
                  type="text"
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                  className="admin-input token-input"
                  placeholder="Enter Solana token mint address"
                />
                <p className="setting-help">Default: D6AQDyi8AVX7oHTdiY1MfQRfYmzjYHkfENUxx1uQpump</p>
                <button 
                  onClick={() => {
                    localStorage.setItem('memetalk_token_address', tokenAddress);
                    alert('Token address saved! Restart the server for changes to take effect.');
                  }}
                  className="admin-btn save-btn"
                >
                  Save Token Address
                </button>
              </div>
              
              <div className="setting-group">
                <label>Burn Amount Required</label>
                <input 
                  type="number"
                  defaultValue="1000000"
                  className="admin-input"
                  placeholder="1000000"
                />
                <p className="setting-help">Amount of tokens users must burn to book a show</p>
              </div>
              
              <div className="setting-group">
                <label>Show Duration (minutes)</label>
                <input 
                  type="number"
                  defaultValue="60"
                  className="admin-input"
                  placeholder="60"
                />
                <p className="setting-help">Default duration for guest shows</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;

