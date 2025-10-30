function About() {
  return (
    <div className="page-container">
      <div className="page-hero">
        <h1 className="page-title">About MemeTalk.TV</h1>
        <p className="page-subtitle">The most community-driven podcast in crypto</p>
      </div>

      <div className="about-content">
        <section className="about-section">
          <h2 className="about-heading">How It Works</h2>
          <p className="about-text">
            MemeTalk.TV isn't your typical podcast. Every episode is shaped by YOU—the community. 
            Through live chat, you ask the questions, and our AI-powered host brings them to life 
            in real conversations with crypto's most iconic meme projects.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-heading">Community-Driven Content</h2>
          <p className="about-text">
            The community decides everything. Vote on which projects get interviewed next, 
            submit your burning questions beforehand, or join the live chat during episodes 
            to interact in real-time. No gatekeepers, no corporate BS—just pure, unfiltered conversations.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-heading">Where We Publish</h2>
          <div className="publish-list">
            <div className="publish-item">
              <span className="publish-icon">🎥</span>
              <div>
                <h3>YouTube</h3>
                <p>Full episodes on the MemeTalk.TV channel</p>
              </div>
            </div>
            <div className="publish-item">
              <span className="publish-icon">🌐</span>
              <div>
                <h3>This Website</h3>
                <p>All episodes archived and available on demand</p>
              </div>
            </div>
            <div className="publish-item">
              <span className="publish-icon">🐦</span>
              <div>
                <h3>Social Media</h3>
                <p>Clips and highlights on Twitter, TikTok, and more</p>
              </div>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2 className="about-heading">Apply for an Interview</h2>
          <p className="about-text">
            Want your meme project featured on MemeTalk.TV? We're always looking for the next 
            legendary conversation. Whether you're launching a new token, building a community, 
            or just have an insane story to tell—we want to hear from you.
          </p>
          <div className="apply-steps">
            <div className="apply-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Hold Our Meme Coin</h3>
                <p>Priority access for holders of $MEMETALK token</p>
              </div>
            </div>
            <div className="apply-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Submit Your Application</h3>
                <p>Fill out the form with your project details and why you'd make a great guest</p>
              </div>
            </div>
            <div className="apply-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Community Votes</h3>
                <p>The community decides who gets interviewed next through voting</p>
              </div>
            </div>
          </div>
          <button className="cta-button">Apply Now</button>
        </section>

        <section className="about-section promote-section">
          <h2 className="about-heading">Promote with $MEMETALK</h2>
          <p className="about-text" style={{fontSize: '18px', marginBottom: '24px'}}>
            Want to promote your coin, meme, or platform on MEMETALK.TV?
          </p>
          <p className="about-text" style={{fontSize: '16px', marginBottom: '24px'}}>
            All promotions and guest features on our podcast are paid exclusively in <strong>$MEMETALK</strong> — the token that powers every appearance on the show.
          </p>
          <p className="about-text" style={{fontSize: '20px', fontWeight: '600', color: '#fbbf24', marginBottom: '20px'}}>
            Hold it. Use it. Get seen.
          </p>
          <p className="about-text" style={{fontSize: '18px', color: 'rgba(255, 255, 255, 0.9)'}}>
            🎙️ Because on MEMETALK, visibility comes in $MEMETALK.
          </p>
          <button className="cta-button" style={{marginTop: '32px'}}>Get $MEMETALK</button>
        </section>

        <section className="about-section final-section">
          <h2 className="about-heading">The $MEMETALK Token</h2>
          <p className="about-text">
            Holding $MEMETALK gives you exclusive perks: priority interview applications, 
            governance voting power, early access to episodes, and special roles in our community. 
            Be part of the revolution where memes meet real conversations.
          </p>
          <div className="token-benefits">
            <div className="benefit-item">✓ Priority guest applications</div>
            <div className="benefit-item">✓ Vote on upcoming guests</div>
            <div className="benefit-item">✓ Early episode access</div>
            <div className="benefit-item">✓ Exclusive community roles</div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default About


