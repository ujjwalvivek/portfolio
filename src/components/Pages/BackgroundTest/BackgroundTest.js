import React, { useState } from 'react';
import { useBackground } from '../../Background/BackgroundContext';
import styles from './BackgroundTest.module.css';

const BackgroundTest = () => {
    const { backgroundConfig, updateBackgroundConfig, resetToDefaults } = useBackground();

    // Local state for controls, initialized from backgroundConfig but not synced automatically
    const [currentBg, setCurrentBg] = useState(backgroundConfig.type || 'hologram');
    const [opacity, setOpacity] = useState(backgroundConfig.opacity || 0.5);
    const [animationSpeed, setAnimationSpeed] = useState(backgroundConfig.animationSpeed || 1);
    const [density, setDensity] = useState(backgroundConfig.density || 1);
    const [colorMode, setColorMode] = useState(backgroundConfig.colorMode || 'matrix');
    const [customColor, setCustomColor] = useState(backgroundConfig.customColor || '#00ff41');
    const [isAnimated, setIsAnimated] = useState(backgroundConfig.isAnimated !== undefined ? backgroundConfig.isAnimated : true);

    // Helper function to update both local state and global config
    const updateLocalAndGlobal = (updates) => {
        // Calculate the new config using current state as base
        const newConfig = {
            type: updates.type !== undefined ? updates.type : currentBg,
            opacity: updates.opacity !== undefined ? updates.opacity : opacity,
            animationSpeed: updates.animationSpeed !== undefined ? updates.animationSpeed : animationSpeed,
            density: updates.density !== undefined ? updates.density : density,
            colorMode: updates.colorMode !== undefined ? updates.colorMode : colorMode,
            customColor: updates.customColor !== undefined ? updates.customColor : customColor,
            isAnimated: updates.isAnimated !== undefined ? updates.isAnimated : isAnimated,
        };

        // Update local state
        if (updates.type !== undefined) setCurrentBg(updates.type);
        if (updates.opacity !== undefined) setOpacity(updates.opacity);
        if (updates.animationSpeed !== undefined) setAnimationSpeed(updates.animationSpeed);
        if (updates.density !== undefined) setDensity(updates.density);
        if (updates.colorMode !== undefined) setColorMode(updates.colorMode);
        if (updates.customColor !== undefined) setCustomColor(updates.customColor);
        if (updates.isAnimated !== undefined) setIsAnimated(updates.isAnimated);

        // Update global config with the complete new state
        updateBackgroundConfig(newConfig);
    };

    const backgrounds = [
        { 
            id: 'hologram', 
            name: 'Holographic Display',
            description: 'Futuristic holographic projection with 3D wireframes and scanning interference patterns',
            techStack: 'Holography • 3D Graphics • Sci-Fi UI',
            icon: '👁️',
            complexity: 'High'
        },
        { 
            id: 'circuit', 
            name: 'Circuit Flora',
            description: 'Bio-electronic hybrid with organic circuit trees and flowing data streams',
            techStack: 'Bio-Tech • PCB Design • Organic Computing',
            icon: '🌿',
            complexity: 'High'
        },
        { 
            id: 'psychedelic', 
            name: 'Psychedelic Mandala',
            description: 'Trippy kaleidoscope patterns with vibrant colors and morphing geometry',
            techStack: 'Kaleidoscope • Color Theory • Generative Art',
            icon: '🌈',
            complexity: 'Extreme'
        },
        { 
            id: 'vortex', 
            name: 'Psychedelic Vortex',
            description: 'Swirling cosmic vortex with spiraling particle streams and energy fields',
            techStack: 'Fluid Dynamics • Particle Systems • Psychedelic Art',
            icon: '🌀',
            complexity: 'Extreme'
        }
    ];

    const exportConfig = () => {
        const config = {
            type: currentBg,
            opacity,
            animationSpeed,
            density,
            colorMode,
            customColor,
            isAnimated,
        };
        
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'background-config.json';
        a.click();
        URL.revokeObjectURL(url);
    };

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
            // Reset to default values
            const defaults = {
                type: 'hologram',
                opacity: 0.5,
                animationSpeed: 1,
                density: 1,
                colorMode: 'matrix',
                customColor: '#00ff41',
                isAnimated: true
            };
            
            // Update local state
            setCurrentBg(defaults.type);
            setOpacity(defaults.opacity);
            setAnimationSpeed(defaults.animationSpeed);
            setDensity(defaults.density);
            setColorMode(defaults.colorMode);
            setCustomColor(defaults.customColor);
            setIsAnimated(defaults.isAnimated);
            
            // Reset global state
            resetToDefaults();
        }
    };

    const currentBgData = backgrounds.find(bg => bg.id === currentBg);

    return (
        <div className={styles.playground}>
            {/* The GlobalBackground component will render the canvas based on context */}
            <div className={styles.content}>
                <div className={styles.header}>
                    <h1>Background Playground</h1>
                    <p className={styles.subtitle}>Professional-grade procedural backgrounds for developers</p>
                    <p className={styles.description}>
                        Advanced canvas-based background generation with real-time controls, performance scaling, and export capabilities. 
                        Built for tech professionals who appreciate both aesthetics and functionality.
                    </p>
                </div>

                <div className={styles.controlGrid}>
                    <div className={styles.backgroundGallery}>
                        <div className={styles.galleryHeader}>
                            <h3 className={styles.galleryTitle}>Background Gallery</h3>
                            <span className={styles.galleryCount}>{backgrounds.length} Types</span>
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
                            <h4 className={styles.sectionTitle}>Visual Controls</h4>
                            <div className={styles.controlGroup}>
                                <label className={styles.controlLabel}>Opacity: <span className={styles.controlValue}>{opacity.toFixed(2)}</span></label>
                                <input type="range" min="0" max="1" step="0.05" value={opacity} onChange={(e) => updateLocalAndGlobal({ opacity: parseFloat(e.target.value) })} className={styles.slider} />
                            </div>
                            <div className={styles.controlGroup}>
                                <label className={styles.controlLabel}>Animation Speed: <span className={styles.controlValue}>{animationSpeed.toFixed(1)}x</span></label>
                                <input type="range" min="0.1" max="5" step="0.1" value={animationSpeed} onChange={(e) => updateLocalAndGlobal({ animationSpeed: parseFloat(e.target.value) })} className={styles.slider} />
                            </div>
                            <div className={styles.controlGroup}>
                                <label className={styles.controlLabel}>Density: <span className={styles.controlValue}>{density.toFixed(1)}x</span></label>
                                <input type="range" min="0.2" max="3" step="0.1" value={density} onChange={(e) => updateLocalAndGlobal({ density: parseFloat(e.target.value) })} className={styles.slider} />
                            </div>
                        </div>

                        <div className={styles.controlSection}>
                            <h4 className={styles.sectionTitle}>Color Scheme</h4>
                            <div className={styles.selectGroup}>
                                {['matrix', 'cyber', 'terminal', 'ocean', 'fire', 'custom'].map(mode => (
                                    <button key={mode} className={`${styles.selectButton} ${colorMode === mode ? styles.active : ''}`} onClick={() => updateLocalAndGlobal({ colorMode: mode })}>{mode}</button>
                                ))}
                            </div>
                            {colorMode === 'custom' && (
                                <div className={styles.controlGroup} style={{ marginTop: '1rem' }}>
                                    <label className={styles.controlLabel}>Custom Color</label>
                                    <input type="color" value={customColor} onChange={(e) => updateLocalAndGlobal({ customColor: e.target.value })} className={styles.colorPicker} />
                                </div>
                            )}
                        </div>

                        <div className={styles.controlSection}>
                            <h4 className={styles.sectionTitle}>Performance</h4>
                             <div className={styles.selectGroup}>
                                <button className={`${styles.selectButton} ${isAnimated ? styles.active : ''}`} onClick={() => updateLocalAndGlobal({ isAnimated: true })}>Animated</button>
                                <button className={`${styles.selectButton} ${!isAnimated ? styles.active : ''}`} onClick={() => updateLocalAndGlobal({ isAnimated: false })}>Static</button>
                            </div>
                        </div>

                    </div>
                </div>

                <div className={styles.previewSection}>
                    <div className={styles.previewHeader}>
                        <h2 className={styles.previewTitle}>Live Preview: {currentBgData?.name}</h2>
                        {isAnimated && (
                            <div className={styles.liveIndicator}>
                                <span className={styles.pulseIndicator}></span>
                                Procedural Generation Active
                            </div>
                        )}
                    </div>
                    <div className={styles.previewContent}>
                        <h1>Tech isn't the hard part.</h1>
                        <h2>Systems, behavior, and questions are.</h2>
                        <p>This is a preview of how the background appears on a content page.</p>
                    </div>
                </div>

                {/* Current Configuration Display */}
                <div className={styles.configSection}>
                    <div className={styles.configDisplay}>
                        <div className={styles.codeDisplay}>
                            <code>background: "{currentBg}",</code>
                            <code>opacity: {opacity},</code>
                            <code>animationSpeed: {animationSpeed},</code>
                            <code>density: {density},</code>
                            <code>colorScheme: "{colorMode}",</code>
                            <code>complexity: "{currentBgData?.complexity}",</code>
                            <code>techStack: "{currentBgData?.techStack}"</code>
                        </div>
                    </div>
                </div>

                {/* Export & Share Section */}
                <div className={styles.exportPanel}>
                    <h3 className={styles.exportTitle}>Export & Share</h3>
                    <div className={styles.exportButtons}>
                        <button onClick={exportConfig} className={styles.exportButton}>
                            💾 Export Config
                        </button>
                        <button onClick={shareConfig} className={styles.exportButton}>
                            🔗 Share URL
                        </button>
                        <button onClick={() => window.print()} className={styles.exportButton}>
                            🖨️ Print Preview
                        </button>
                        <button onClick={resetAllSettings} className={`${styles.exportButton} ${styles.resetButton}`}>
                            🔄 Reset to Defaults
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BackgroundTest;
