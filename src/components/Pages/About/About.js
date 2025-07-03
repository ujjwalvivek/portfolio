import React from 'react';
import styles from './About.module.css';
import ResumeOverlay from '../../ResumeOverlay';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ThemeContext } from '../../ThemeSwitcher/ThemeContext';

const terminalText = `$ whoami
  → builder.pm
  → rust.game.engine.dev
  → logs.since('2025')

$ boot --system
  [✓] loading core modules: code, teams, products
  [✓] initializing logs/public
  [✓] unlocking experimental mode

# I build, break, and rebuild systems — across code, teams, and products.
# From VR platforms to Rust game engines, this journey is logged in public.

$ history --roles
  → PM, but always thought like a systems engineer
  → shipped MVPs
  → built VR platforms
  → automated ops pipelines
  → currently writing a Rust-powered game engine (that may blow up this site)

$ logs --incidents
  [!] fired 3 times — not for underperforming, but for not staying quiet
  [✓] still asking the hard questions
  [✓] still building
  [✓] still believing in work that matters

$ tail -f logs.txt
  → edge cases, broken builds
  → chaos into clarity
  → systems that might hold together

$ now
  → polishing blog
  → testing Rust render loop
  → writing from Bangalore
  
  $ echo "Welcome to my builder's log. Let's break some systems together."
  
  I build, break, and rebuild systems—across code, teams, and products.
  From VR platforms to Rust game engines, my journey is about learning
  in public and sharing the logs.
              
  I've worked as a PM, but I've always thought like a systems engineer.
  I've shipped MVPs, built VR platforms, automated ops pipelines, and now I'm writing my own Rust-powered game engine (that may or may not blow up this site).
  I've been fired three times—not for underperforming, but for not staying quiet. I still ask hard questions. I still build. And I still believe in working on things that matter.
  This space is where I share logs from the edge, experiments that break, and systems that might hold together.`;

const About = () => {
  const [resumeOpen, setResumeOpen] = React.useState(false);
  const [typedText, setTypedText] = React.useState('');

  React.useEffect(() => {
    let i = 0;
    setTypedText('');
    const interval = setInterval(() => {
      setTypedText(terminalText.slice(0, i + 1));
      i++;
      if (i === terminalText.length) {
        clearInterval(interval);
      }
    }, 24);
    return () => clearInterval(interval);
  }, []);

  const {darkMode} = React.useContext(ThemeContext);
  const theme = darkMode ? 'dark' : 'light';

  return (
    <>
      <ResumeOverlay open={resumeOpen} onClose={() => setResumeOpen(false)} />
      <div className={styles.pageContainer}>
        {/* Hero Section */}
        <section className={styles.heroSection}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>Hi there! I'm Vivek</h1>
            <p className={styles.heroSubtitle}>
              Systems Thinker, Builder, and Relentless Experimenter
            </p>
            <div className={styles.heroArt}>
              <img
                src="/profile.jpg"
                alt="Vivek's avatar"
                className={styles.avatarImg}
              />
            </div>
          </div>
        </section>

        {/* Terminal Section */}
        <section className={styles.terminalSection}>
          <pre className={styles.terminalBlock}>
            <SyntaxHighlighter
            language="bash"
            style={theme === 'dark' ? atomDark : oneLight}
            wrapLongLines
            customStyle={{ background: 'none', margin: 0, padding: 0 }}
            codeTagProps={{ style: { background: 'none' } }}
          >
            {typedText}
          </SyntaxHighlighter>
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

        {/* Resume Button */}
        <button
          className={styles.resumeButton}
          onClick={() => setResumeOpen(true)}
        >
          View Resume
        </button>
      </div>
    </>
  );
};

export default About;
