import { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletProvider';
import '../styles/Apply.css';

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin;

// Default burn settings (can be changed in admin)
const DEFAULT_FALLBACK_ADDRESS = 'D6AQDyi8AVX7oHTdiY1MfQRfYmzjYHkfENUxx1uQpump';
const BURN_AMOUNT = 500000; // 500k tokens to book a show

function Apply() {
  const { connected, publicKey, connect, burnTokens, getTokenBalance } = useWallet();
  
  const [schedule, setSchedule] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Get token address from localStorage or use default
  const [tokenAddress, setTokenAddress] = useState(
    localStorage.getItem('memetalk_token_address') || DEFAULT_FALLBACK_ADDRESS
  );
  
  // Form state
  const [formData, setFormData] = useState({
    memeName: '',
    prompt: '',
    voiceType: 'raspy', // Default to raspy (fable voice - the original Pepe voice)
    additionalInfo: '',
    memeImage: null
  });
  
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load schedule
  useEffect(() => {
    loadSchedule();
  }, []);

  // Load token balance when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      loadTokenBalance();
    }
  }, [connected, publicKey]);

  const loadSchedule = async () => {
    try {
      const res = await fetch(`${API_URL}/api/schedule`);
      const data = await res.json();
      setSchedule(data);
    } catch (error) {
      console.error('Failed to load schedule:', error);
    }
  };

  const loadTokenBalance = async () => {
    try {
      setLoading(true);
      const balance = await getTokenBalance(tokenAddress);
      setTokenBalance(balance);
    } catch (error) {
      console.error('Failed to load token balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match('image/png')) {
        setError('Please upload a PNG image');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Image must be less than 10MB');
        return;
      }
      
      setFormData({ ...formData, memeImage: file });
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      setError('');
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!connected) {
      setError('Please connect your Phantom wallet first');
      return;
    }

    if (!selectedSlot) {
      setError('Please select a time slot');
      return;
    }

    if (!formData.memeImage) {
      setError('Please upload a meme image (PNG)');
      return;
    }

    if (!formData.memeName || !formData.prompt || !formData.voiceType) {
      setError('Please fill in all required fields');
      return;
    }

    if (tokenBalance < BURN_AMOUNT) {
      setError(`Insufficient token balance. You need ${BURN_AMOUNT.toLocaleString()} tokens, but have ${tokenBalance.toLocaleString()}`);
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      // Step 1: Burn tokens
      console.log('🔥 Burning tokens...');
      const txSignature = await burnTokens(tokenAddress, BURN_AMOUNT);
      console.log('✅ Tokens burned! Signature:', txSignature);

      // Step 2: Submit application
      const formDataToSend = new FormData();
      formDataToSend.append('memeImage', formData.memeImage);
      formDataToSend.append('memeName', formData.memeName);
      formDataToSend.append('prompt', formData.prompt);
      formDataToSend.append('voiceType', formData.voiceType);
      formDataToSend.append('additionalInfo', formData.additionalInfo);
      formDataToSend.append('walletAddress', publicKey);
      formDataToSend.append('txSignature', txSignature);
      formDataToSend.append('scheduleSlotId', selectedSlot.id);

      const response = await fetch(`${API_URL}/api/applications/submit`, {
        method: 'POST',
        body: formDataToSend
      });

      const result = await response.json();

      if (response.ok) {
        // Show success modal with stream link
        const streamUrl = result.fullStreamUrl || `${window.location.origin}${result.streamLink}`;
        const successMsg = `
🎉 CONGRATULATIONS! Your show is booked!

📅 Show Date: ${result.scheduledTime}

🎥 YOUR STREAM LINK (Add to OBS):
${streamUrl}

📝 Important Instructions:
1. Add the stream link above as a "Browser Source" in OBS Studio
2. Set resolution to 1920x1080
3. Your show will START at the scheduled time
4. Be ready 5 minutes before showtime
5. Stream this link to your Pump.fun page for maximum exposure!

💾 SAVE THIS LINK - You'll need it on show day!
        `;
        
        alert(successMsg);
        setSuccess(`✅ Slot booked! Check your console for stream link details.`);
        console.log('='.repeat(60));
        console.log('🎉 YOUR SHOW IS BOOKED!');
        console.log('='.repeat(60));
        console.log(`📅 Scheduled: ${result.scheduledTime}`);
        console.log(`🎥 Stream Link: ${streamUrl}`);
        console.log(`🎭 Meme Name: ${result.memeName}`);
        console.log('='.repeat(60));
        console.log('📝 INSTRUCTIONS:');
        console.log('1. Add stream link to OBS as Browser Source (1920x1080)');
        console.log('2. Be ready 5 minutes before your show time');
        console.log('3. Stream to your Pump.fun page for exposure!');
        console.log('='.repeat(60));
        
          // Reset form
          setFormData({
            memeName: '',
            prompt: '',
            voiceType: 'raspy',
            additionalInfo: '',
            memeImage: null
          });
        setImagePreview(null);
        setSelectedSlot(null);
        
        // Reload schedule
        loadSchedule();
        loadTokenBalance();
      } else {
        setError(result.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      setError(error.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="apply-page">
      <div className="apply-container">
        <div className="apply-header">
          <h1>Apply to MemeTalk.TV</h1>
          <p>Give your meme a voice! Book a 1-hour live show with the community.</p>
        </div>

        {/* Free Spots Schedule - Calendar View */}
        <div className="free-spots-section">
          <h2>📅 Available Show Slots</h2>
          <p className="spots-subtitle">All shows broadcast live at 4:00 PM EST • 1 hour duration • 500K tokens to book</p>
          
          <div className="apply-calendar-grid">
            {schedule.filter(slot => {
              const slotDate = new Date(slot.date);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              slotDate.setHours(0, 0, 0, 0);
              // Only show future dates (tomorrow onwards) and not booked
              return slotDate > today && !slot.isBooked;
            }).slice(0, 20).map((slot) => {
              const date = new Date(slot.date);
              return (
                <div 
                  key={slot.id}
                  className={`apply-calendar-day ${selectedSlot?.id === slot.id ? 'selected' : ''} ${!connected ? 'disabled' : ''}`}
                  onClick={() => connected && setSelectedSlot(slot)}
                >
                  <div className="apply-day-header">
                    <span className="apply-day-number">{date.getDate()}</span>
                    <span className="apply-day-name">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  </div>
                  <div className="apply-day-month">{date.toLocaleDateString('en-US', { month: 'short' })}</div>
                  <div className="apply-day-time">🕓 {slot.displayTime}</div>
                  <div className="apply-day-status">✨ Open</div>
                  {selectedSlot?.id === slot.id && <div className="selected-checkmark">✓</div>}
                </div>
              );
            })}
          </div>

          {schedule.filter(slot => {
            const slotDate = new Date(slot.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            slotDate.setHours(0, 0, 0, 0);
            return slotDate > today && !slot.isBooked;
          }).length === 0 && (
            <div className="no-slots-message">
              <p>🔥 All slots are currently booked! Check back soon for new availability.</p>
            </div>
          )}
        </div>

        {/* Wallet Connection */}
        <div className="wallet-section">
          {!connected ? (
            <div className="connect-prompt-section">
              <h3>Ready to book your show?</h3>
              <p>Connect your Phantom wallet to select a slot and apply</p>
              <div className="token-info-box">
                <p className="token-info-label">🔥 Token Required to Burn:</p>
                <div className="token-mint-address">
                  <code>{tokenAddress}</code>
                  <button 
                    onClick={() => navigator.clipboard.writeText(tokenAddress)}
                    className="copy-btn"
                    title="Copy address"
                  >
                    📋
                  </button>
                </div>
                <p className="token-amount-info">You need to burn {BURN_AMOUNT.toLocaleString()} tokens to book a slot</p>
              </div>
              <button onClick={connect} className="connect-wallet-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M21 18V19C21 20.1 20.1 21 19 21H5C3.89 21 3 20.1 3 19V5C3 3.9 3.89 3 5 3H19C20.1 3 21 3.9 21 5V6H12C10.89 6 10 6.9 10 8V16C10 17.1 10.89 18 12 18H21ZM12 16H22V8H12V16ZM16 13.5C15.17 13.5 14.5 12.83 14.5 12C14.5 11.17 15.17 10.5 16 10.5C16.83 10.5 17.5 11.17 17.5 12C17.5 12.83 16.83 13.5 16 13.5Z" fill="currentColor"/>
                </svg>
                Connect Phantom Wallet to Apply
              </button>
            </div>
          ) : (
            <div className="wallet-connected">
              <div className="wallet-info">
                <span className="wallet-label">Connected:</span>
                <span className="wallet-address">{publicKey.slice(0, 4)}...{publicKey.slice(-4)}</span>
              </div>
              <div className="token-balance-section">
                <div className="token-balance">
                  <span className="balance-label">Token Balance:</span>
                  <span className="balance-amount">{loading ? '...' : tokenBalance.toLocaleString()}</span>
                </div>
                <div className="token-address-info">
                  <span className="token-label">Token:</span>
                  <code className="token-address-display">{tokenAddress.slice(0, 8)}...{tokenAddress.slice(-6)}</code>
                  <button 
                    onClick={() => navigator.clipboard.writeText(tokenAddress)}
                    className="copy-btn-small"
                    title="Copy full address"
                  >
                    📋
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Application Form - Only show when wallet connected and slot selected */}
        {connected && selectedSlot && (
          <>
              <form onSubmit={handleSubmit} className="apply-form">
                <h2>Meme Application</h2>
                
                {/* Image Upload */}
                <div className="form-group">
                  <label>Meme Image (PNG only) *</label>
                  <div className="image-upload">
                    {imagePreview ? (
                      <div className="image-preview">
                        <img src={imagePreview} alt="Meme preview" />
                        <button type="button" onClick={() => {
                          setFormData({ ...formData, memeImage: null });
                          setImagePreview(null);
                        }}>Change Image</button>
                      </div>
                    ) : (
                      <label className="upload-btn">
                        <input 
                          type="file" 
                          accept="image/png"
                          onChange={handleImageChange}
                          style={{ display: 'none' }}
                        />
                        📸 Upload Meme Image
                      </label>
                    )}
                  </div>
                </div>

                {/* Meme Name */}
                <div className="form-group">
                  <label>Meme Name *</label>
                  <input 
                    type="text"
                    name="memeName"
                    value={formData.memeName}
                    onChange={handleInputChange}
                    placeholder="e.g., Doge, Wojak, Pepe Cousin..."
                    required
                  />
                </div>

                {/* Prompt */}
                <div className="form-group">
                  <label>Meme Personality Prompt *</label>
                  <textarea 
                    name="prompt"
                    value={formData.prompt}
                    onChange={handleInputChange}
                    placeholder="Describe your meme's personality, behavior, catchphrases, etc. Be creative!"
                    rows="5"
                    required
                  />
                </div>

                {/* Voice Type */}
                <div className="form-group">
                  <label>Voice Type * (Choose how your meme will sound)</label>
                  <select 
                    name="voiceType"
                    value={formData.voiceType}
                    onChange={handleInputChange}
                    required
                    className="voice-selector"
                  >
                    <option value="deep">🎙️ Deep & Authoritative - Like a movie trailer narrator</option>
                    <option value="high">✨ High & Bright - Energetic and expressive</option>
                    <option value="calm">🧘 Calm & Neutral - Smooth and balanced</option>
                    <option value="energetic">⚡ Energetic & Warm - Enthusiastic and friendly</option>
                    <option value="raspy">🎭 Raspy & Character - British expressive narrator</option>
                  </select>
                  <p className="voice-hint">💡 This will be your meme's voice during the live interview!</p>
                </div>

                {/* Additional Info */}
                <div className="form-group">
                  <label>Additional Information</label>
                  <textarea 
                    name="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={handleInputChange}
                    placeholder="Any special requests or information for the team?"
                    rows="3"
                  />
                </div>

                {/* Show Details */}
                <div className="show-details">
                  <h3>Show Details</h3>
                  <ul>
                    <li>📅 Scheduled: {selectedSlot.displayDate} at {selectedSlot.displayTime}</li>
                    <li>⏱️ Duration: 1 hour live show</li>
                    <li>🎥 Recorded live with community interaction</li>
                    <li>📺 Posted to YouTube, Twitter, and website</li>
                    <li>🔥 Cost: {BURN_AMOUNT.toLocaleString()} tokens (burned)</li>
                  </ul>
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={submitting || tokenBalance < BURN_AMOUNT}
                >
                  {submitting ? 'Submitting...' : `🔥 Burn ${BURN_AMOUNT.toLocaleString()} Tokens & Book Show`}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Apply;
