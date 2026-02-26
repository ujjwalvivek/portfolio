import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import styles from './Home.module.css';
import { useBackground } from '../../Background/BackgroundContext';
import TerminalMail from "../../Modules/TerminalMail/TerminalMail";
import InteractiveIntroText from "../../Modules/IntroText/IntroTextHomepage";
import RecentLogs from "../../Modules/RecentLogs/RecentLogs";
import LemmingCanvas from './Lemming';
import JourneyBadge from '../../Modules/JourneyBadge/JourneyBadge';

const Home = () => {
    const { backgroundConfig } = useBackground();

    // Check for reduced-motion override notification
    useEffect(() => {
        const override = localStorage.getItem('lowChaosOverride');
        if (override === 'true') {
            // Show notification once
            setTimeout(() => {
                window.alert(
                    "Accessibility Notice:\n" +
                    "We detected your system prefers reduced motion. " +
                    "Low Chaos Mode has been automatically enabled for a calmer, distraction-free experience.\n" +
                    "You can change this anytime from the Background Settings (⌘KP or Ctrl+KP)."
                );
            }, 800); // Delay so it shows after landing crossfade completes
            //Patch v2.0.1
            //window.alert is a blocking modal and can be disruptive for keyboard users and assistive tech. Prefer a non-blocking in-app toast/dialog with proper focus management (or an ARIA live region) and provide a way to dismiss/opt out.

            // Clear flag so alert doesn't show again
            localStorage.removeItem('lowChaosOverride');
        }
    }, []);

    // Only add glitch/pulse/flicker if background is not "none"
    const glitchyClasses = backgroundConfig.type !== 'none'
        ? `${styles.glitch} ${styles.shadowPulse} ${styles.neonFlicker}`
        : '';

    return (
        <div className={`${styles.homeContainer} ${backgroundConfig.type === 'none' ? styles.noBackdrop : ''}`}>

            <div className={styles.homeHeader}>
                <h1 className={glitchyClasses} data-text="TECH ISN'T THE HARD PART">
                    TECH ISN'T THE HARD PART
                </h1>
                <h2 className={glitchyClasses} data-text="SYSTEMS, BEHAVIOUR, & QUESTIONS ARE">
                    SYSTEMS, BEHAVIOUR, & QUESTIONS ARE
                </h2>
                <LemmingCanvas
                    className={styles.lemmingCanvas}
                    isAnimated={backgroundConfig.type !== 'none'}
                />
            </div>

            <div className={styles.ctaContainer}>
                <Link to="/blog" className={styles.cta}>
                    <span className="cta-link-span">&lt;</span>ReadLogs<span className="cta-link-span">/&gt;</span>
                </Link>
                <Link to="/about" className={styles.cta}>
                    <span className="cta-link-span">&lt;</span>About<span className="cta-link-span">/&gt;</span>
                </Link>
                <Link to="/projects" className={styles.cta}>
                    <span className="cta-link-span">&lt;</span>Projects<span className="cta-link-span">/&gt;</span>
                </Link>
            </div>

            <div className={styles.journeyStatusContainer}>
                <JourneyBadge />
            </div>

            <div className={styles.introTextContainer}>
                <InteractiveIntroText />
                <span className={styles.border}></span>
            </div>

            <div className={styles.recentLogsContainer}>
                <RecentLogs />
            </div>

            <div className={styles.terminalMailComponent}>
                <TerminalMail />
            </div>

        </div>
    );
};

export default Home;