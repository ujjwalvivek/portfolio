import React, { useState, useRef } from 'react';
import styles from './About.module.css';
import ResumeOverlay from '../../ResumeOverlay';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ThemeContext } from '../../ThemeSwitcher/ThemeContext';
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core';
import {
  FaReact, FaMarkdown, FaConfluence, FaJira, FaGit, FaUnity, FaNodeJs
} from 'react-icons/fa';
import {
  SiRust, SiWgpu, SiMixpanel, SiUnrealengine, SiLinear
} from 'react-icons/si';
import {
  LuFigma
} from 'react-icons/lu';
import {
  IoLogoFirebase
} from 'react-icons/io5';
import {
  TbSql
} from 'react-icons/tb';
import matter from 'gray-matter';

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
  const [latestPosts, setLatestPosts] = React.useState([]);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

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

  React.useEffect(() => {
    const fetchPosts = async () => {
      const postFiles = ['dark-net.md', 'fourth-post.md', 'third-post.md', 'comprehensive-test-post.md'];
      const postsData = await Promise.all(
        postFiles.map(async (file) => {
          const response = await fetch(`/posts/${file}`);
          const text = await response.text();
          const { data } = matter(text);
          return {
            slug: data.slug,
            title: data.title,
            date: data.date,
            filename: file,
          };
        })
      );
      postsData.sort((a, b) => new Date(b.date) - new Date(a.date));
      setLatestPosts(postsData.slice(0, 4));
    };
    fetchPosts();
  }, []);

  const terminalRef = useRef(null);

  React.useEffect(() => {
    if (showTerminal && terminalRef.current) {
      terminalRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [showTerminal]);

  const { darkMode } = React.useContext(ThemeContext);
  const theme = darkMode ? 'dark' : 'light';
  const pdfTheme = darkMode ? 'dark' : 'light';

  const [easterEggText, setEasterEggText] = useState("Ħəʏʏʏ þššʈ‼ Ŧøʉɴɗ ʈʜɛ ɭɸɠş, ɧħųʜ‽⸘");

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

        {/* Skills + Status Side by Side */}
        <div className={styles.skillsStatusRow}>
          {/* Skills Section */}
          <section className={styles.skillsSection}>
            <h2>Tech Stack</h2>
            <div className={styles.skillsGridIcons}>
              <div className={styles.skillItem} title="Rust">
                <SiRust size={36} opacity={0.8} className={styles.frostedIcon} />
              </div>
              <div className={styles.skillItem} title="Rust">
                <SiWgpu size={36} opacity={0.8} className={styles.frostedIcon} />
              </div>
              <div className={styles.skillItem} title="Rust">
                <FaMarkdown size={36} opacity={0.8} className={styles.frostedIcon} />
              </div>
              <div className={styles.skillItem} title="Rust">
                <FaConfluence size={36} opacity={0.8} className={styles.frostedIcon} />
              </div>
              <div className={styles.skillItem} title="Rust">
                <FaJira size={36} opacity={0.8} className={styles.frostedIcon} />
              </div>
              <div className={styles.skillItem} title="Rust">
                <SiMixpanel size={36} opacity={0.8} className={styles.frostedIcon} />
              </div>
              <div className={styles.skillItem} title="Rust">
                <FaGit size={36} opacity={0.8} className={styles.frostedIcon} />
              </div>
              <div className={styles.skillItem} title="Rust">
                <FaUnity size={36} opacity={0.8} className={styles.frostedIcon} />
              </div>
              <div className={styles.skillItem} title="Rust">
                <SiUnrealengine size={36} opacity={0.8} className={styles.frostedIcon} />
              </div>
              <div className={styles.skillItem} title="Rust">
                <SiLinear size={36} opacity={0.8} className={styles.frostedIcon} />
              </div>
              <div className={styles.skillItem} title="React">
                <FaReact size={36} opacity={0.8} className={styles.frostedIcon} />
              </div>
              <div className={styles.skillItem} title="Automation">
                <LuFigma size={36} opacity={0.8} className={styles.frostedIcon} />
              </div>
              <div className={styles.skillItem} title="Product Management">
                <IoLogoFirebase size={36} opacity={0.8} className={styles.frostedIcon} />
              </div>
              <div className={styles.skillItem} title="Chaos Control">
                <TbSql size={36} opacity={0.8} className={styles.frostedIcon} />
              </div>
              <div className={styles.skillItem} title="Chaos Control">
                <FaNodeJs size={36} opacity={0.8} className={styles.frostedIcon} />
              </div>
            </div>
          </section>

          {/* Build Status Console */}
          <section className={styles.statusConsoleSection}>
            <div className={styles.statusConsoleTitle}># /status</div>
            <div className={styles.statusConsoleBlock}>
              <div style={{ display: 'flex', flexDirection: 'row', gap: '5rem' }}>
                <span className={styles.statusService}>rust.game.engine</span>
                <span className={styles.statusWarn + ' ' + styles.flicker}>△ wip</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'row', gap: '6rem' }}>
                <span className={styles.statusService}>blog.pipeline</span>
                <span className={styles.statusOk + ' ' + styles.flicker}>✓ active</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'row', gap: '5.8rem' }}>
                <span className={styles.statusService}>curiosity.chaos</span>
                <span className={styles.statusWarn + ' ' + styles.blink}>! unstable</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'row', gap: '6rem' }}>
                <span className={styles.statusService}>ram.usage</span>
                <span className={styles.statusRam + ' ' + styles.scrollText}>98%</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'row', gap: '6rem' }}>
                <span className={styles.statusService}>motivation.core</span>
                <span className={styles.statusOk + ' ' + styles.flicker}>rebooted hourly</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'row', gap: '6.3rem' }}>
                <span className={styles.statusService}>uptime</span>
                <span className={styles.statusUptime}><UptimeCounter startDate={new Date('2025-07-01T00:00:00Z')} /></span>
              </div>
              <br />
              <div style={{ display: 'flex', flexDirection: 'row', gap: '6.3rem' }}>
                <span className={styles.statusService} style={{ fontStyle: 'italic', opacity: 0.8 }}>"Don't optimize systems you don't really understand." - ofc me :)</span>
              </div>
            </div>
          </section>
        </div>

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
              {/* {typedText} */}
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
                  {latestPosts.map((post) => {
                    const maxLen = 64;
                    const shortTitle = post.title && post.title.length > maxLen
                      ? post.title.slice(0, maxLen) + '...'
                      : post.title;
                    return (
                      <li key={post.slug}>
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
        <div className={styles.easterEgg}>
          <span className={styles.easterEggIcon + ' ' + styles.blink}
            onClick={() => {
              if (!showTerminal) setShowTerminal(true);
              setEasterEggText("Ąɬɱøşţ ʈħəʀɾɛ ⁑‣⟭");
            }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseMove={e => setTooltipPos({ x: e.clientX, y: e.clientY })}
            onMouseLeave={() => setShowTooltip(false)}
            style={{ cursor: showTerminal ? 'wait' : 'help' }}
          >{easterEggText}</span>
          {showTooltip && (
            <span
              className={styles.easterEggTooltip}
              style={{
                position: 'fixed',
                left: tooltipPos.x + 8,
                top: tooltipPos.y + 8,
                zIndex: 9999,
                pointerEvents: 'none'
              }}
            >
              {showTerminal ? "NO!" : "Click me :)"}
            </span>
          )}
        </div>

        {/* Terminal Footer with Hidden Console Easter Egg */}
        {showTerminal && (
          <div ref={terminalRef}>
            <TerminalFooter />
          </div>
        )}
      </div>
    </>
  );
};

export default About;

function TerminalFooter() {
  const [input, setInput] = React.useState("");
  const [crashed, setCrashed] = React.useState(false);
  const [history, setHistory] = React.useState([
    { type: 'output', text: 'welcome to the builder terminal' }
  ]);
  const [historyIndex, setHistoryIndex] = React.useState(-1);
  const inputRef = React.useRef(null);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (crashed) {
      // eslint-disable-next-line no-console
      console.log(
        "👀 Welcome curious dev. You found the logs under the logs. Just refresh the page and it should restart."
      );
    }
  }, [crashed]);

  React.useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [crashed]);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleCommand = (cmd) => {
    if (cmd.trim().toLowerCase() === "run exit") {
      setCrashed(true);
      return;
    }
    let output = '';
    if (cmd.trim() === "help") {
      output = 'Available commands: help, whoami, clear, run exit';
    } else if (cmd.trim() === "whoami") {
      output = 'hello@ujjwalvivek.com';
    } else if (cmd.trim() === "clear") {
      setHistory([]);
      return;
    } else if (cmd.trim() === "") {
      output = '';
    } else {
      output = `command not found: ${cmd}`;
    }
    setHistory((h) => [...h, { type: 'input', text: cmd }, { type: 'output', text: output }]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleCommand(input);
      setInput("");
      setHistoryIndex(-1);
    } else if (e.key === "ArrowUp") {
      // Navigate command history
      const cmds = history.filter(h => h.type === 'input').map(h => h.text);
      if (cmds.length === 0) return;
      const idx = historyIndex === -1 ? cmds.length - 1 : Math.max(0, historyIndex - 1);
      setInput(cmds[idx] || "");
      setHistoryIndex(idx);
    } else if (e.key === "ArrowDown") {
      const cmds = history.filter(h => h.type === 'input').map(h => h.text);
      if (cmds.length === 0) return;
      const idx = historyIndex === -1 ? cmds.length - 1 : Math.min(cmds.length - 1, historyIndex + 1);
      setInput(cmds[idx] || "");
      setHistoryIndex(idx);
    }
  };

  if (crashed) {
  return (
    <div className={styles.crashOverlay}>
      <div className={styles.crashWindow}>
        <div className={styles.crashWindowBar}>
          <span className={styles.crashDot} style={{ background: '#ff5f56' }} />
          <span className={styles.crashDot} style={{ background: '#ffbd2e' }} />
          <span className={styles.crashDot} style={{ background: '#27c93f' }} />
          <span className={styles.crashTitle}>System Error</span>
        </div>
        <div className={styles.crashWindowContent}>
          <div className={styles.crashIcon}>💥</div>
          <div className={styles.crashTextMain}>Session Crashed</div>
          <div className={styles.crashTextSub}>logs flushed. session saved.</div>
          <div className={styles.crashTextSub}>ujjwalvivek.com ∙ no trackers ∙ logs since 2025</div>
          <div className={styles.crashTip}>[ tip: open your dev console 👀 ]</div>
          <button className={styles.restartButton} onClick={() => window.location.reload()}>Restart</button>
        </div>
      </div>
    </div>
  );
}

  return (
    <div className={styles.terminalFooterReal} onClick={() => inputRef.current && inputRef.current.focus()}>
      <div className={styles.terminalFooterWindowBar}>
        <span className={styles.terminalDot} style={{ background: '#ff5f56' }} />
        <span className={styles.terminalDot} style={{ background: '#ffbd2e' }} />
        <span className={styles.terminalDot} style={{ background: '#27c93f' }} />
      </div>
      <div className={styles.terminalFooterScroll} ref={scrollRef}>
        {history.map((item, i) => (
          <div key={i} className={item.type === 'input' ? styles.terminalInputLine : styles.terminalOutputLine}>
            {item.type === 'input' ? (
              <>
                <span className={styles.terminalPromptReal}>&gt; </span>
                <span>{item.text}</span>
              </>
            ) : (
              <span>{item.text}</span>
            )}
          </div>
        ))}
        <div className={styles.terminalInputLine}>
          <span className={styles.terminalPromptReal + ' ' + styles.flicker}>&gt; </span>
          <input
            ref={inputRef}
            className={styles.terminalInputReal + ' ' + styles.flicker}
            type="text"
            value={input}
            placeholder="Type a command..."
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}

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
