import '../styles/About.css'

function About() {
  return (
    <div className="page-container">
      <div className="page-hero">
        <h1 className="page-title">About MemeTalk.TV</h1>
        <p className="page-subtitle">Give Your Meme a Voice — Where Creators Meet Community</p>
      </div>

      <div className="about-content">
        <section className="about-section intro-section">
          <h2 className="about-heading">What is MemeTalk.TV?</h2>
          <p className="about-text large">
            MemeTalk.TV is the ultimate platform where creators can give their memes a voice. 
            Whether you're building a token, launching a community, or just have an epic meme story — 
            we bring your project to life through live, interactive podcast episodes.
          </p>
          <p className="about-text large">
            Every show is broadcast live with real-time community interaction, recorded, and published 
            across multiple platforms for maximum reach.
          </p>
        </section>

        <section className="about-section pumpfun-section">
          <div className="pumpfun-badge">
            <img src="https://pump.fun/_next/image?url=%2Flogo.png&w=64&q=75" alt="Pump.fun" className="pumpfun-logo" />
            <span>Pairs Perfectly with Pump.fun Live</span>
          </div>
          <p className="about-text">
            Launching on Pump.fun? MemeTalk.TV is your next step. Give your token instant credibility and visibility 
            by showcasing it in a live interview with <strong>Mr. Cock</strong>, our legendary host.
          </p>
          <p className="about-text">
            <strong>🎥 Stream Your Interview to Pump.fun Live:</strong> When you book your slot, we provide you with an <strong>OBS stream link</strong>. 
            Simply add our link as a <strong>Browser Source</strong> or use <strong>Display Capture</strong> to broadcast your live interview on Pump.fun's platform, 
            maximizing your exposure to thousands of crypto enthusiasts watching in real-time.
          </p>
          <p className="about-text">
            Your community gets to ask questions live, and we handle all the technical setup. Just add our stream link as a Browser Source or use Display Capture, 
            then hit "Go Live" on Pump.fun. It's that simple.
          </p>
        </section>

        <section className="about-section how-it-works-section">
          <h2 className="about-heading">How It Works</h2>
          <div className="steps-clean">
            <div className="step-clean">
              <div className="step-icon">🔥</div>
              <h3>Burn Tokens to Book</h3>
              <p>Burn 500K MemeTalk.TV tokens to secure your live interview slot</p>
            </div>
            <div className="step-clean">
              <div className="step-icon">🎙️</div>
              <h3>Live Show Broadcast</h3>
              <p>Your meme gets interviewed by <strong>Mr. Cock</strong>, our legendary host, live at 4PM EST with the community watching and participating in real-time</p>
            </div>
            <div className="step-clean">
              <div className="step-icon">📹</div>
              <h3>Published Everywhere</h3>
              <p>Episode is recorded, edited, and published to YouTube, X (Twitter), and our website</p>
            </div>
            <div className="step-clean">
              <div className="step-icon">🚀</div>
              <h3>Community Growth</h3>
              <p>Get exposure to our audience, build credibility, and grow your community organically</p>
            </div>
          </div>
        </section>

        <section className="about-section burn-benefits-section">
          <h2 className="about-heading">Why the Token Burn Model?</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">💎</div>
              <h3>Commitment & Quality</h3>
              <p>Burning MemeTalk.TV tokens shows you're serious about your project and ensures only quality guests appear</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">📉</div>
              <h3>Makes MemeTalk.TV Token Rarer</h3>
              <p>Every burn permanently reduces MemeTalk.TV token supply, making it more valuable for all holders!</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🎯</div>
              <h3>Fair Access</h3>
              <p>No favoritism or pay-to-win. Every project follows the same rules — burn MemeTalk.TV tokens, get visibility</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🌐</div>
              <h3>Win-Win for Everyone</h3>
              <p>MemeTalk.TV token holders benefit from reduced supply, while you gain massive exposure for your meme project</p>
            </div>
          </div>
        </section>

        <section className="about-section publish-section">
          <h2 className="about-heading">Where We Publish Your Episode</h2>
          <div className="publish-platforms">
            <div className="platform-card">
              <div className="platform-icon">🎥</div>
              <h3>YouTube</h3>
              <p>Full episode uploaded to our growing channel with thousands of crypto enthusiasts</p>
            </div>
            <div className="platform-card">
              <div className="platform-icon">𝕏</div>
              <h3>X (Twitter)</h3>
              <p>Clips, highlights, and promotions shared across our social media networks</p>
            </div>
            <div className="platform-card">
              <div className="platform-icon">🌐</div>
              <h3>MemeTalk.TV</h3>
              <p>Permanent archive on our website for on-demand viewing anytime</p>
            </div>
            <div className="platform-card">
              <div className="platform-icon">📱</div>
              <h3>Social Clips</h3>
              <p>Short-form content distributed to TikTok, Instagram, and other platforms</p>
            </div>
          </div>
        </section>

        <section className="about-section community-section">
          <h2 className="about-heading">Community at the Core</h2>
          <p className="about-text large">
            MemeTalk.TV is 100% community-driven. During every live show, viewers chat in real-time, 
            ask questions, and interact with your project directly. This isn't a scripted interview — 
            it's a real conversation shaped by the people who matter most: your future community members.
          </p>
          <p className="about-text large">
            After the show, episodes are archived and shared everywhere, giving your project lasting exposure 
            and credibility that helps attract new holders and believers.
          </p>
        </section>

        <section className="about-section cta-section">
          <h2>Ready to Give Your Meme a Voice?</h2>
          <p>Book your live interview today and join the memes that have already made their mark</p>
          <a href="/apply" className="cta-button-large">Apply for an Interview</a>
        </section>
      </div>
    </div>
  )
}

export default About


