import { useRef } from 'react';
import styles from './About.module.css';
import EasterEgg from '../../Modules/EasterEgg/EasterEgg';
import InteractiveIntroText from '../../Modules/IntroText/IntroText';
import RecentProjects from '../../Modules/RecentProjects/RecentProjects';
import ResumeBar from '../../Modules/ResumeViewer/ResumeBar';
import { useBackground } from '../../Background/BackgroundContext';


const About = () => {
  const resumeBarRef = useRef(null);
  const { backgroundConfig } = useBackground();
  const noAnim = backgroundConfig.type !== 'none' ? '' : styles.noanimated;

  return (
    <div className={styles.pageContainer}>
      <section className={styles.heroSection}>
        <div className={`${styles.heroArt} ${noAnim}`}>
          <img
            src="https://cdn.ujjwalvivek.com/images/profile.webp"
            alt=""
            className={styles.avatarImg}
          />
          <div className={styles.heroCaption} aria-hidden="false">hi there! i'm Vivek. i think in systems & experiment relentlessly.</div>
        </div>
      </section>
      <section className={styles.terminalSection}>
        <div className={`${styles.devSpidey} ${noAnim}`} title='Codepen by Suzanne Aitchison'>
          <div className={styles.boxCanvas}>
            <div className={styles.inner}>
              <div className={styles.circle}></div>
              <div className={styles.circle}></div>
              <div className={styles.circle}></div>
              <div className={styles.circle}></div>
              <div className={styles.circle}></div>
              <div className={styles.circle}></div>
            </div>
            <div className={styles.line}></div>
            <div className={styles.line}></div>
            <div className={styles.line}></div>
            <div className={styles.spider}>
              <div className={styles.body}>
                <div className={`${styles.leg} ${styles.left}`}></div>
                <div className={`${styles.leg} ${styles.right}`}></div>
              </div>
            </div>
          </div >
        </div>
        <InteractiveIntroText />
        <span className={styles.border}></span>
      </section>
      <section className={styles.recentContainer}><RecentProjects /></section>
      <section ref={resumeBarRef} className={`${styles.resumeBar} ${noAnim}`}><ResumeBar /></section>
      <div className={styles.easterEggLink}><EasterEgg /></div>
    </div>
  );
};

export default About;
