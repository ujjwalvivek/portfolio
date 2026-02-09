import { useState, useEffect } from 'react';
import { FiCommand } from 'react-icons/fi';
import styles from './CommandHint.module.css';

const CommandHint = ({ onDismiss }) => {
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [progress, setProgress] = useState(100);

    const DISMISS_DURATION = 5000; // 5 seconds

    useEffect(() => {
        // Check if user has seen the hint before
        const hasSeenHint = localStorage.getItem('command-palette-hint-seen');

        if (!hasSeenHint) {
            // Show hint after 2 seconds on first visit
            const timer = setTimeout(() => {
                setVisible(true);
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, []);

    useEffect(() => {
        if (visible) {
            // Start progress bar countdown
            const startTime = Date.now();

            const progressInterval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, DISMISS_DURATION - elapsed);
                const progressPercent = (remaining / DISMISS_DURATION) * 100;

                setProgress(progressPercent);

                if (remaining <= 0) {
                    clearInterval(progressInterval);
                    handleDismiss();
                }
            }, 50); // Update every 50ms for smooth animation
            return () => clearInterval(progressInterval);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    const handleDismiss = () => {
        setVisible(false);
        setDismissed(true);
        localStorage.setItem('command-palette-hint-seen', 'true');
        onDismiss?.();
    };

    if (!visible || dismissed) return null;

    return (
        <div className={`${styles.hint} ${visible ? styles.show : ''}`}>
            <div className={styles.content}>
                <div className={styles.icon}>
                    <FiCommand />
                </div>
                <div className={styles.text}>
                    <span className={styles.message}>Press</span>
                    <kbd className={styles.key}>Ctrl + K</kbd>
                    <kbd className={styles.key}>P</kbd>
                    <span className={styles.message}>to open command palette</span>
                </div>
                <div className={styles.progressContainer}>
                    <div className={styles.progressBar} style={{ width: `${progress}%` }} />
                </div>
            </div>
        </div>
    );
};

export default CommandHint;
