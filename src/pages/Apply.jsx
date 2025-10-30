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
        <p className="page-subtitle">Upload your meme, describe its personality, and our AI brings it to life on the show. Payment in $MEMETALK — burned forever with each episode.</p>
      </div>

      <div className="apply-content">
          
          <form className="apply-form" onSubmit={handleSubmit}>
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

            {/* Character Description */}
            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">🧠</span>
                Character Description
              </label>
              <textarea
                name="characterDescription"
                value={formData.characterDescription}
                onChange={handleInputChange}
                className="form-textarea"
                placeholder="Personality, vibe, message - funny, serious, sarcastic, chaotic?"
                rows="3"
                required
              />
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

