import React, { useContext, useMemo, useEffect, useState } from 'react';
import GlobalBackground from '../../Background/GlobalBackground';
import { ThemeContext } from '../../ThemeSwitcher/ThemeContext';
import { useBackground } from '../../Background/BackgroundContext';
import styles from './LandingPage.module.css';
import { usePrefersReducedMotion } from '../../A11y/UsePrefersReducedMotion';
import { useNavigate } from 'react-router-dom';


const LandingPage = ({ onEnter }) => {
    const { darkMode, toggleDarkMode } = useContext(ThemeContext);
    const { updateBackgroundConfig } = useBackground();
    const prefersReducedMotion = usePrefersReducedMotion();
    const [showPrompt, setShowPrompt] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        if (
            prefersReducedMotion &&
            !showPrompt
        ) {
            window.alert(
                "Accessibility Notice:\n\nWe detected your system prefers reduced motion. Some backgrounds and animations may cause discomfort. For a calmer experience, consider enabling Low Chaos Mode."
            );
            setShowPrompt(true);
        }
    }, [prefersReducedMotion, showPrompt]);

    // For mobile/desktop density
    const isMobile = useMemo(() => {
        if (typeof navigator === "undefined" || typeof window === "undefined") return false;
        const ua = navigator.userAgent;
        const isIpad = (
            /iPad/.test(ua) ||
            (ua.includes("Macintosh") && ('ontouchstart' in window || navigator.maxTouchPoints > 1))
        );
        const isIphoneOrAndroid = /iPhone|iPod|Android/i.test(ua);
        return isIphoneOrAndroid || isIpad;
    }, []);

    const landingPresets = useMemo(() => ({
        psychedelic: {
            type: 'psychedelic',
            opacity: 1,
            animationSpeed: 5,
            density: isMobile ? 1.7 : 2,
            colorMode: 'cyber',
            customColor: '#d63031',
            isAnimated: !prefersReducedMotion,
        },
        hologram: {
            type: 'hologram',
            opacity: 1,
            animationSpeed: 0.5,
            density: isMobile ? 0.5 : 1,
            colorMode: 'fire',
            customColor: '#00b894',
            isAnimated: !prefersReducedMotion,
        },
        circuit: {
            type: 'circuit',
            opacity: 1,
            animationSpeed: 0.5,
            density: isMobile ? 1 : 1.5,
            colorMode: 'ocean',
            customColor: '#0984e3',
            isAnimated: !prefersReducedMotion,
        },
        vortex: {
            type: 'vortex',
            opacity: 1,
            animationSpeed: 1,
            density: isMobile ? 20 : 40,
            colorMode: 'terminal',
            customColor: '#d63031',
            isAnimated: !prefersReducedMotion,
        },
        low: {
            type: 'none'
        }
    }), [isMobile, prefersReducedMotion]);

    const mainPresets = useMemo(() => ({
        psychedelic: {
            type: 'psychedelic',
            opacity: 0.8,
            animationSpeed: 5,
            density: isMobile ? 2 : 2.5,
            colorMode: 'cyber',
            customColor: '#d63031',
            isAnimated: !prefersReducedMotion,
        },
        hologram: {
            type: 'hologram',
            opacity: 0.8,
            animationSpeed: 1,
            density: isMobile ? 1 : 2,
            colorMode: 'fire',
            customColor: '#00b894',
            isAnimated: !prefersReducedMotion,
        },
        circuit: {
            type: 'circuit',
            opacity: 0.8,
            animationSpeed: 1,
            density: isMobile ? 1.5 : 2.5,
            colorMode: 'ocean',
            customColor: '#0984e3',
            isAnimated: !prefersReducedMotion,
        },
        vortex: {
            type: 'vortex',
            opacity: 0.8,
            animationSpeed: 1,
            density: isMobile ? 40 : 80,
            colorMode: 'terminal',
            customColor: '#d63031',
            isAnimated: !prefersReducedMotion,
        },
        low: {
            type: 'none'
        }
    }), [isMobile, prefersReducedMotion]);

    const handleEnter = (type) => {
        updateBackgroundConfig(mainPresets[type]);
        onEnter();
        navigate('/');
    };

    return (
        <div className={styles.landingRoot}>
            {/* Hero/Header Section */}
            <header className={styles.heroSection}>
                <h1 className={styles.heroTitle}>Choose Your Vibe</h1>
                <p className={styles.heroSubtitle}>
                    Select a background vibe below, or use Low Chaos Mode for a minimal, distraction free experience.
                </p>
                <div className={styles.a11yDisclaimer} role="alert" style={{ background: darkMode ? 'none' : 'rgba(var(--text-color-rgb), 0.9)' }}>
                    <strong>Accessibility Notice:</strong><br />
                    Some backgrounds and animations may cause discomfort or reduce accessibility for sensitive users. <br />
                    <span className={styles.a11yAction}>
                        <button
                            className={styles.lowChaosButton}
                            aria-label="Switch to Low Chaos Mode"
                            onClick={() => handleEnter('low')}
                        >
                            enter(lowChaosMode)
                        </button>
                        <button
                    className={styles.lowChaosButton}
                    aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
                    onClick={toggleDarkMode}
                >
                    {darkMode ? 'switchTheme(light)' : 'switchTheme(dark)'}
                </button>
                    </span>
                </div>
            </header>

            {/* Background Component */}
            <div className={styles.cardsWrapper}>
                {/* Background Cards */}
                <main className={styles.cardsSection}>
                    {['psychedelic', 'hologram', 'circuit', 'vortex'].map((type) => {
                        const displayNames = {
                            psychedelic: 'Psych Dream',
                            hologram: 'Holo Display',
                            circuit: 'Circuit Flora',
                            vortex: 'Quantum Threads'
                        };
                        return (
                            <div
                                key={type}
                                className={styles.bgCard}
                                role="button"
                                tabIndex={0}
                                aria-label={`Choose ${displayNames[type]} background`}
                                onClick={() => handleEnter(type)}
                                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleEnter(type)}
                            >
                                <div className={styles.bgFullPreview}>
                                    <GlobalBackground previewConfig={{ ...landingPresets[type] }} />
                                </div>
                                <div className={styles.bgOverlay}>
                                    <span className={styles.bgLabel}>
                                        {displayNames[type]}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </main>
            </div>

            {/* Footer */}
            <footer className={styles.footer}>
                <span>
                    <a href="https://ujjwalvivek.com" target="_blank" rel="noopener noreferrer">ujjwalvivek.com</a>
                    &nbsp;·&nbsp;no trackers&nbsp;·&nbsp;built using JS and <span aria-label="love" role="img">❤️</span>
                </span>
            </footer>
        </div>
    );
};

export default LandingPage;