import { useEffect } from 'react';
import styles from './LemmingsWall.module.css';
import { useBackground } from '../../Background/BackgroundContext';
import LemmingCanvas from '../../Modules/Lemmings/Lemming';

const LemmingsWall = () => {
    const { backgroundConfig } = useBackground();

    useEffect(() => {
        const override = localStorage.getItem('lowChaosOverride');
        if (override === 'true') {
            localStorage.removeItem('lowChaosOverride');
        }
    }, []);

    const glitchyClasses = backgroundConfig.type !== 'none'
        ? `${styles.glitch} ${styles.shadowPulse} ${styles.neonFlicker}`
        : '';

    return (
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
    );
};

export default LemmingsWall;