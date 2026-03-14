import { useEffect } from 'react';
import styles from './Home.module.css';
import { useBackground } from '../../Background/BackgroundContext';
import TerminalMail from "../../Modules/TerminalMail/TerminalMail";
import InteractiveIntroText from "../../Modules/IntroText/IntroTextHomepage";
import RecentLogs from "../../Modules/RecentLogs/RecentLogs";
import Widgets from '../../Modules/Widgets/Widgets';
import LemmingsWall from '../../Modules/Lemmings/LemmingsWall';
import HomeNav from '../../Modules/HomeNav/HomeNav';

const Home = () => {
    const { backgroundConfig } = useBackground();

    useEffect(() => {
        const override = localStorage.getItem('lowChaosOverride');
        if (override === 'true') {
            localStorage.removeItem('lowChaosOverride');
        }
    }, []);

    return (
        <div className={`${styles.homeContainer} ${backgroundConfig.type === 'none' ? styles.noBackdrop : ''}`}>

            <div className={styles.headerContainer}>
                <LemmingsWall />
            </div>

            <div className={styles.navContainer}>
                <HomeNav />
            </div>

            <div className={styles.introTextContainer}>
                <InteractiveIntroText />
            </div>

            <div className={styles.recentLogsContainer}>
                <RecentLogs />
            </div>

            <div className={styles.widgetContainer}>
                <Widgets />
            </div>

            <div className={styles.terminalMailComponent}>
                <TerminalMail />
            </div>
        </div>
    );
};

export default Home;