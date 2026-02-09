import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import GlobalBackground from '../../Background/GlobalBackground';
import { useBackground } from '../../Background/BackgroundContext';
import { getWallpaperConfig, getAllWallpaperTypes } from '../../Background/BackgroundConfig';
import { usePrefersReducedMotion } from '../../Modules/A11y/UsePrefersReducedMotion';
import styles from './LandingPage.module.css';

const LandingPage = ({ onEnter }) => {
    const { updateBackgroundConfig, isMobile, deviceClass } = useBackground();
    const prefersReducedMotion = usePrefersReducedMotion();

    const [currentStep, setCurrentStep] = useState(0);
    const [stepExiting, setStepExiting] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    // Shuffling card state
    const [shuffleIndex, setShuffleIndex] = useState(0);
    const [shuffling, setShuffling] = useState(false); // Will be enabled below if needed
    const wallpaperTypes = useMemo(() => getAllWallpaperTypes(), []);
    const rootRef = useRef(null);
    const sequenceDone = useRef(false);

    // Stable wallpaper selection — override with 'none' if reduced motion detected
    const optimalWallpaper = useMemo(() => {
        // Reduced motion takes priority — set low chaos mode
        if (prefersReducedMotion) {
            localStorage.setItem('lowChaosOverride', 'true');
            return 'none';
        }

        // Otherwise, device-aware selection
        if (isMobile) {
            if (deviceClass === 'lowEnd') return 'circuit';
            if (deviceClass === 'midRange') return 'hologram';
            return 'vortex';
        }
        if (deviceClass === 'lowEnd') return 'circuit';
        if (deviceClass === 'midRange') return 'hologram';
        return 'psychedelic';
    }, [prefersReducedMotion, isMobile, deviceClass]);

    // Preview configs for the shuffling wallpaper
    const landingPresets = useMemo(() => {
        const presets = {};
        const types = getAllWallpaperTypes();

        types.forEach(type => {
            const previewConfig = getWallpaperConfig(type, 'preview');
            if (previewConfig) {
                presets[type] = {
                    type,
                    ...previewConfig,
                    opacity: 0.8,
                    animationSpeed: 1.0,
                    density: { psychedelic: 1.3, hologram: 0.9, circuit: 0.9, vortex: 0.4 }[type] || 1.0,
                    colorMode: { psychedelic: 'ocean', hologram: 'synthwave', circuit: 'aurora', vortex: 'fire' }[type] || 'cyber',
                };
            }
        });

        return presets;
    }, []);

    // Full-screen configs applied when entering the main site
    const mainPresets = useMemo(() => {
        const presets = {};
        const types = getAllWallpaperTypes();

        types.forEach(type => {
            const smartConfig = getWallpaperConfig(type, 'fullscreen');
            if (smartConfig) {
                presets[type] = {
                    type,
                    ...smartConfig,
                    opacity: 0.8,
                    colorMode: { psychedelic: 'synthwave', hologram: 'fire', circuit: 'forest', vortex: 'aurora' }[type] || 'ocean',
                };
            }
        });

        presets.minimal = { type: 'none' };
        return presets;
    }, []);

    // Steps depend only on stable memoized values
    const steps = useMemo(() => {
        const wallpaperLabel = optimalWallpaper === 'none'
            ? 'Low Chaos Mode (auto-enabled)'
            : optimalWallpaper;

        return [
            { text: "Probing hardware capabilities...", duration: 400 },
            { text: "Analyzing GPU performance...", duration: 400 },
            { text: "Optimizing visual settings...", duration: 400 },
            { text: `Device: ${deviceClass} — ${isMobile ? 'Mobile' : 'Desktop'}`, duration: 200 },
            { text: `Wallpaper: ${wallpaperLabel}`, duration: 200 },
        ];
    }, [deviceClass, isMobile, optimalWallpaper]);

    // Enable shuffling only if NOT in Low Chaos Mode
    useEffect(() => {
        if (optimalWallpaper !== 'none') {
            setShuffling(true);
        }
    }, [optimalWallpaper]);

    // Crossfade exit — stable callback, no function recreation issues
    const exitLanding = useCallback(() => {
        if (sequenceDone.current) return;
        sequenceDone.current = true;

        // Apply wallpaper before fading out (use 'minimal' key for 'none')
        const configKey = optimalWallpaper === 'none' ? 'minimal' : optimalWallpaper;
        updateBackgroundConfig(mainPresets[configKey]);

        setShuffling(false);
        const selectedIndex = wallpaperTypes.indexOf(optimalWallpaper);
        setShuffleIndex(selectedIndex);

        // Start crossfade
        setIsLeaving(true);
        setTimeout(() => {
            onEnter();
        }, 500); // matches CSS transition duration
    }, [mainPresets, optimalWallpaper, updateBackgroundConfig, onEnter, wallpaperTypes]);

    // Shuffle wallpaper cards
    useEffect(() => {
        if (!shuffling) return;
        const interval = setInterval(() => {
            setShuffleIndex(prev => (prev + 1) % wallpaperTypes.length);
        }, 120);
        return () => clearInterval(interval);
    }, [shuffling, wallpaperTypes.length]);

    // Run the boot step sequence
    useEffect(() => {
        let cancelled = false;

        const runSequence = async () => {
            for (let i = 0; i < steps.length; i++) {
                if (cancelled) return;

                // Fade out previous step
                if (i > 0) {
                    setStepExiting(true);
                    await new Promise(r => setTimeout(r, 200));
                }

                if (cancelled) return;
                setStepExiting(false);
                setCurrentStep(i);

                // Stop shuffling and lock wallpaper on the last step
                if (i === steps.length - 1) {
                    setShuffling(false);
                    const selectedIndex = wallpaperTypes.indexOf(optimalWallpaper);
                    setShuffleIndex(selectedIndex);
                }

                await new Promise(r => setTimeout(r, steps[i].duration));
            }

            if (!cancelled) exitLanding();
        };

        runSequence();
        return () => { cancelled = true; };
    }, [steps, exitLanding, wallpaperTypes, optimalWallpaper]);

    const currentPreset = landingPresets[wallpaperTypes[shuffleIndex]];
    const progress = ((currentStep + 1) / steps.length) * 100;
    const isLowChaosMode = optimalWallpaper === 'none';

    return (
        <div ref={rootRef} className={`${styles.stagingRoot} ${isLeaving ? styles.leaving : ''}`}>
            <div className={styles.wallpaperSection}>
                <div className={styles.previewCard}>
                    {isLowChaosMode ? (
                        <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.01), rgba(0,0,0,0.05))',
                            color: '#555',
                            fontSize: '0.85rem',
                            fontFamily: 'inherit',
                            letterSpacing: '1px'
                        }}>
                            Low Chaos Mode
                        </div>
                    ) : (
                        <GlobalBackground previewConfig={currentPreset} />
                    )}
                </div>
            </div>
            <span className={styles.loadingTitle}>Loading Content</span>
            <div className={styles.loadingBar}>
                <div className={styles.progressTrack}>
                    <div
                        className={styles.progressFill}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
            <div className={styles.stepSection}>
                <div
                    key={currentStep}
                    className={`${styles.stepText} ${stepExiting ? styles.exiting : ''}`}
                >
                    <span className={styles.prompt}>▶</span>
                    {steps[currentStep]?.text}
                    <span className={styles.cursor}>_</span>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;