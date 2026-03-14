import { useState, useEffect } from 'react';
import styles from './JourneyBadge.module.css';
import { FaRust, FaCheck } from "react-icons/fa";
import { IoCopySharp } from "react-icons/io5";
import { SiWebassembly, SiWebgpu, SiGo, SiTypescript } from "react-icons/si";
import EchopointImg from '../../Utils/EchopointImg/EchopointImg';
import { useBackground } from '../../Background/BackgroundContext';

const ECHOPOINT = 'https://echopoint.ujjwalvivek.com';
const repoDescCache = {};

export function useRepoDescription(repo) {
  const [description, setDescription] = useState(repoDescCache[repo] || '');

  useEffect(() => {
    if (repoDescCache[repo]) return;
    fetch(`${ECHOPOINT}/v1/store/github:${repo}:repo`)
      .then(r => r.json())
      .then(data => {
        if (data.description) {
          repoDescCache[repo] = data.description;
          setDescription(data.description);
        }
      })
      .catch(() => { });
  }, [repo]);

  return description;
}

const JourneyBadge = () => {
  const [copiedNpm, setCopiedNpm] = useState(false);
  const [copiedGit, setCopiedGit] = useState(false);
  const [accentHex, setAccentHex] = useState('');
  const [averageHex, setAverageHex] = useState('');
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

  const description = useRepoDescription('journey');

  const techStack = [
    { name: "Tech Stack", icon: 'Stack' },
    { name: "Rust", icon: <FaRust /> },
    { name: "wGPU", icon: <SiWebgpu /> },
    { name: "Golang", icon: <SiGo /> },
    { name: "WebAssembly", icon: <SiWebassembly /> },
    { name: "TypeScript", icon: <SiTypescript /> },
  ];

  return (
    <section className={`${styles.container} ${styles.journeyStatusContainer}`}>
      <span className={styles.border}></span>
      <div className={styles.card}>
        <span className={styles.topGlow} />
        <div className={styles.content}>
          <div className={styles.infoBlock}>
            <div className={styles.titleContainer}>
              <span className={styles.titleText}>Journey Engine</span>
              <span className={styles.phaseWip}>
                <span className={`${styles.spinner} ${noAnim}`}>
                  <span className={styles.phaseLabel}>v2</span>
                </span>
              </span>
            </div>
            <span className={styles.descText}>{description}</span>
            <span className={`${styles.techStack} ${styles.fromJourney}`}>
              {techStack.map((tech) => (
                <span key={tech.name} className={styles.techIcon} title={tech.name}>
                  {tech.icon}
                </span>
              ))}
            </span>

            <div className={styles.telemetryRowPill}>
              <a href="https://journey.ujjwalvivek.com/" target="_blank" rel="noreferrer">
                <EchopointImg src={`${ECHOPOINT}/svg/badges/custom?leftText=Tech+Demo&logo=npm&bg=ffffff00`} alt="Tech Demo" className={styles.badgeImg} fallbackHeight={20} />
              </a>
              <a href="https://journey.ujjwalvivek.com/blog/proj_0004_rust_game_engine.md" target="_blank" rel="noreferrer">
                <EchopointImg src={`${ECHOPOINT}/svg/badges/custom?leftText=Devlog&logo=book&bg=ffffff00`} alt="Devlog" className={styles.badgeImg} fallbackHeight={20} />
              </a>
              <a href="https://www.github.com/ujjwalvivek/journey" target="_blank" rel="noreferrer">
                <EchopointImg src={`${ECHOPOINT}/svg/badges/updated?repo=journey&logo=clock`} alt="Updated" className={styles.badgeImg} fallbackHeight={20} />
              </a>
            </div>
            <div className={styles.activitySection}>
              <span className={styles.sectionTitle}>Recent Releases</span>
              <div className={styles.releaseImgContainer}>
                <EchopointImg src={`${ECHOPOINT}/svg/releases?repo=journey&bg=none&borderWidth=0&limit=2${accentHex ? `&textColor=${accentHex}&accentColor=${averageHex}&lineColor=${accentHex}` : ''}&px=8&py=8`} alt="Recent Releases" width="100%" className={styles.releaseImg} fallbackHeight={90} />
              </div>
            </div>

            <div className={styles.commandSection}>
              <div
                className={styles.commandBox}
                onClick={() => handleCopy("npm i @ujjwalvivek/journey-engine", setCopiedNpm)}
                title="Copy NPM install command"
              >
                <span className={styles.prompt}>$</span>
                <code className={styles.codeText}>npm i @ujjwalvivek/journey-engine</code>
                <span className={styles.copyAction}>{copiedNpm ? <FaCheck className={styles.copyIcon} /> : <IoCopySharp className={styles.copyIcon} />}</span>
              </div>
              <div className={styles.telemetryRowPill}>
                <a href="https://www.npmjs.com/package/@ujjwalvivek/journey-engine" target="_blank" rel="noreferrer">
                  <EchopointImg src={`${ECHOPOINT}/svg/badges/npm?package=journey-engine&leftText=WASM&logo=npm`} alt="WASM version" className={styles.badgeImg} fallbackHeight={20} />
                </a>
                <a href="https://www.npmjs.com/package/@ujjwalvivek/dino-blink" target="_blank" rel="noreferrer">
                  <EchopointImg src={`${ECHOPOINT}/svg/badges/npm?package=dino-blink&leftText=Dino+Blink&logo=npm`} alt="Dino Blink version" className={styles.badgeImg} fallbackHeight={20} />
                </a>
                <a href="https://ujjwalvivek.itch.io/dino-blink" target="_blank" rel="noreferrer">
                  <EchopointImg src={`${ECHOPOINT}/svg/badges/custom?leftText=Dino_Blink&logo=bolt&bg=ffffff00`} alt="Dino Blink" className={styles.badgeImg} fallbackHeight={20} />
                </a>
              </div>
              <div className={styles.commandBox}>
                <span className={styles.prompt}>$</span>
                <code className={styles.codeText}>cargo add journey-engine</code>
                <span className={styles.copyAction}>{copiedNpm ? <FaCheck className={styles.copyIcon} /> : <IoCopySharp className={styles.copyIcon} />}</span>
              </div>
              <div className={styles.telemetryRowPill}>
                <a href="https://crates.io/crates/journey-engine" target="_blank" rel="noreferrer">
                  <EchopointImg src={`${ECHOPOINT}/svg/badges/cargo?crate=journey-engine&logo=rust`} alt="Cargo version" className={styles.badgeImg} fallbackHeight={20} />
                </a>
                <a href="https://docs.journey.ujjwalvivek.com/" target="_blank" rel="noreferrer">
                  <EchopointImg src={`${ECHOPOINT}/svg/badges/docs?logo=book`} alt="Docs" className={styles.badgeImg} fallbackHeight={20} />
                </a>
              </div>
              <div
                className={styles.commandBox}
                onClick={() => handleCopy("git clone https://github.com/ujjwalvivek/journey.git", setCopiedGit)}
                title="Copy git clone command"
              >
                <span className={styles.prompt}>$</span>
                <code className={styles.codeText}>git clone https://github.com/ujjwalvivek/journey.git</code>
                <span className={styles.copyAction}>{copiedGit ? <FaCheck className={styles.copyIcon} /> : <IoCopySharp className={styles.copyIcon} />}</span>
              </div>
              <div className={styles.telemetryRowPill}>
                <a href="https://github.com/ujjwalvivek/journey/releases" target="_blank" rel="noreferrer">
                  <EchopointImg src={`${ECHOPOINT}/svg/badges/release?repo=journey&leftText=Native&logo=windows`} alt="Native release" className={styles.badgeImg} fallbackHeight={20} />
                </a>
                <a href="https://github.com/ujjwalvivek/journey" target="_blank" rel="noreferrer">
                  <EchopointImg src={`${ECHOPOINT}/svg/badges/stars?repo=journey&logo=star`} alt="Stars" className={styles.badgeImg} fallbackHeight={20} />
                </a>
              </div>
            </div>

            <div className={styles.activitySection}>
              <span className={styles.sectionTitle}>Recent Activiti</span>
              <div className={styles.releaseImgContainer}>
                <EchopointImg src={`${ECHOPOINT}/svg/commits?repo=journey&bg=none&borderWidth=0&limit=3${accentHex ? `&textColor=${accentHex}&accentColor=${averageHex}&lineColor=${accentHex}` : ''}&px=8&py=8`} alt="Recent Commits" width="100%" className={styles.releaseImg} fallbackHeight={135} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default JourneyBadge;