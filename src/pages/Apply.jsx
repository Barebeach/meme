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

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData, logoFile);
    alert('Application submitted! We will contact you soon.');
  };

  return (
    <div className="page-container">
      <div className="page-hero">
        <h1 className="page-title">Apply to Be Featured</h1>
        <p className="page-subtitle">Bring your meme to life on MEMETALK.TV</p>
      </div>

      <div className="apply-content">
        {/* Promote Section */}
        <section className="promote-banner">
          <h2 className="promote-banner-title">Promote with $MEMETALK</h2>
          <p className="promote-banner-text">
            Want to promote your coin, meme, or platform on MEMETALK.TV?
          </p>
          <p className="promote-banner-text">
            All promotions and guest features on our podcast are paid exclusively in <strong>$MEMETALK</strong> — the token that powers every appearance on the show.
          </p>
          <p className="promote-banner-highlight">
            Hold it. Use it. Get seen.
          </p>
          <p className="promote-banner-tagline">
            🎙️ Because on MEMETALK, visibility comes in $MEMETALK.
          </p>
          <p className="promote-banner-burn">
            🔥 All $MEMETALK tokens paid for appearances are <strong>burned forever</strong> — reducing supply with each episode.
          </p>
        </section>

        <div className="apply-divider"></div>

        {/* How It Works Section */}
        <section className="how-it-works-section">
          <h2 className="section-heading">How It Works</h2>
          <p className="section-description">
            You send us your meme, coin, or project that you want promoted — and our AI brings it to life.
          </p>
          <p className="section-description">
            It will <strong>move, talk, and act</strong> like a real guest during the podcast.
          </p>
          
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-icon">📎</div>
              <h3>Upload Your Meme</h3>
              <p>Send us your meme image or logo</p>
            </div>
            <div className="step-card">
              <div className="step-icon">🧠</div>
              <h3>Describe Character</h3>
              <p>Tell us its vibe, personality, and message</p>
            </div>
            <div className="step-card">
              <div className="step-icon">🎤</div>
              <h3>Voice & Behavior</h3>
              <p>How should it sound and act on the show?</p>
            </div>
            <div className="step-card">
              <div className="step-icon">✨</div>
              <h3>AI Magic</h3>
              <p>We turn your meme into a living personality</p>
            </div>
          </div>
        </section>

        {/* Application Form */}
        <section className="application-form-section">
          <h2 className="section-heading">Submit Your Application</h2>
          <p className="section-description">Fill out the form below and our team will bring your meme to life</p>
          
          <form className="apply-form" onSubmit={handleSubmit}>
            {/* Logo Upload */}
            <div className="form-group upload-group">
              <label className="form-label">
                <span className="label-icon">📎</span>
                Upload Your Meme Image or Logo
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
                Project / Meme Name
              </label>
              <input
                type="text"
                name="projectName"
                value={formData.projectName}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., PopCat, Pepe, Doge..."
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

            {/* Character Description */}
            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">🧠</span>
                Character Description & Vibe
              </label>
              <textarea
                name="characterDescription"
                value={formData.characterDescription}
                onChange={handleInputChange}
                className="form-textarea"
                placeholder="Describe the personality, vibe, and message of your meme. Is it funny, serious, sarcastic, chaotic? What does it stand for?"
                rows="4"
                required
              />
              <span className="form-hint">Be creative! This helps our AI understand how to bring your meme to life.</span>
            </div>

            {/* Voice & Behavior */}
            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">🎤</span>
                Voice & Behavior Preferences
              </label>
              <textarea
                name="voicePersonality"
                value={formData.voicePersonality}
                onChange={handleInputChange}
                className="form-textarea"
                placeholder="How should it sound? Deep voice, high-pitched, calm, energetic? Should it be friendly, aggressive, witty?"
                rows="4"
                required
              />
              <span className="form-hint">Tell us how you want it to act and sound during the interview.</span>
            </div>

            {/* Additional Info */}
            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">💬</span>
                Additional Information (Optional)
              </label>
              <textarea
                name="additionalInfo"
                value={formData.additionalInfo}
                onChange={handleInputChange}
                className="form-textarea"
                placeholder="Anything else we should know? Project links, community info, special requests..."
                rows="3"
              />
            </div>

            {/* Payment Notice */}
            <div className="payment-notice">
              <div className="notice-icon">💰</div>
              <div className="notice-content">
                <h4>Payment Required</h4>
                <p>
                  All guest appearances are paid in <strong>$MEMETALK tokens</strong>. 
                  Once approved, we'll send you payment details and schedule your episode.
                </p>
                <p className="notice-highlight">
                  🔥 Your payment will be <strong>burned forever</strong>, reducing the total supply.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" className="submit-button">
              <span>🚀</span>
              Submit Application
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default Apply;

