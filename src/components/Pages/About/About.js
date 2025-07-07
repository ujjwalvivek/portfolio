import React, { useEffect } from 'react';
import styles from './About.module.css';
import ResumeOverlay from '../../ResumeViewer/ResumeOverlay';
import SyntaxHighlighter from 'react-syntax-highlighter';
import EasterEgg from '../../EasterEgg/EasterEgg';
import terminalText from './IntroText';
import { ThemeContext } from '../../ThemeSwitcher/ThemeContext';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { FaMarkdown, FaConfluence, FaJira, FaGit, FaUnity, FaNodeJs } from 'react-icons/fa';
import { SiRust, SiWgpu, SiMixpanel, SiUnrealengine, SiLinear } from 'react-icons/si';
import { LuFigma } from 'react-icons/lu';
import { IoLogoFirebase } from 'react-icons/io5';
import { TbSql } from 'react-icons/tb';
import { IoLogoJavascript } from "react-icons/io";
import profileImg from '../../../assets/images/profile.jpg';

const About = () => {
  const [resumeOpen, setResumeOpen] = React.useState(false);
  const [typedText, setTypedText] = React.useState('');
  const [latestPosts, setLatestPosts] = React.useState([]);
  const { darkMode } = React.useContext(ThemeContext);
  const theme = darkMode ? 'dark' : 'light';
  const pdfTheme = darkMode ? 'dark' : 'light';

  const icons = [
  { title: "Rust", icon: <SiRust size={36} opacity={0.8} /> },
  { title: "wGPU", icon: <SiWgpu size={36} opacity={0.8} /> },
  { title: "Markdown", icon: <FaMarkdown size={36} opacity={0.8} /> },
  { title: "Confluence", icon: <FaConfluence size={36} opacity={0.8} /> },
  { title: "Jira", icon: <FaJira size={36} opacity={0.8} /> },
  { title: "Mixpanel", icon: <SiMixpanel size={36} opacity={0.8} /> },
  { title: "Git", icon: <FaGit size={36} opacity={0.8} /> },
  { title: "Unity", icon: <FaUnity size={36} opacity={0.8} /> },
  { title: "Unreal Engine", icon: <SiUnrealengine size={36} opacity={0.8} /> },
  { title: "Linear", icon: <SiLinear size={36} opacity={0.8} /> },
  { title: "JavaScript", icon: <IoLogoJavascript size={36} opacity={0.8} /> },
  { title: "Figma", icon: <LuFigma size={36} opacity={0.8} /> },
  { title: "Firebase", icon: <IoLogoFirebase size={36} opacity={0.8} /> },
  { title: "SQL", icon: <TbSql size={36} opacity={0.8} /> },
  { title: "NodeJs", icon: <FaNodeJs size={36} opacity={0.8} /> },
];

const statusRows = [
  {
    service: "rust.game.engine",
    value: "△ wip",
    valueClass: "statusWarn flicker",
    gap: "5rem"
  },
  {
    service: "blog.pipeline",
    value: "✓ active",
    valueClass: "statusOk flicker",
    gap: "6rem"
  },
  {
    service: "curiosity.chaos",
    value: "! unstable",
    valueClass: "statusWarn blink",
    gap: "5.8rem"
  },
  {
    service: "ram.usage",
    value: "98%",
    valueClass: "statusRam scrollText",
    gap: "6rem"
  },
  {
    service: "motivation.core",
    value: "rebooted hourly",
    valueClass: "statusOk flicker",
    gap: "6rem"
  },
  {
    service: "uptime",
    value: <UptimeCounter startDate={new Date('2023-02-04T00:00:00Z')} />,
    valueClass: "statusUptime",
    gap: "6.3rem"
  }
];

  React.useEffect(() => {
    let i = 0;
    setTypedText('');
    const interval = setInterval(() => {
      setTypedText(terminalText.slice(0, i + 1));
      i++;
      if (i === terminalText.length) {
        clearInterval(interval);
      }
    }, 5);
    return () => clearInterval(interval);
  }, []);

// Fetch posts on mount
    useEffect(() => {
        const fetchPosts = async () => {
            const response = await fetch('/posts/meta.json');
            const postsData = await response.json();
            // Sort posts by date, newest first
            postsData.sort((a, b) => new Date(b.date) - new Date(a.date));
            setLatestPosts(postsData.slice(0, 4)); // Only show 4 latest
        };

        fetchPosts();
    }, []);

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
                src={profileImg}
                alt="Vivek's avatar"
                className={styles.avatarImg}
              />
            </div>
          </div>
        </section>

        {/* Skills + Status Side by Side */}
        <div className={styles.skillsStatusRow}>
          {/* Skills Section */}
          <section className={styles.skillsSection}>
            <h2 className={styles.spicyHeading}>
  tech stack; failures until they aren't 
</h2>
            <p></p>
            <div className={styles.skillsGridIcons}>
              {icons.map(({ title, icon }) => (
                <div className={styles.skillItem} title={title} key={title}>
                  {icon}
                </div>
              ))}
            </div>
          </section>

          {/* Build Status Console */}
          <section className={styles.statusConsoleSection}>
            <div className={styles.statusConsoleTitle}># /status</div>
            <div className={styles.statusConsoleBlock}>
              {statusRows.map(({ service, value, valueClass, gap }, i) => (
                <div
                  key={service}
                  style={{ display: 'flex', flexDirection: 'row', gap }}
                >
                  <span className={styles.statusService}>{service}</span>
                  <span className={valueClass.split(' ').map(cls => styles[cls]).join(' ')}>
                    {value}
                  </span>
                </div>
              ))}
              <br />
              <div style={{ display: 'flex', flexDirection: 'row', gap: '6.3rem' }}>
                <span
                  className={styles.statusService}
                  style={{ fontStyle: 'italic', opacity: 0.8 }}
                >
                  "Don't optimize systems you don't really understand." - ofc me :)
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Intro Section */}
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

        {/* Recent Logs and Resume Viewer */}
        <section className={styles.quickJumpSection}>
          <div className={styles.quickJumpRow}>

            {/* Recent Logs */}
            <div className={styles.recentLogsBox}>
              <h2>My Recent Musings</h2>
              <div className={styles.blogList}>
                <ul>
                  {latestPosts.map((post, idx) => {
                    const maxLen = 64;
                    const shortTitle = post.title && post.title.length > maxLen
                      ? post.title.slice(0, maxLen) + '...'
                      : post.title;
                    // Use a composite key or fallback to index
                    const key = post.slug ? `${post.slug}-${post.filename}` : idx;
                    return (
                      <li key={key}>
                        <a href={`/blog/${post.filename}`}>
                          <span className={styles.postDate}>
                            [{post.date ? new Date(post.date).toLocaleDateString('en-GB', { month: '2-digit', day: '2-digit' }) : ''}]
                          </span>
                          <span className={styles.postTitle}>
                            {shortTitle}
                          </span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {/* Resume Viewer */}
            <div className={styles.resumeViewerBox}>
              <div className={styles.resumeViewerOverlay} onClick={() => setResumeOpen(true)}>
                <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
                  <Viewer
                    theme={pdfTheme}
                    fileUrl={pdfTheme === 'dark' ? '/resume-dark.pdf' : '/resume-light.pdf'}
                    defaultScale={SpecialZoomLevel.PageWidth}
                    open={true}
                    className={styles.resumeIframe}
                  />
                </Worker>
                <div className={styles.resumeHoverOverlay}>
                  <span>View Resume</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Easter Egg */}
        <EasterEgg />
      </div>
    </>
  );
};

export default About;

function UptimeCounter({ startDate }) {
  const [uptime, setUptime] = React.useState("");

  React.useEffect(() => {
    function update() {
      const now = new Date();
      const diff = now - startDate;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setUptime(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startDate]);

  return <span>{uptime}</span>;
}