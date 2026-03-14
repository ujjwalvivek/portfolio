import { useRef } from 'react';
import styles from './About.module.css';
import EasterEgg from '../../Modules/EasterEgg/EasterEgg';
import InteractiveIntroText from '../../Modules/IntroText/IntroText';
import RecentProjects from '../../Modules/RecentProjects/RecentProjects';
import ResumeBar from '../../Modules/ResumeViewer/ResumeBar';
import { useBackground } from '../../Background/BackgroundContext';
import JourneyBadge from '../../Modules/JourneyBadge/JourneyBadge';
import SynclippyBadge from '../../Modules/JourneyBadge/SynclippyBadge';
import LangsBar from '../../Modules/LangsBar/LangsBar';
import GenericCachedImg from '../../Utils/EchopointImg/GenericCachedImg';

const ECHOPOINT = 'https://echopoint.ujjwalvivek.com';

const About = () => {
  const resumeBarRef = useRef(null);
  const { backgroundConfig } = useBackground();
  const noAnim = backgroundConfig.type !== 'none' ? '' : styles.noanimated;

  return (
    <div className={styles.pageContainer}>
      <section className={styles.heroSection}>
        <div className={`${styles.heroArt} ${noAnim}`}>
          <GenericCachedImg src="https://cdn.ujjwalvivek.com/images/profile.webp" alt="it's a me, vivek!" className={styles.avatarImg} width="100%" />
          <div className={styles.heroCaption} aria-hidden="false">hi there! i'm Vivek. i think in systems & experiment relentlessly.</div>
        </div>
      </section>

      <section className={styles.terminalSection}>
        <InteractiveIntroText />
      </section>

      <section className={styles.projectsContainer}>
        <JourneyBadge />
        <SynclippyBadge />
      </section>

      <section className={styles.langsContainer}>
        <LangsBar echopoint={ECHOPOINT} />
      </section>

      <section className={styles.recentContainer}>
        <RecentProjects />
      </section>

      <section ref={resumeBarRef} className={styles.resumeBar}>
        <ResumeBar />
      </section>

      <div className={styles.easterEggLink}>
        <EasterEgg />
      </div>
    </div>
  );
};

export default About;
