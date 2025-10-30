function Schedule() {
  const upcomingEpisodes = [
    {
      date: "Nov 2, 2025",
      time: "8:00 PM EST",
      title: "Bonk vs Floki: The Battle",
      guest: "Bonk 🔨 × Floki 🐕",
      status: "upcoming"
    },
    {
      date: "Nov 5, 2025",
      time: "8:00 PM EST",
      title: "SafeMoon Survivor Stories",
      guest: "Anonymous Holders 💎",
      status: "upcoming"
    },
    {
      date: "Nov 9, 2025",
      time: "8:00 PM EST",
      title: "NFT Memes: Dead or Alive?",
      guest: "Pudgy Penguins 🐧",
      status: "upcoming"
    }
  ];

  return (
    <div className="page-container">
      <div className="page-hero">
        <h1 className="page-title">Upcoming Schedule</h1>
        <p className="page-subtitle">Mark your calendar for the next unhinged conversations</p>
      </div>

      <div className="schedule-grid">
        {upcomingEpisodes.map((episode, index) => (
          <div key={index} className="schedule-card">
            <div className="schedule-date">
              <div className="date-day">{episode.date.split(' ')[1]}</div>
              <div className="date-month">{episode.date.split(' ')[0]}</div>
            </div>
            <div className="schedule-content">
              <span className="schedule-status">UPCOMING</span>
              <h3 className="schedule-title">{episode.title}</h3>
              <p className="schedule-guest">{episode.guest}</p>
              <div className="schedule-time">⏰ {episode.time}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="schedule-cta">
        <h2>Want to be notified?</h2>
        <p>Join our Discord to get pinged before every episode goes live</p>
        <button className="cta-button">Join Discord</button>
      </div>
    </div>
  )
}

export default Schedule


