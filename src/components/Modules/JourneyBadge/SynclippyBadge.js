import { useState, useEffect } from 'react';
import styles from './JourneyBadge.module.css';
import { FaCheck } from "react-icons/fa";
import { IoCopySharp } from "react-icons/io5";
import { SiGo, SiTypescript, SiCloudflareworkers, SiCloudflare } from "react-icons/si";
import { useRepoDescription } from './JourneyBadge';
import EchopointImg from '../../Utils/EchopointImg/EchopointImg';
import { useBackground } from '../../Background/BackgroundContext';

const ECHOPOINT = 'https://echopoint.ujjwalvivek.com';

const SynclippyBadge = () => {
  const [copiedNpm, setCopiedNpm] = useState(false);
  const [copiedGit, setCopiedGit] = useState(false);
  const [health, setHealth] = useState(null);
  const [accentHex, setAccentHex] = useState('');
  const [averageHex, setAverageHex] = useState('');

  const description = useRepoDescription('synclippy');

  const { backgroundConfig } = useBackground();

  const noAnim = backgroundConfig.type !== 'none' ? '' : styles.noanimated;

  useEffect(() => {
    const readAccent = () => {
      const root = getComputedStyle(document.documentElement);
      const d = root.getPropertyValue('--dynamic-dominant-color').trim();
      const a = root.getPropertyValue('--dynamic-hsl-average').trim();
      setAccentHex(d.replace(/^#/, ''));
      setAverageHex(a.replace(/^#/, ''));
    };
    readAccent();
    const observer = new MutationObserver(readAccent);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, []);

  const handleCopy = (text, setCopiedState) => {
    navigator.clipboard.writeText(text);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
  };

  useEffect(() => {
    fetch('https://synclippy.ujjwalvivek.com/healthz')
      .then(res => res.ok ? setHealth(true) : setHealth(false))
      .catch(() => setHealth(false));
  }, []);

  const techStack = [
    { name: "Tech Stack", icon: 'Stack' },
    { name: "Go", icon: <SiGo /> },
    { name: "TypeScript", icon: <SiTypescript /> },
    { name: "Workers", icon: <SiCloudflareworkers /> },
    { name: "Cloudflare", icon: <SiCloudflare /> },
  ];

  return (
    <section className={`${styles.container} ${styles.journeyStatusContainer}`}>
      <span className={styles.border}></span>
      <div className={styles.card}>
        <span className={styles.topGlow} />
        <div className={styles.content}>
          <div className={styles.infoBlock}>
            <div className={styles.titleContainer}>
              <span className={styles.titleText}>Synclippy</span>
              {health !== null && (
                <>
                  <span className={`${styles.healthDot} ${health ? styles.ok : styles.error} ${noAnim}`} title={health ? "API Online" : "API Offline"} />
                  <span className={`${styles.healthText} ${health ? styles.ok : styles.error} ${noAnim}`}>{health ? 'Healthy' : 'Offline'}</span>
                </>
              )}
              <span className={styles.phaseWip}>
                <span className={`${styles.spinner} ${noAnim}`}>
                  <span className={styles.phaseLabel}>v2</span>
                </span>
              </span>
            </div>

            <span className={styles.descText}>{description}</span>
            <span className={`${styles.techStack} ${styles.fromSynclippy}`}>
              {techStack.map((tech) => (
                <span key={tech.name} className={styles.techIcon} title={tech.name}>
                  {tech.icon}
                </span>
              ))}
            </span>
            <div className={styles.telemetryRowPill}>
              <a href="https://synclippy.ujjwalvviek.com" target="_blank" rel="noreferrer">
                <EchopointImg src={`${ECHOPOINT}/svg/badges/custom?leftText=Launch+Synclippy&logo=npm&bg=ffffff00`} alt="Launch Synclippy" className={styles.badgeImg} fallbackHeight={20} />
              </a>
              <a href="https://journey.ujjwalvivek.com/blog/log_0006_simpleclippy.md" target="_blank" rel="noreferrer">
                <EchopointImg src={`${ECHOPOINT}/svg/badges/custom?leftText=Devlog&logo=book&bg=ffffff00`} alt="Devlog" className={styles.badgeImg} fallbackHeight={20} />
              </a>
              <a href="https://www.github.com/ujjwalvivek/synclippy" target="_blank" rel="noreferrer">
                <EchopointImg src={`${ECHOPOINT}/svg/badges/updated?repo=synclippy&logo=clock`} alt="Updated" className={styles.badgeImg} fallbackHeight={20} />
              </a>
            </div>
            {/* <img src={`${ECHOPOINT}/svg/langs?repo=synclippy&bg=none&bar=0${accentHex ? `&border=${accentHex}&textColor=${accentHex}` : ''}&borderWidth=1&limit=5`} alt="Languages" width="100%" className={styles.languageStats} /> */}
            <div className={styles.activitySection}>
              <span className={styles.sectionTitle}>Recent Releases</span>
              <div className={styles.releaseImgContainer}>
                <EchopointImg src={`${ECHOPOINT}/svg/releases?repo=synclippy&bg=none&borderWidth=0&limit=2${accentHex ? `&textColor=${accentHex}&accentColor=${averageHex}&lineColor=${accentHex}` : ''}&px=8&py=8`} alt="Recent Releases" width="100%" className={styles.releaseImg} fallbackHeight={90} />
              </div>
            </div>
            <div className={styles.commandSection}>
              <div
                className={styles.commandBox}
                onClick={() => handleCopy("docker pull ujjwalvivek/synclippy:latest", setCopiedNpm)}
                title="Copy Docker Command"
              >
                <span className={styles.prompt}>$</span>
                <code className={styles.codeText}>docker pull ujjwalvivek/synclippy:latest</code>
                <span className={styles.copyAction}>{copiedNpm ? <FaCheck className={styles.copyIcon} /> : <IoCopySharp className={styles.copyIcon} />}</span>
              </div>
              <div className={styles.telemetryRowPill}>
                <a href="https://hub.docker.com/r/ujjwalvivek/synclippy" target="_blank" rel="noreferrer">
                  <EchopointImg src={`${ECHOPOINT}/svg/badges/docker?image=synclippy&logo=docker`} alt="Docker version" className={styles.badgeImg} fallbackHeight={20} />
                </a>
              </div>
              <div
                className={styles.commandBox}
                onClick={() => handleCopy("https://ghcr.io/ujjwalvivek/synclippy:latest", setCopiedGit)}
                title="Copy GHCR Command"
              >
                <span className={styles.prompt}>$</span>
                <code className={styles.codeText}>https://ghcr.io/ujjwalvivek/synclippy:latest</code>
                <span className={styles.copyAction}>{copiedGit ? <FaCheck className={styles.copyIcon} /> : <IoCopySharp className={styles.copyIcon} />}</span>
              </div>
              <div className={styles.telemetryRowPill}>
                <a href="https://github.com/ujjwalvivek/synclippy/pkgs/container/synclippy" target="_blank" rel="noreferrer">
                  <EchopointImg src={`${ECHOPOINT}/svg/badges/ghcr?repo=synclippy&logo=github`} alt="GHCR version" className={styles.badgeImg} fallbackHeight={20} />
                </a>
              </div>
              <div
                className={styles.commandBox}
                onClick={() => handleCopy("git clone https://github.com/ujjwalvivek/synclippy.git", setCopiedGit)}
                title="Copy git clone command"
              >
                <span className={styles.prompt}>$</span>
                <code className={styles.codeText}>git clone https://github.com/ujjwalvivek/synclippy.git</code>
                <span className={styles.copyAction}>{copiedGit ? <FaCheck className={styles.copyIcon} /> : <IoCopySharp className={styles.copyIcon} />}</span>
              </div>
              <div className={styles.telemetryRowPill}>
                <a href="https://github.com/ujjwalvivek/synclippy/blob/b159f7f9a901178c22bbb7cfa452cef4ecd92129/docs/API.md" target="_blank" rel="noreferrer">
                  <EchopointImg src={`${ECHOPOINT}/svg/badges/docs?logo=book`} alt="Docs" className={styles.badgeImg} fallbackHeight={20} />
                </a>
                <a href="https://github.com/ujjwalvivek/synclippy" target="_blank" rel="noreferrer">
                  <EchopointImg src={`${ECHOPOINT}/svg/badges/stars?repo=synclippy&logo=star`} alt="Stars" className={styles.badgeImg} fallbackHeight={20} />
                </a>

                <a href="https://github.com/ujjwalvivek/synclippy/releases" target="_blank" rel="noreferrer">
                  <EchopointImg src={`${ECHOPOINT}/svg/badges/release?repo=synclippy&leftText=Binaries&logo=windows`} alt="Binaries release" className={styles.badgeImg} fallbackHeight={20} />
                </a>
              </div>
            </div>
            <div className={styles.activitySection}>
              <span className={styles.sectionTitle}>Recent Activiti</span>
              <div className={styles.releaseImgContainer}>
                <EchopointImg src={`${ECHOPOINT}/svg/commits?repo=synclippy&bg=none&borderWidth=0&limit=3${accentHex ? `&textColor=${accentHex}&accentColor=${averageHex}&lineColor=${accentHex}` : ''}&px=8&py=8&limit=3`} alt="Recent Commits" width="100%" className={styles.releaseImg} fallbackHeight={135} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section >
  );
};

export default SynclippyBadge;