import { useState, useEffect } from 'react'

function Episodes() {
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEpisode, setSelectedEpisode] = useState(null);

  useEffect(() => {
    loadEpisodes();
  }, []);

  const loadEpisodes = async () => {
    try {
      const response = await fetch('${window.location.origin}/api/episodes');
      if (response.ok) {
        const data = await response.json();
        setEpisodes(data);
      }
    } catch (error) {
      console.error('Failed to load episodes:', error);
    } finally {
      setLoading(false);
    }
  };

  const watchEpisode = (episode) => {
    setSelectedEpisode(episode);
  };

  const closePlayer = () => {
    setSelectedEpisode(null);
  };

  return (
    <div className="episodes-page">
      <div className="episodes-hero">
        <h1 className="episodes-title">📼 All Episodes</h1>
        <p className="episodes-subtitle">Every interview recorded, published to MemeTalk.TV, X, and YouTube, and displayed here</p>
      </div>

      <div className="episodes-container">
        {loading ? (
          <div className="episodes-loading">
            <div className="loading-spinner"></div>
            <p>Loading episodes...</p>
          </div>
        ) : episodes.length === 0 ? (
          <div className="episodes-empty">
            <div className="empty-icon">🎬</div>
            <h2>No Episodes Yet</h2>
            <p>Episodes will appear here automatically after each live show!</p>
          </div>
        ) : (
          <div className="episodes-grid">
            {episodes.map((episode, index) => (
              <div key={episode.number || index} className="episode-card">
                <div className="episode-thumbnail">
                  {episode.thumbnail ? (
                    <img src={episode.thumbnail} alt={episode.title} />
                  ) : (
                    <div className="episode-placeholder">
                      <span className="placeholder-icon">🎙️</span>
                    </div>
                  )}
                  <div className="episode-duration-badge">
                    {episode.duration || '5:00'}
                  </div>
                </div>
                <div className="episode-content">
                  <h3 className="episode-title">{episode.title}</h3>
                  <p className="episode-guest">
                    <span className="guest-icon">🎭</span>
                    Guest: {episode.guest}
                  </p>
                  <p className="episode-date">
                    <span className="date-icon">📅</span>
                    {episode.date}
                  </p>
                  {episode.description && (
                    <p className="episode-description">{episode.description}</p>
                  )}
                  <p className="episode-views">👁️ {episode.views} views</p>
                  
                  <button 
                    className="episode-watch-btn"
                    onClick={() => watchEpisode(episode)}
                  >
                    ▶️ Watch Episode
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      {selectedEpisode && (
        <div className="video-modal-overlay" onClick={closePlayer}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="video-modal-close" onClick={closePlayer}>✕</button>
            <h2>{selectedEpisode.title}</h2>
            <div className="video-player-wrapper">
              {selectedEpisode.videoFile ? (
                <video
                  controls
                  autoPlay
                  style={{ width: '100%', maxHeight: '70vh', backgroundColor: '#000' }}
                >
                  <source src={`${window.location.origin}/episodes/${selectedEpisode.videoFile}`} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#1a1a1a', borderRadius: '8px' }}>
                  <p style={{ fontSize: '18px', marginBottom: '10px' }}>⏳ Video is being processed...</p>
                  <p style={{ color: '#888' }}>This episode will be available shortly!</p>
                </div>
              )}
            </div>
            <div style={{ marginTop: '20px' }}>
              <p><strong>Guest:</strong> {selectedEpisode.guest}</p>
              <p><strong>Date:</strong> {selectedEpisode.date}</p>
              {selectedEpisode.description && <p><strong>Description:</strong> {selectedEpisode.description}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Episodes;


