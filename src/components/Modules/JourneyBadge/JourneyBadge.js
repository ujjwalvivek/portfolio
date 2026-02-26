import { useState, useEffect } from 'react';
import { SiNpm, SiGithub } from "react-icons/si";
import styles from './JourneyBadge.module.css';
import { FaRust, FaWindows, FaCheck } from "react-icons/fa";
import { IoGameController } from "react-icons/io5";
import { IoCopySharp } from "react-icons/io5";

const JourneyBadge = () => {
  const [version, setVersion] = useState("v...");
  const [stars, setStars] = useState(null);
  const [lastUpdated, setLastUpdated] = useState("Active");
  const [ghRelease, setGhRelease] = useState("v...");
  const [releaseUrl, setReleaseUrl] = useState("https://github.com/ujjwalvivek/journey/releases");
  const [copiedNpm, setCopiedNpm] = useState(false);
  const [copiedGit, setCopiedGit] = useState(false);

  const handleCopy = (text, setCopiedState) => {
    navigator.clipboard.writeText(text);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
  };

  //? Fetch NPM version, GitHub stars, last update time, and latest release on mount
  useEffect(() => {
    const getRelativeTime = (dateString) => {
      const diff = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 0) return "Updated today";
      if (diff === 1) return "Updated yesterday";
      return `Updated ${diff}d ago`;
    };

    fetch('https://registry.npmjs.org/@ujjwalvivek/journey-engine/latest')
      .then((res) => res.json())
      .then((data) => { if (data?.version) setVersion(`v${data.version}`); })
      .catch(() => setVersion("v0.3.2"));

    fetch('https://api.github.com/repos/ujjwalvivek/journey')
      .then((res) => res.json())
      .then((data) => {
        if (data?.stargazers_count !== undefined) setStars(data.stargazers_count);
        if (data?.pushed_at) setLastUpdated(getRelativeTime(data.pushed_at));
      })
      .catch((err) => console.error("GitHub repo fetch failed:", err));

    fetch('https://api.github.com/repos/ujjwalvivek/journey/releases/latest')
      .then((res) => res.json())
      .then((data) => {
        if (data?.tag_name) {
          setGhRelease(data.tag_name);
          if (data?.html_url) setReleaseUrl(data.html_url);
        }
      })
      .catch((err) => console.error("GitHub Release fetch failed:", err));
  }, []);

  return (
    <section className={styles.container}>
      <div className={styles.card}>
        <span className={styles.topGlow} />
        <div className={styles.content}>
          <div className={styles.infoBlock}>

            <div className={styles.titleRow}>
              <FaRust className={styles.iconMain} />
              <span className={styles.titleText}>Journey Engine</span>
              <span className={styles.phaseWip}>
                <svg className={styles.spinner} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className={styles.phaseLabel}>Phase 5</span>
                <span className={styles.badgeWip}>WIP</span>
              </span>
            </div>

            <nav className={styles.telemetryRow}>
              <a href="https://www.npmjs.com/package/@ujjwalvivek/journey-engine" target="_blank" rel="noreferrer" className={`${styles.pill} ${styles.pillNpm}`}>
                <SiNpm className={styles.pillIcon} />
                <span>NPM {version}</span>
              </a>
              <a href={releaseUrl} target="_blank" rel="noreferrer" className={`${styles.pill} ${styles.pillRelease}`}>
                <FaWindows className={styles.pillIcon} />
                <span>Native {ghRelease}</span>
              </a>
              <a href="https://github.com/ujjwalvivek/journey" target="_blank" rel="noreferrer" className={`${styles.pill} ${styles.pillGh}`}>
                <SiGithub className={styles.pillIcon} />
                <span>{stars !== null ? `${stars} Stars` : "Repo"}</span>
              </a>
              <a href="https://journey.ujjwalvivek.com/" target="_blank" rel="noreferrer" className={`${styles.pill} ${styles.pillDemo}`}>
                <IoGameController className={styles.pillIcon} />
                <span>Play Web Build</span>
              </a>
              <span className={`${styles.pill} ${styles.pillTime}`}>
                <span className={styles.pulseDot} />
                <span>{lastUpdated}</span>
              </span>
            </nav>
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
            <div
              className={styles.commandBox}
              onClick={() => handleCopy("git clone https://github.com/ujjwalvivek/journey.git", setCopiedGit)}
              title="Copy git clone command"
            >
              <span className={styles.prompt}>$</span>
              <code className={styles.codeText}>git clone https://github.com/ujjwalvivek/journey.git</code>
              <span className={styles.copyAction}>{copiedGit ? <FaCheck className={styles.copyIcon} /> : <IoCopySharp className={styles.copyIcon} />}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default JourneyBadge;