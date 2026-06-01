import { useState, useEffect } from 'react';
import styles from './JourneyBadge.module.css';
import { FaCheck } from "react-icons/fa";
import { IoCopySharp } from "react-icons/io5";
import { SiTypescript } from "react-icons/si";
import { useRepoDescription } from './JourneyBadge';
import EchopointImg from '../../Utils/EchopointImg/EchopointImg';
import { useBackground } from '../../Background/BackgroundContext';

const ECHOPOINT = 'https://echopoint.ujjwalvivek.com';

const SynclippyBadge = () => {
  const [copiedNpm, setCopiedNpm] = useState(false);
  const [copiedGit, setCopiedGit] = useState(false);
  // const [health, setHealth] = useState(null);
  const [accentHex, setAccentHex] = useState('');
  const [averageHex, setAverageHex] = useState('');

  const description = useRepoDescription('tinyts');

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

  // useEffect(() => {
  //   fetch('https://synclippy.ujjwalvivek.com/healthz')
  //     .then(res => res.ok ? setHealth(true) : setHealth(false))
  //     .catch(() => setHealth(false));
  // }, []);

  const techStack = [
    { name: "Tech Stack", icon: 'Stack' },
    // { name: "Go", icon: <SiGo /> },
    { name: "TypeScript", icon: <SiTypescript /> },
    // { name: "Workers", icon: <SiCloudflareworkers /> },
    // { name: "Cloudflare", icon: <SiCloudflare /> },
  ];

  return (
    <section className={`${styles.container} ${styles.journeyStatusContainer}`}>
      <span className={styles.border}></span>
      <div className={styles.card}>
        <span className={styles.topGlow} />
        <div className={styles.content}>
          <div className={styles.infoBlock}>
            <div className={styles.titleContainer}>
              <span className={styles.titleText}>TinyTS Engine</span>
              {/* {health !== null && (
                <>
                  <span className={`${styles.healthDot} ${health ? styles.ok : styles.error} ${noAnim}`} title={health ? "API Online" : "API Offline"} />
                  <span className={`${styles.healthText} ${health ? styles.ok : styles.error} ${noAnim}`}>{health ? 'Healthy' : 'Offline'}</span>
                </>
              )}*/}
              <span className={styles.phaseWip}>
                <span className={`${styles.spinner} ${noAnim}`}>
                  <span className={styles.phaseLabel}>v1</span>
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
              <a href="https://tinyts.ujjwalvivek.com/examples" target="_blank" rel="noreferrer">
                <EchopointImg src={`${ECHOPOINT}/svg/badges/custom?leftText=Launch+Examples&logo=npm&bg=ffffff00`} alt="Launch Examples" className={styles.badgeImg} fallbackHeight={20} />
              </a>
              <a href="https://www.github.com/ujjwalvivek/tinyts" target="_blank" rel="noreferrer">
                <EchopointImg src={`${ECHOPOINT}/svg/badges/updated?repo=tinyts&logo=clock`} alt="Updated" className={styles.badgeImg} fallbackHeight={20} />
              </a>
            </div>
            <div className={styles.activitySection}>
              <span className={styles.sectionTitle}>Recent Releases</span>
              <div className={styles.releaseImgContainer}>
                <EchopointImg src={`${ECHOPOINT}/svg/releases?repo=tinyts&bg=none&borderWidth=0&limit=2${accentHex ? `&textColor=${accentHex}&accentColor=${averageHex}&lineColor=${accentHex}` : ''}&px=8&py=8`} alt="Recent Releases" width="100%" className={styles.releaseImg} fallbackHeight={90} />
              </div>
            </div>
            <div className={styles.commandSection}>
              <div
                className={styles.commandBox}
                onClick={() => handleCopy("npm i @ujjwalvivek/tinyts", setCopiedNpm)}
                title="Copy Docker Command"
              >
                <span className={styles.prompt}>$</span>
                <code className={styles.codeText}>npm i @ujjwalvivek/tinyts</code>
                <span className={styles.copyAction}>{copiedNpm ? <FaCheck className={styles.copyIcon} /> : <IoCopySharp className={styles.copyIcon} />}</span>
              </div>
              <div className={styles.telemetryRowPill}>
                <a href="https://www.npmjs.com/package/@ujjwalvivek/tinyts" target="_blank" rel="noreferrer">
                  <EchopointImg src={`${ECHOPOINT}/svg/badges/npm?package=tinyts&leftText=Engine&logo=npm`} alt="Engine version" className={styles.badgeImg} fallbackHeight={20} />
                </a>
                <a href="https://tinyts.ujjwalvivek.com/" target="_blank" rel="noreferrer">
                  <EchopointImg src={`${ECHOPOINT}/svg/badges/docs?logo=book`} alt="Docs" className={styles.badgeImg} fallbackHeight={20} />
                </a>
              </div>
              <div
                className={styles.commandBox}
                onClick={() => handleCopy("https://tinyts.ujjwalvivek.com/documents/TUTORIAL", setCopiedGit)}
                title="Copy GHCR Command"
              >
                <span className={styles.prompt}>$</span>
                <code className={styles.codeText}>https://tinyts.ujjwalvivek.com/documents/TUTORIAL</code>
                <span className={styles.copyAction}>{copiedGit ? <FaCheck className={styles.copyIcon} /> : <IoCopySharp className={styles.copyIcon} />}</span>
              </div>
              <div className={styles.telemetryRowPill}>
                <a href="https://tinyts.ujjwalvivek.com" target="_blank" rel="noreferrer">
                  <EchopointImg src={`${ECHOPOINT}/svg/badges/custom?leftText=Engine+API&logo=typescript&bg=ffffff00`} alt="Launch Examples" className={styles.badgeImg} fallbackHeight={20} />
                </a>
                <a href="https://tinyts.ujjwalvivek.com/documents/REFERENCE" target="_blank" rel="noreferrer">
                  <EchopointImg src={`${ECHOPOINT}/svg/badges/custom?leftText=Cheatsheet&logo=docs&bg=ffffff00`} alt="Launch Examples" className={styles.badgeImg} fallbackHeight={20} />
                </a>
              </div>
              <div
                className={styles.commandBox}
                onClick={() => handleCopy("git clone https://github.com/ujjwalvivek/tinyts.git", setCopiedGit)}
                title="Copy git clone command"
              >
                <span className={styles.prompt}>$</span>
                <code className={styles.codeText}>git clone https://github.com/ujjwalvivek/tinyts.git</code>
                <span className={styles.copyAction}>{copiedGit ? <FaCheck className={styles.copyIcon} /> : <IoCopySharp className={styles.copyIcon} />}</span>
              </div>
              <div className={styles.telemetryRowPill}>
                <a href="https://github.com/ujjwalvivek/tinyts" target="_blank" rel="noreferrer">
                  <EchopointImg src={`${ECHOPOINT}/svg/badges/stars?repo=tinyts&logo=star`} alt="Stars" className={styles.badgeImg} fallbackHeight={20} />
                </a>
                <a href="https://github.com/ujjwalvivek/tinyts/releases" target="_blank" rel="noreferrer">
                  <EchopointImg src={`${ECHOPOINT}/svg/badges/release?repo=tinyts&leftText=Binaries&logo=windows`} alt="Binaries release" className={styles.badgeImg} fallbackHeight={20} />
                </a>
              </div>
            </div>
            <div className={styles.activitySection}>
              <span className={styles.sectionTitle}>Recent Activiti</span>
              <div className={styles.releaseImgContainer}>
                <EchopointImg src={`${ECHOPOINT}/svg/commits?repo=tinyts&bg=none&borderWidth=0&limit=3${accentHex ? `&textColor=${accentHex}&accentColor=${averageHex}&lineColor=${accentHex}` : ''}&px=8&py=8&limit=3`} alt="Recent Commits" width="100%" className={styles.releaseImg} fallbackHeight={135} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section >
  );
};

export default SynclippyBadge;