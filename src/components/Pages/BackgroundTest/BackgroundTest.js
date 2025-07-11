import React, { useState, useCallback, useMemo } from 'react';
import { useBackground } from '../../Background/BackgroundContext';
import styles from './BackgroundTest.module.css';

const BackgroundTest = () => {
    const { backgroundConfig, updateBackgroundConfig } = useBackground();

    // Local state for controls, initialized from backgroundConfig but not synced automatically
    const [currentBg, setCurrentBg] = useState(backgroundConfig.type);
    const [opacity, setOpacity] = useState(backgroundConfig.opacity);
    const [animationSpeed, setAnimationSpeed] = useState(backgroundConfig.animationSpeed);
    const [density, setDensity] = useState(backgroundConfig.density);
    const [colorMode, setColorMode] = useState(backgroundConfig.colorMode);
    const [customColor, setCustomColor] = useState(backgroundConfig.customColor);
    const [isAnimated, setIsAnimated] = useState(backgroundConfig.isAnimated !== undefined ? backgroundConfig.isAnimated : true);
    const [fps, setFps] = useState(0);

    // FPS monitoring
    React.useEffect(() => {
        const handleFpsUpdate = (event) => {
            setFps(Math.min(event.detail, 30));
        };

        window.addEventListener('fpsUpdate', handleFpsUpdate);
        return () => window.removeEventListener('fpsUpdate', handleFpsUpdate);
    }, []);

    React.useEffect(() => {
        setCurrentBg(backgroundConfig.type);
    }, [backgroundConfig.type]);

    const isMobile = useMemo(() => {
        if (typeof navigator === "undefined" || typeof window === "undefined") return false;
        const ua = navigator.userAgent;
        // iPadOS 13+ masquerades as Mac, but has touch events and a small screen
        const isIpad = (
            /iPad/.test(ua) ||
            (ua.includes("Macintosh") && ('ontouchstart' in window || navigator.maxTouchPoints > 1))
        );
        const isIphoneOrAndroid = /iPhone|iPod|Android/i.test(ua);
        return isIphoneOrAndroid || isIpad;
    }, []);

    const backgrounds = useMemo(() => [
        {
            id: 'hologram',
            name: 'Holo Display',
            description: '',
            techStack: 'Holography • 3D Graphics • Sci-Fi UI',
            icon: '👁️',
            complexity: '',
            controls: {
                opacity: { min: 0, max: 0.9, step: 0.1, label: 'Opacity', default: 0.5 },
                animationSpeed: { min: 0.1, max: 3, step: 0.1, label: 'Flow Speed', default: 1 },
                density: { min: isMobile ? 0.5 : 0.5, max: isMobile ? 2 : 3, step: 0.1, label: 'Pattern Density', default: isMobile ? 2 : 3 }
            },
            colorModes: ['matrix', 'cyber', 'terminal', 'fire', 'ocean', 'custom']
        },
        {
            id: 'circuit',
            name: 'Circuit Flora',
            description: '',
            techStack: 'Bio-Tech • PCB Design • Organic Computing',
            icon: '🌿',
            complexity: '',
            controls: {
                opacity: { min: 0, max: 0.9, step: 0.1, label: 'Opacity', default: 0.5 },
                animationSpeed: { min: 0.1, max: 5, step: 0.1, label: 'Flow Speed', default: 1 },
                density: { min: isMobile ? 0.3 : 0.3, max: isMobile ? 3 : 5, step: 0.1, label: 'Pattern Density', default: isMobile ? 3 : 5 }

            },
            colorModes: ['matrix', 'cyber', 'terminal', 'fire', 'ocean', 'custom']
        },
        {
            id: 'psychedelic',
            name: 'Psych Dream',
            description: '',
            techStack: 'Kaleidoscope • Color Theory • Generative Art',
            icon: '🌈',
            complexity: '',
            controls: {
                opacity: { min: 0, max: 0.8, step: 0.1, label: 'Opacity', default: 0.6 },
                animationSpeed: { min: 0.1, max: 10, step: 0.1, label: 'Flow Speed', default: 1 },
                density: { min: isMobile ? 0.2 : 0.2, max: isMobile ? 2 : 2.9, step: 0.1, label: 'Pattern Density', default: isMobile ? 1.7 : 2 }

            },
            colorModes: ['matrix', 'cyber', 'terminal', 'fire', 'ocean', 'custom']
        },
        {
            id: 'vortex',
            name: 'Quantum Threads',
            description: '',
            techStack: 'Field Dynamics • Emergent Systems',
            icon: '⚛️',
            complexity: '',
            controls: {
                opacity: { min: 0, max: 0.9, step: 0.1, label: 'Opacity', default: 0.5 },
                animationSpeed: { min: 0.1, max: 3, step: 0.1, label: 'Flow Speed', default: 1 },
                density: { min: isMobile ? 50 : 50, max: isMobile ? 70 : 100, step: 0.1, label: 'Pattern Density', default: isMobile ? 70 : 80 }
            },
            colorModes: ['matrix', 'cyber', 'terminal', 'fire', 'ocean', 'custom']
        }
    ], [isMobile]);

    // State to track wallpaper states (if needed for future use)
    const [wallpaperStates, setWallpaperStates] = useState({});

    // Helper function to update both local state and global config
    const updateLocalAndGlobal = useCallback((updates) => {
        let newType = updates.type !== undefined ? updates.type : currentBg;
        let newBgData = backgrounds.find(bg => bg.id === newType);

        // Save current state before switching
        if (updates.type !== undefined) {
            setWallpaperStates(prev => ({
                ...prev,
                [currentBg]: {
                    opacity,
                    animationSpeed,
                    density
                }
            }));
        }

        // Load previous state for new wallpaper, or use defaults
        let prevState = wallpaperStates[newType] || {};
        let newOpacity, newAnimationSpeed, newDensity;

        if (updates.type !== undefined && newBgData) {
            newOpacity = prevState.opacity ?? newBgData.controls.opacity.default ?? newBgData.controls.opacity.min;
            newAnimationSpeed = prevState.animationSpeed ?? newBgData.controls.animationSpeed.default ?? newBgData.controls.animationSpeed.min;
            newDensity = prevState.density ?? newBgData.controls.density.default ?? newBgData.controls.density.min;
        } else {
            newOpacity = updates.opacity !== undefined ? updates.opacity : opacity;
            newAnimationSpeed = updates.animationSpeed !== undefined ? updates.animationSpeed : animationSpeed;
            newDensity = updates.density !== undefined ? updates.density : density;
        }

        const newConfig = {
            type: newType,
            opacity: newOpacity,
            animationSpeed: newAnimationSpeed,
            density: newDensity,
            colorMode: updates.colorMode !== undefined ? updates.colorMode : colorMode,
            customColor: updates.customColor !== undefined ? updates.customColor : customColor,
            isAnimated: updates.isAnimated !== undefined ? updates.isAnimated : isAnimated,
        };
        
        // Update local state
        if (updates.type !== undefined) setCurrentBg(newType);
        setOpacity(newOpacity);
        setAnimationSpeed(newAnimationSpeed);
        setDensity(newDensity);
        if (updates.colorMode !== undefined) setColorMode(updates.colorMode);
        if (updates.customColor !== undefined) setCustomColor(updates.customColor);
        if (updates.isAnimated !== undefined) setIsAnimated(updates.isAnimated);

        // Update global config with the complete new state
        updateBackgroundConfig(newConfig);
    }, [
        backgrounds,
        currentBg,
        opacity,
        animationSpeed,
        density,
        colorMode,
        customColor,
        isAnimated,
        updateBackgroundConfig,
        wallpaperStates
    ]);

    const shareConfig = () => {
        const config = btoa(JSON.stringify({
            bg: currentBg,
            o: opacity,
            s: animationSpeed,
            d: density,
            c: colorMode,
            cc: customColor,
            a: isAnimated
        }));

        const url = `${window.location.origin}${window.location.pathname}?config=${config}`;
        navigator.clipboard.writeText(url);
        alert('Configuration URL copied to clipboard!');
    };

const resetAllSettings = () => {
    if (window.confirm('Reset all background settings to defaults? This will clear your saved preferences.')) {
        const defaultBgId = 'psychedelic';
        const defaultBgData = backgrounds.find(bg => bg.id === defaultBgId);

        // Always use 'custom' as the color mode
        const defaults = {
            type: defaultBgId,
            opacity: defaultBgData?.controls.opacity.default ?? defaultBgData?.controls.opacity.min,
            animationSpeed: defaultBgData?.controls.animationSpeed.default ?? defaultBgData?.controls.animationSpeed.min,
            density: defaultBgData?.controls.density.default ?? defaultBgData?.controls.density.min,
            colorMode: 'custom', // <-- force 'custom'
            customColor: '#d63031',
            isAnimated: true
        };

        setCurrentBg(defaultBgId);
        setOpacity(defaults.opacity);
        setAnimationSpeed(defaults.animationSpeed);
        setDensity(defaults.density);
        setColorMode(defaults.colorMode);
        setCustomColor(defaults.customColor);
        setIsAnimated(defaults.isAnimated);
        setWallpaperStates({});

        updateBackgroundConfig(defaults);
    }
};

    const currentBgData = backgrounds.find(bg => bg.id === currentBg);
    const controlValues = { opacity, animationSpeed, density };

    return (
        <div className={styles.playground}>
            {/* The GlobalBackground component will render the canvas based on context */}
            <div className={styles.content}>
                <div className={styles.header}>
                    <h1>Background Switcher</h1>
                    <p className={styles.subtitle}>Please select a background from the gallery</p>
                </div>

                <div className={styles.controlGrid}>
                    <div className={styles.backgroundGallery}>
                        <div className={styles.galleryHeader}>
                            <h3 className={styles.galleryTitle}>Gallery</h3>
                            <span className={styles.galleryCount}>
                                <button onClick={shareConfig} className={styles.exportButton}>
                                    share(url)
                                </button>
                            </span>
                        </div>
                        <div className={styles.backgroundGrid}>
                            {backgrounds.map(bg => (
                                <div
                                    key={bg.id}
                                    className={`${styles.bgCard} ${currentBg === bg.id ? styles.active : ''}`}
                                    onClick={() => updateLocalAndGlobal({ type: bg.id })}
                                >
                                    <div className={styles.bgPreview}>{bg.icon}</div>
                                    <h4>{bg.name}</h4>
                                    <p>{bg.description}</p>
                                    <span className={styles.techStack}>{bg.techStack}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={styles.controlPanel}>
                        <div className={styles.controlSection}>
                            <div className={styles.sectionHeaderRow}>
                                <h4 className={styles.sectionTitle}>Visual Controls</h4>
                                <span className={`${styles.sectionTitle} ${styles.fpsValue} ${fps < 15 ? styles.fpsLow : fps < 25 ? styles.fpsMedium : styles.fpsHigh}`}>
                                    {currentBg === 'none' ? 'OFF' : (isAnimated ? `${fps}.fps` : 'static')}
                                </span>
                            </div>
                            {currentBgData?.controls && Object.entries(currentBgData.controls).map(([key, control]) => (
                                <div key={key} className={styles.controlGroup}>
                                    <label className={styles.controlLabel}>
                                        {control.label}
                                        {/* <span className={styles.controlValue}>
                                            {key === 'opacity' ? opacity.toFixed(2) :
                                                key === 'animationSpeed' ? animationSpeed.toFixed(1) + 'x' :
                                                    key === 'density' ? density.toFixed(1) + 'x' :
                                                        (controlValues[key] !== undefined ? controlValues[key].toFixed(1) : '')}
                                        </span> */}
                                        <span className={styles.controlValue}>
                                            {key === 'opacity' ? '' :
                                                key === 'animationSpeed' ? '' :
                                                    key === 'density' ? '' :
                                                        (controlValues[key] !== undefined ? controlValues[key].toFixed(1) : '')}
                                        </span>
                                    </label>
                                    <input
                                        type="range"
                                        min={control.min}
                                        max={control.max}
                                        step={control.step}
                                        value={controlValues[key]}
                                        onChange={(e) => updateLocalAndGlobal({ [key]: parseFloat(e.target.value) })}
                                        className={styles.slider}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className={styles.controlSection}>
                            <h4 className={styles.sectionTitle}>Color Scheme</h4>
                            <div className={styles.selectGroup}>
                                {(currentBgData?.colorModes || ['matrix', 'cyber', 'terminal', 'ocean', 'fire', 'custom']).map(mode => (
                                    <button
                                        key={mode}
                                        className={`${styles.selectButton} ${colorMode === mode ? styles.active : ''}`}
                                        onClick={() => updateLocalAndGlobal({ colorMode: mode })}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                            {colorMode === 'custom' && (
                                <div className={styles.controlGroup} style={{ marginTop: '1rem' }}>
                                    <label className={styles.controlLabel}>Custom Color</label>
                                    <input
                                        type="color"
                                        value={customColor}
                                        onChange={(e) => updateLocalAndGlobal({ customColor: e.target.value })}
                                        className={styles.colorPicker}
                                        style={{border: '2px solid var(--primary-color)', borderRadius: '2px'}}
                                    />
                                </div>
                            )}
                        </div>

                        <div className={styles.controlSection}>
                            <h4 className={styles.sectionTitle}>Performance</h4>
                            <div className={styles.selectGroup}>
                                <button
                                    className={`${styles.selectButton} ${backgroundConfig.isAnimated ? styles.active : ''}`}
onClick={() => updateLocalAndGlobal({ isAnimated: true })}
                                >
                                    Animated
                                </button>
                                <button
                                    className={`${styles.selectButton} ${!backgroundConfig.isAnimated ? styles.active : ''}`}
onClick={() => updateLocalAndGlobal({ isAnimated: false })}
                                >
                                    Static
                                </button>
                            </div>
                            <div className={styles.previewHeader}>
                                {backgroundConfig.isAnimated && (
                                    <div className={styles.liveIndicator}>
                                        <span className={styles.pulseIndicator}></span>
                                        Procedural Generation Active
                                    </div>
                                )}
                            </div>
                        </div>
                        <button onClick={resetAllSettings} className={`${styles.exportButton} ${styles.resetButton}`} style={{ border: '2px solid #ff4444' }}>
                            🔄 Reset to Defaults
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BackgroundTest;
