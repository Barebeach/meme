import { useState } from 'react'

function Apply() {
  const [formData, setFormData] = useState({
    projectName: '',
    contactEmail: '',
    characterDescription: '',
    voicePersonality: '',
    additionalInfo: ''
  });
  
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const formBlocked = true; // Set to true to block applications

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const connectPhantomWallet = async () => {
    try {
      const { solana } = window;
      
      if (!solana || !solana.isPhantom) {
        alert('Phantom wallet not found! Please install Phantom wallet extension.');
        window.open('https://phantom.app/', '_blank');
        return;
      }
      
      const response = await solana.connect();
      setWalletConnected(true);
      setWalletAddress(response.publicKey.toString());
      console.log('Connected to wallet:', response.publicKey.toString());
    } catch (error) {
      console.error('Error connecting to Phantom wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    }
  };

  const disconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!walletConnected) {
      alert('Please connect your wallet first to submit an application.');
      return;
    }
    
    // Handle form submission
    console.log('Form submitted:', formData, logoFile, 'Wallet:', walletAddress);
    alert('Application submitted! We will contact you soon via email with payment details.');
  };

  return (
    <div className="page-container">
      <div className="page-hero">
        <h1 className="page-title">Apply to Be Featured</h1>
        <p className="page-subtitle">Upload your meme, describe its personality, and our AI brings it to life on the show. Payment in $MEMETALK — burned forever with each episode.</p>
      </div>

      <div className="apply-content">
        {/* pump.fun Partnership Section */}
        <div className="pumpfun-partnership">
          <div className="partnership-logos">
            <span className="partnership-text">MemeTalk.TV</span>
            <span className="partnership-x">×</span>
            <img src="https://pump.fun/pump-logomark-halloween.svg" alt="pump.fun" className="pumpfun-logo" />
            <span className="partnership-text">pump.fun</span>
          </div>
          <p className="partnership-description">
            Stream your interview live on <strong>pump.fun</strong> and reach thousands of crypto enthusiasts in real-time!
          </p>
        </div>

        {/* Burn Mechanism Explanation */}
        <div className="burn-mechanism-box">
          <div className="burn-icon">🔥</div>
          <div className="burn-content">
            <h3>How the Burn Works</h3>
            <p>
              Every guest appearance is paid in <strong>$MEMETALK tokens</strong>. 
              100% of the payment is <strong>permanently burned</strong> from the supply after your episode airs.
            </p>
            <p>
              <strong>Your appearance = Less supply = More value for all holders.</strong>
            </p>
          </div>
        </div>

        {/* Wallet Connect Section */}
        <div className="wallet-connect-section">
          {!walletConnected ? (
            <button onClick={connectPhantomWallet} className="phantom-connect-button">
              <img src="https://raw.githubusercontent.com/phantom/branding/master/phantom-icon-purple.png" alt="Phantom" className="phantom-icon" />
              Connect Phantom Wallet
            </button>
          ) : (
            <div className="wallet-connected">
              <span className="wallet-badge">
                ✅ Connected: {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
              </span>
              <button onClick={disconnectWallet} className="disconnect-button">Disconnect</button>
            </div>
          )}
          <p className="wallet-hint">Required to submit your application</p>
        </div>

        {/* Form Blocked Notice */}
        {formBlocked && (
          <div className="form-blocked-notice">
            <div className="blocked-icon">🚫</div>
            <div className="blocked-content">
              <h3>Applications Currently Closed</h3>
              <p>Applications are blocked until the last scheduled episode ends.</p>
              <p className="blocked-hint">Check the <a href="/schedule">Schedule page</a> for upcoming availability.</p>
            </div>
          </div>
        )}
          
          <form className="apply-form" onSubmit={handleSubmit} style={{opacity: formBlocked ? 0.5 : 1, pointerEvents: formBlocked ? 'none' : 'auto'}}>
            {/* Logo Upload */}
            <div className="form-group upload-group">
              <label className="form-label">
                <span className="label-icon">📎</span>
                Meme Logo
              </label>
              <div className="upload-area">
                {logoPreview ? (
                  <div className="upload-preview">
                    <img src={logoPreview} alt="Preview" />
                    <button 
                      type="button" 
                      className="remove-preview"
                      onClick={() => {
                        setLogoFile(null);
                        setLogoPreview(null);
                      }}
                    >
                      ✕ Remove
                    </button>
                  </div>
                ) : (
                  <label className="upload-label">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileChange}
                      className="upload-input"
                    />
                    <div className="upload-placeholder">
                      <span className="upload-icon">📁</span>
                      <span>Click to upload or drag & drop</span>
                      <span className="upload-hint">PNG, JPG, GIF (max 10MB)</span>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Project Name */}
            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">🏷️</span>
                Meme Name
              </label>
              <input
                type="text"
                name="projectName"
                value={formData.projectName}
                onChange={handleInputChange}
                className="form-input"
                placeholder="PopCat, Pepe, Doge..."
                required
              />
            </div>

            {/* Contact Email */}
            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">📧</span>
                Contact Email
              </label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
                className="form-input"
                placeholder="your@email.com"
                required
              />
            </div>

            {/* AI Prompt / Character Description */}
            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">🤖</span>
                AI Prompt — Character Personality
              </label>
              <textarea
                name="characterDescription"
                value={formData.characterDescription}
                onChange={handleInputChange}
                className="form-textarea"
                placeholder="Write your AI prompt: personality, vibe, backstory, catchphrases - funny, serious, sarcastic, chaotic, degen, etc."
                rows="3"
                required
              />
              <span className="form-hint">This is the prompt our AI uses to create your character's personality</span>
            </div>

            {/* Voice & Behavior */}
            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">🎤</span>
                Voice & Behavior
              </label>
              <textarea
                name="voicePersonality"
                value={formData.voicePersonality}
                onChange={handleInputChange}
                className="form-textarea"
                placeholder="Deep, high-pitched, calm, energetic, friendly, aggressive, witty?"
                rows="3"
                required
              />
            </div>

            {/* Additional Info */}
            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">💬</span>
                Additional Info (Optional)
              </label>
              <textarea
                name="additionalInfo"
                value={formData.additionalInfo}
                onChange={handleInputChange}
                className="form-textarea"
                placeholder="Project links, community info, special requests..."
                rows="2"
              />
            </div>

            {/* Submit Button */}
            <button type="submit" className="submit-button">
              <span>🚀</span>
              Submit Application
            </button>
          </form>
      </div>
    </div>
  );
}

export default Apply;

