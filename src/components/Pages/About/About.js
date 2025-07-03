import React from 'react';
import styles from './About.module.css';
import ResumeOverlay from '../../ResumeOverlay';

const About = () => {
  const [resumeOpen, setResumeOpen] = React.useState(false);

  return (
    <div className={styles.pageContainer}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>Hi, I'm Ujjwal</h1>
          <h2 className={styles.heroSubtitle}>Systems Thinker, Builder, and Relentless Experimenter</h2>
          <p className={styles.heroDesc}>
            I build, break, and rebuild systems—across code, teams, and products. From VR platforms to Rust game engines, my journey is about learning in public and sharing the logs.
          </p>
          <button className={styles.resumeButton} onClick={() => setResumeOpen(true)}>
            View Resume
          </button>
        </div>
        <div className={styles.heroArt}>
          {/* You can add a cool SVG, avatar, or abstract art here */}
          <div className={styles.avatarGlow}></div>
        </div>
      </section>
      <ResumeOverlay open={resumeOpen} onClose={() => setResumeOpen(false)} />

      {/* Terminal Block Section */}
      <section className={styles.terminalSection}>
        <pre className={styles.terminalBlock}>
{`$ whoami
  → builder.pm
  → rust.game.engine.dev
  → logs.since('2025')

$ now
  → polishing blog
  → testing Rust render loop
  → writing from Bangalore`}
        </pre>
      </section>

      {/* Now Section */}
      <section className={styles.nowSection}>
        <h2>Currently</h2>
        <ul>
          <li>Writing a game engine in Rust</li>
          <li>Publishing builder logs weekly</li>
          <li>Exploring systems thinking through code and chaos</li>
        </ul>
      </section>

      {/* Skills Section */}
      <section className={styles.skillsSection}>
        <h2>Stack & Domains</h2>
        <div className={styles.skillsGrid}>
          <span>Rust</span>
          <span>React</span>
          <span>VR Systems</span>
          <span>Automation</span>
          <span>Product Management</span>
          <span>Chaos Control</span>
        </div>
      </section>

      {/* Quote Section */}
      <section className={styles.quoteSection}>
        <blockquote className={styles.quote}>
          <q>Don’t optimize systems you don’t understand.</q>
        </blockquote>
      </section>

      {/* Easter Egg */}
      <div className={styles.easterEgg}>
        <code>console.log("👀 Found the logs, huh?")</code>
      </div>
    </div>
  );
};

export default About;
