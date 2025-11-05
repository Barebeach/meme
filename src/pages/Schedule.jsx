import { useState, useEffect } from 'react';
import '../styles/Schedule.css';

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin;

function Schedule() {
  const [schedule, setSchedule] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchedule();
    loadApplications();
  }, []);

  const loadSchedule = async () => {
    try {
      const res = await fetch(`${API_URL}/api/schedule`);
      const data = await res.json();
      setSchedule(data);
    } catch (error) {
      console.error('Failed to load schedule:', error);
    } finally {
      setLoading(false);
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

  const getApplicationForSlot = (slotId) => {
    return applications.find(app => app.scheduleSlotId === slotId);
  };

  if (loading) {
    return (
      <div className="schedule-page">
        <div className="loading">Loading schedule...</div>
      </div>
    );
  }

  // Group slots by month (filter out past dates)
  const groupByMonth = () => {
    const groups = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for fair comparison
    
    schedule.forEach(slot => {
      const date = new Date(slot.date);
      date.setHours(0, 0, 0, 0);
      
      // Only show future dates (today and onwards)
      if (date >= today) {
        const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        if (!groups[monthYear]) {
          groups[monthYear] = [];
        }
        groups[monthYear].push(slot);
      }
    });
    return groups;
  };

  const monthGroups = groupByMonth();

  return (
    <div className="schedule-page">
      <div className="schedule-container">
        <div className="schedule-header">
          <h1>📅 Show Schedule</h1>
          <p>All shows are broadcast live at 4:00 PM EST with community interaction</p>
          <p className="burn-info">🔥 Book your slot by burning 1M platform tokens on the Apply page</p>
        </div>

        <div className="calendar-view">
          {Object.keys(monthGroups).map(monthYear => (
            <div key={monthYear} className="calendar-month">
              <h2 className="month-header">{monthYear}</h2>
              <div className="calendar-grid">
                {monthGroups[monthYear].map(slot => {
                  const application = getApplicationForSlot(slot.id);
                  const isBooked = slot.isBooked;
                  const date = new Date(slot.date);

                  return (
                    <div 
                      key={slot.id}
                      className={`calendar-day ${isBooked ? 'booked' : 'available'}`}
                    >
                      <div className="day-header">
                        <span className="day-number">{date.getDate()}</span>
                        <span className="day-name">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                      </div>
                      
                      <div className="day-content">
                        <div className="day-time">🕓 {slot.displayTime}</div>
                        
                        {isBooked && application ? (
                          <div className="day-booked">
                            {application.memeImage && (
                              <img 
                                src={`${API_URL}${application.memeImage}`} 
                                alt={application.memeName}
                                className="day-meme-img"
                              />
                            )}
                            <div className="day-meme-name">{application.memeName}</div>
                            <div className="day-status booked-badge">🔥 Booked</div>
                          </div>
                        ) : (
                          <div className="day-available">
                            <div className="available-icon">✨</div>
                            <div className="day-status available-badge">Open</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {schedule.filter(s => !s.isBooked).length === 0 && (
          <div className="no-slots">
            <h3>All slots are currently booked!</h3>
            <p>Check back later for new availability</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Schedule;
