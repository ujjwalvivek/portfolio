import React, { useState, useCallback, useMemo, useContext, useRef } from 'react';
import { useBackground } from '../../Background/BackgroundContext';
import { getDeviceClass } from '../../Background/useCapabilityProbe';
import { getSmartDefaults } from '../../Background/BackgroundConfig';
import styles from './BackgroundTest.module.css';
import { getAllThemeColors, getAverageHex } from '../../Background/ColorUtils';
import { ThemeContext } from '../ThemeSwitcher/ThemeContext';
import { TbFaceIdError } from 'react-icons/tb';

const BackgroundTest = ({ onClose }) => {
    const {
        backgroundConfig,
        updateBackgroundConfig,
        toggleBackground,
        switchWallpaper,
        getWallpaperMeta,
        getControlRanges,
        getAllWallpaperTypes
    } = useBackground();
    // Local state for controls, initialized from backgroundConfig but not synced automatically
    const [currentBg, setCurrentBg] = useState(backgroundConfig.type);
    const [opacity, setOpacity] = useState(backgroundConfig.opacity);
    const [animationSpeed, setAnimationSpeed] = useState(backgroundConfig.animationSpeed);
    const [density, setDensity] = useState(backgroundConfig.density);
    const [colorMode, setColorMode] = useState(backgroundConfig.colorMode);
    const [customColor, setCustomColor] = useState(backgroundConfig.customColor);
    const [isAnimated, setIsAnimated] = useState(backgroundConfig.isAnimated !== undefined ? backgroundConfig.isAnimated : true);
    const [fps, setFps] = useState(0);
    const { darkMode } = useContext(ThemeContext);

    // New state for panel control
    const [showControlPanel, setShowControlPanel] = useState(false);
    const [selectedWallpaper, setSelectedWallpaper] = useState(null);

    const resultsRef = useRef(null);
    const mountTimeRef = useRef(Date.now());

    const handleWallpaperClick = useCallback((bg) => {
        setSelectedWallpaper(bg);
        // If same wallpaper, just show controls with current values
        if (bg.id !== backgroundConfig.type) {
            switchWallpaper(bg.id, true);
        }
        setShowControlPanel(true);
    }, [backgroundConfig.type, switchWallpaper]);

    // Generate wallpaper list from centralized configuration
    const backgrounds = useMemo(() => {
        return getAllWallpaperTypes().map(wallpaperType => {
            const meta = getWallpaperMeta(wallpaperType);
            const controls = getControlRanges(wallpaperType);

            if (!meta || !controls) return null;

            // Transform controls to match expected format and add labels
            const transformedControls = {
                opacity: {
                    ...controls.opacity,
                    label: 'Opacity'
                },
                animationSpeed: {
                    ...controls.animationSpeed,
                    label: 'Flow Speed'
                },
                density: {
                    ...controls.density,
                    label: 'Pattern Density'
                }
            };

            return {
                id: wallpaperType,
                name: meta.name,
                description: meta.description,
                techStack: meta.techStack,
                icon: React.createElement(meta.icon),
                controls: transformedControls,
                colorModes: meta.colorModes
            };
        }).filter(Boolean); // Remove any null entries
    }, [getAllWallpaperTypes, getWallpaperMeta, getControlRanges]);

    // Keyboard navigation
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            // Prevent immediate triggering from the opening interaction (e.g. Command Palette enter)
            if (Date.now() - mountTimeRef.current < 400) return;

            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                if (showControlPanel) {
                    setShowControlPanel(false);
                } else {
                    onClose();
                }
                return;
            }

            if (showControlPanel) return;

            // Only capture arrow keys and enter
            if (!['ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) return;

            e.preventDefault();

            if (backgrounds.length === 0) return;

            const currentIndex = backgrounds.findIndex(bg => bg.id === currentBg);

            if (e.key === 'Enter') {
                if (currentIndex !== -1) {
                    handleWallpaperClick(backgrounds[currentIndex]);
                }
                return;
            }

            let nextIndex = currentIndex;
            if (currentIndex === -1) {
                nextIndex = 0;
            } else if (e.key === 'ArrowDown') {
                nextIndex = (currentIndex + 1) % backgrounds.length;
            } else if (e.key === 'ArrowUp') {
                nextIndex = (currentIndex - 1 + backgrounds.length) % backgrounds.length;
            }

            const nextBg = backgrounds[nextIndex];
            if (nextBg) {
                switchWallpaper(nextBg.id, true);
            }
        };

        window.addEventListener('keydown', handleKeyDown, { capture: true });
        return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
    }, [showControlPanel, backgrounds, currentBg, switchWallpaper, handleWallpaperClick, onClose]);

    // Scroll active item into view
    React.useEffect(() => {
        if (!showControlPanel && currentBg) {
            const el = document.getElementById(`bg-item-${currentBg}`);
            if (el) el.scrollIntoView({ block: 'nearest' });
        }
    }, [currentBg, showControlPanel]);

    // FPS monitoring
    React.useEffect(() => {
        const handleFpsUpdate = (event) => {
            const d = event?.detail;
            const fpsValue = (typeof d === 'object' && d !== null) ? (Number(d.fps) || 0) : Number(d) || 0;
            const source = (typeof d === 'object' && d !== null) ? d.source : undefined;
            // if selectedWallpaper is set, only accept matching source
            if (selectedWallpaper && source && source !== selectedWallpaper.id) return;
            setFps(Math.min(Math.round(fpsValue), 60));
        };

        window.addEventListener('fpsUpdate', handleFpsUpdate);
        return () => window.removeEventListener('fpsUpdate', handleFpsUpdate);
    }, [selectedWallpaper]);

    // Sync local state when backgroundConfig changes or overlay opens
    React.useEffect(() => {
        setCurrentBg(backgroundConfig.type);
        setOpacity(backgroundConfig.opacity);
        setAnimationSpeed(backgroundConfig.animationSpeed);
        setDensity(backgroundConfig.density);
        setColorMode(backgroundConfig.colorMode);
        setCustomColor(backgroundConfig.customColor);
        setIsAnimated(backgroundConfig.isAnimated !== undefined ? backgroundConfig.isAnimated : true);
    }, [backgroundConfig]);

    // Debouncing for smooth sliders
    const debouncedUpdateRef = useRef(null);
    const pendingUpdatesRef = useRef({});

    // Helper function to shallow compare objects
    const shallowEqual = (obj1, obj2) => {
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);

        if (keys1.length !== keys2.length) return false;

        for (let key of keys1) {
            if (obj1[key] !== obj2[key]) return false;
        }
        return true;
    };

    // Debounced update function for smooth slider interactions
    const debouncedGlobalUpdate = useCallback((updates) => {
        // Merge with pending updates
        pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };

        // Clear existing timeout
        if (debouncedUpdateRef.current) {
            clearTimeout(debouncedUpdateRef.current);
        }

        // Set new timeout
        debouncedUpdateRef.current = setTimeout(() => {
            const finalUpdates = pendingUpdatesRef.current;
            pendingUpdatesRef.current = {};

            // Apply the accumulated updates
            const newConfig = {
                type: finalUpdates.type !== undefined ? finalUpdates.type : currentBg,
                opacity: finalUpdates.opacity !== undefined ? finalUpdates.opacity : opacity,
                animationSpeed: finalUpdates.animationSpeed !== undefined ? finalUpdates.animationSpeed : animationSpeed,
                density: finalUpdates.density !== undefined ? finalUpdates.density : density,
                colorMode: finalUpdates.colorMode !== undefined ? finalUpdates.colorMode : colorMode,
                customColor: finalUpdates.customColor !== undefined ? finalUpdates.customColor : customColor,
                isAnimated: finalUpdates.isAnimated !== undefined ? finalUpdates.isAnimated : isAnimated,
            };

            // Only update if values actually changed
            if (!shallowEqual(backgroundConfig, newConfig)) {
                updateBackgroundConfig(newConfig);
            }
        }, 150); // 150ms debounce - smooth but responsive
    }, [currentBg, opacity, animationSpeed, density, colorMode, customColor, isAnimated, backgroundConfig, updateBackgroundConfig]);

    // Simplified helper function - leverages context's settings preservation
    const updateLocalAndGlobal = useCallback((updates) => {
        // Handle wallpaper type changes with settings preservation
        if (updates.type !== undefined && updates.type !== currentBg) {
            switchWallpaper(updates.type, true);
            return; // Context handles the state updates
        }

        // For non-type updates, build the new config
        const newConfig = {
            type: currentBg,
            opacity: updates.opacity !== undefined ? updates.opacity : opacity,
            animationSpeed: updates.animationSpeed !== undefined ? updates.animationSpeed : animationSpeed,
            density: updates.density !== undefined ? updates.density : density,
            colorMode: updates.colorMode !== undefined ? updates.colorMode : colorMode,
            customColor: updates.customColor !== undefined ? updates.customColor : customColor,
            isAnimated: updates.isAnimated !== undefined ? updates.isAnimated : isAnimated,
        };

        // Update local state immediately for responsive UI
        if (updates.opacity !== undefined) setOpacity(updates.opacity);
        if (updates.animationSpeed !== undefined) setAnimationSpeed(updates.animationSpeed);
        if (updates.density !== undefined) setDensity(updates.density);
        if (updates.colorMode !== undefined) setColorMode(updates.colorMode);
        if (updates.customColor !== undefined) setCustomColor(updates.customColor);
        if (updates.isAnimated !== undefined) setIsAnimated(updates.isAnimated);

        // For slider controls (opacity, speed, density), use debounced updates
        if (updates.opacity !== undefined || updates.animationSpeed !== undefined || updates.density !== undefined) {
            debouncedGlobalUpdate(updates);
        } else {
            // For other controls (colorMode, customColor, etc.), update immediately
            if (!shallowEqual(backgroundConfig, newConfig)) {
                updateBackgroundConfig(newConfig);
            }
        }
    }, [
        currentBg,
        opacity,
        animationSpeed,
        density,
        colorMode,
        customColor,
        isAnimated,
        backgroundConfig,
        updateBackgroundConfig,
        switchWallpaper,
        debouncedGlobalUpdate
    ]);

    function handleAnimationToggle() {
        const newVal = !backgroundConfig.isAnimated;
        updateBackgroundConfig({ isAnimated: newVal });
        localStorage.setItem('bgAnimationAutoDecision', newVal ? 'on' : 'off');
    }

    const resetAllSettings = () => {
        if (window.confirm('Reset all background settings to defaults? This will clear your saved preferences.')) {
            const defaultBgId = 'psychedelic';
            const deviceClass = getDeviceClass();
            const smartDefaults = getSmartDefaults(defaultBgId, deviceClass);
            const defaults = { ...smartDefaults, colorMode: 'cyber', customColor: '#f78fb3' };

            // update all local states
            setCurrentBg(defaultBgId);
            setOpacity(defaults.opacity);
            setAnimationSpeed(defaults.animationSpeed);
            setDensity(defaults.density);
            setColorMode(defaults.colorMode);
            setCustomColor(defaults.customColor);
            setIsAnimated(defaults.isAnimated);

            // update global context
            updateBackgroundConfig(defaults);
        }
    };

    const controlValues = { opacity, animationSpeed, density };

    const getThemeColorsForMode = (colorMode) => {
        const themeConfig = { ...backgroundConfig, colorMode };
        return getAllThemeColors(themeConfig, darkMode); // Note: using !darkMode to get current theme
    };

    const getDominantColorForMode = (colorMode) => {
        const themeConfig = { ...backgroundConfig, colorMode };
        return getAverageHex(themeConfig, false, darkMode, 'dominant'); // Use 'dominant' method
    };

    return (
        <div className={styles.playground}>
            <div className={styles.header}>
                <div className={styles.title}>Choose Your Vibe!</div>
                <div className={styles.navButtons}>
                    <div className={styles.shortcut} onClick={resetAllSettings} style={{ cursor: 'pointer' }} title="Reset to defaults">RESET</div>
                    <div className={styles.shortcut} onClick={() => onClose()} style={{ cursor: 'pointer' }}>ESC</div>
                </div>
            </div>

            <div className={styles.results} ref={resultsRef}>
                {backgrounds.map((bg) => (
                    <div
                        key={bg.id}
                        id={`bg-item-${bg.id}`}
                        className={`${styles.command} ${currentBg === bg.id ? styles.selected : ''}`}
                        onClick={() => handleWallpaperClick(bg)}
                    >
                        <div className={styles.commandIcon}>{bg.icon}</div>

                        <div className={styles.commandContent}>
                            <div className={styles.commandTitle}>
                                {bg.name}
                            </div>
                            <div className={styles.commandDescription}>{bg.description}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.controlFooter}>
                <div className={styles.shortcuts}>
                    <span><kbd>Visuals</kbd></span>
                </div>
                <div className={styles.toggler}>
                    <label className="switch">
                        <input
                            className="switch__input"
                            type="checkbox"
                            role="switch"
                            checked={currentBg !== 'none'}
                            onChange={toggleBackground}
                        />
                        <svg className="switch__letters" viewBox="0 0 24 24" width="24px" height="24px" aria-hidden="true">
                            <g stroke="currentcolor" strokeLinecap="round" strokeWidth="4" transform="translate(0,4)">
                                <g className="switch__letter">
                                    <polyline className="switch__letter-stroke" points="2 2,2 14" />
                                    <polyline className="switch__letter-stroke" points="2 2,16 2" strokeDasharray="14 16" strokeDashoffset="8" transform="rotate(0,2,2)" />
                                    <polyline className="switch__letter-stroke" points="2 8,6 8" strokeDasharray="4 6" />
                                </g>
                                <g className="switch__letter" transform="translate(14,0)">
                                    <polyline className="switch__letter-stroke" points="2 2,2 14" />
                                    <polyline className="switch__letter-stroke" points="2 2,8 2" strokeDasharray="6 8" />
                                    <polyline className="switch__letter-stroke" points="2 8,6 8" strokeDasharray="4 6" />
                                </g>
                            </g>
                        </svg>
                        <span className={styles.switch__text}></span>
                    </label>
                </div>
            </div>
            {/* Control Panel - slides in from left */}
            <div className={`${styles.controlPanel} ${showControlPanel ? styles.slideIn : ''}`}>
                {selectedWallpaper && (
                    <>
                        <div className={styles.header}>
                            <div className={styles.searchIcon}>{selectedWallpaper.icon}</div>
                            <div className={styles.title}>{selectedWallpaper.name}</div>
                            <div className={styles.navButtons}>
                                <div className={styles.shortcut} onClick={resetAllSettings} style={{ cursor: 'pointer' }} title="Reset to defaults">RESET</div>
                                <div className={styles.shortcut} onClick={() => setShowControlPanel(false)} style={{ cursor: 'pointer' }}>BACK</div>
                            </div>
                        </div>

                        {currentBg !== 'none' ? (
                            <div className={styles.controlContent}>
                                {/* Color Scheme Section */}
                                <div className={styles.colorPalette}>
                                    {['cyber', 'synthwave', 'fire', 'sunset', 'ocean', 'midnight', 'forest', 'spark', 'aurora', 'custom'].map((mode, idx) => {
                                        const themeColors = getThemeColorsForMode(mode);
                                        const gradientStyle = themeColors.length >= 3 ? {
                                            background: `linear-gradient(to right, ${themeColors[0]} 0%, ${themeColors[1]} 50%, ${themeColors[2]} 100%)`
                                        } : {};

                                        return (
                                            <div className={styles.colorSelect} key={mode}>
                                                <input
                                                    type="radio"
                                                    name="colorMode"
                                                    id={`colorMode-${idx}`}
                                                    value={mode}
                                                    checked={colorMode === mode}
                                                    onChange={() => updateLocalAndGlobal({ colorMode: mode })}
                                                />
                                                <label
                                                    htmlFor={`colorMode-${idx}`}
                                                    style={{
                                                        border: `2px solid ${getDominantColorForMode(mode)}`,
                                                        ...gradientStyle
                                                    }}
                                                    data-theme={mode}
                                                    data-tooltip={mode.charAt(0).toUpperCase() + mode.slice(1)}
                                                    onClick={() => {
                                                        const colorInput = document.getElementById(`customColorPicker-${idx}`);
                                                        if (colorInput) {
                                                            colorInput.click();
                                                        }
                                                    }}
                                                >
                                                    {mode === 'custom' && colorMode === 'custom' && (
                                                        <input
                                                            type="color"
                                                            value={customColor}
                                                            onChange={(e) => updateLocalAndGlobal({ customColor: e.target.value })}
                                                            className={styles.colorPicker}
                                                        />
                                                    )}
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* Visual Controls Section */}
                                <div className={styles.controlSection}>
                                    <div className={styles.visualControls}>
                                        {selectedWallpaper.controls && Object.entries(selectedWallpaper.controls).map(([key, control]) => (
                                            <div key={key} className={styles.controlGroup}>
                                                <label className={styles.controlLabel}>
                                                    <kbd>{control.label}</kbd>
                                                </label>
                                                <input
                                                    type="range"
                                                    min={control.min}
                                                    max={control.max}
                                                    step={control.step}
                                                    value={controlValues[key]}
                                                    onChange={(e) => updateLocalAndGlobal({ [key]: parseFloat(e.target.value) })}
                                                    className={styles.slider}
                                                    style={{
                                                        '--slider-progress': `${((controlValues[key] - control.min) / (control.max - control.min)) * 100}%`
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : <div className={styles.noResults} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                            <div className={styles.noResultsIcon}><TbFaceIdError /></div>
                            <div className={styles.noResultsText}>No wallpaper detected. Please turn ON procedural generation.</div>
                        </div>
                        }

                        <div className={styles.controlFooter}>
                            <div className={`${styles.shortcuts} ${fps < 15 ? styles.fpsLow : fps < 25 ? styles.fpsMedium : styles.fpsHigh}`} onClick={() => handleAnimationToggle()} style={{ cursor: 'pointer' }} title="Toggle Animation">
                                <span style={{ letterSpacing: '0.1rem' }}><kbd>{currentBg === 'none' ? 'OFF' : (backgroundConfig.isAnimated && fps > 0 ? `Animated: ${fps} FPS` : 'static')}</kbd></span>
                            </div>
                            <div className={styles.shortcuts}>
                                <span><kbd>Visuals</kbd></span>
                            </div>
                            <div className={styles.toggler}>
                                <label className="switch">
                                    <input
                                        className="switch__input"
                                        type="checkbox"
                                        role="switch"
                                        checked={currentBg !== 'none'}
                                        onChange={toggleBackground}
                                    />
                                    <svg className="switch__letters" viewBox="0 0 24 24" width="24px" height="24px" aria-hidden="true">
                                        <g stroke="currentcolor" strokeLinecap="round" strokeWidth="4" transform="translate(0,4)">
                                            <g className="switch__letter">
                                                <polyline className="switch__letter-stroke" points="2 2,2 14" />
                                                <polyline className="switch__letter-stroke" points="2 2,16 2" strokeDasharray="14 16" strokeDashoffset="8" transform="rotate(0,2,2)" />
                                                <polyline className="switch__letter-stroke" points="2 8,6 8" strokeDasharray="4 6" />
                                            </g>
                                            <g className="switch__letter" transform="translate(14,0)">
                                                <polyline className="switch__letter-stroke" points="2 2,2 14" />
                                                <polyline className="switch__letter-stroke" points="2 2,8 2" strokeDasharray="6 8" />
                                                <polyline className="switch__letter-stroke" points="2 8,6 8" strokeDasharray="4 6" />
                                            </g>
                                        </g>
                                    </svg>
                                    <span className={styles.switch__text}></span>
                                </label>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div >
    );
};

export default BackgroundTest;
