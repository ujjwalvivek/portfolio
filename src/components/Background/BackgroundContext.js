import React, { createContext, useState, useContext } from 'react';

const BackgroundContext = createContext();

export const useBackground = () => {
    const context = useContext(BackgroundContext);
    if (!context) {
        throw new Error('useBackground must be used within a BackgroundProvider');
    }
    return context;
};

export const BackgroundProvider = ({ children }) => {
    const [backgroundConfig, setBackgroundConfig] = useState(() => {
        try {
            const saved = localStorage.getItem('globalBackgroundConfig');
            return saved ? JSON.parse(saved) : {
                type: 'psychedelic',
                opacity: 0.7,
                animationSpeed: 10,
                density: 1.8,
                colorMode: 'custom',
                customColor: '#d63031',
                isAnimated: true,
                particleCount: 75
            };
        } catch (e) {
            console.error('Error loading background config:', e);
            return {
                type: 'psychedelic',
                opacity: 0.7,
                animationSpeed: 10,
                density: 1.8,
                colorMode: 'custom',
                customColor: '#d63031',
                isAnimated: true,
                particleCount: 75
            };
        }
    });

    const updateBackgroundConfig = (newConfig) => {
        setBackgroundConfig(prev => {
            const updated = { ...prev, ...newConfig };
            try {
                localStorage.setItem('globalBackgroundConfig', JSON.stringify(updated));
                
                // If we're setting a wallpaper (not 'none'), save it as last wallpaper
                if (updated.type && updated.type !== 'none') {
                    localStorage.setItem('lastWallpaperConfig', JSON.stringify(updated));
                }
            } catch (e) {
                console.error('Error saving background config:', e);
            }
            return updated;
        });
    };

    const toggleBackground = () => {
        if (backgroundConfig.type === 'none') {
            // Restore last wallpaper from localStorage
            try {
                const lastWallpaperData = localStorage.getItem('lastWallpaperConfig');
                if (lastWallpaperData) {
                    const lastConfig = JSON.parse(lastWallpaperData);
                    updateBackgroundConfig(lastConfig);
                } else {
                    // Fallback to default hologram if no saved wallpaper
                    updateBackgroundConfig({ 
                        type: 'hologram',
                        opacity: 0.5,
                        animationSpeed: 1,
                        density: 1,
                        colorMode: 'matrix',
                        customColor: '#00ff41',
                        isAnimated: true
                    });
                }
            } catch (e) {
                console.error('Error restoring last wallpaper:', e);
                updateBackgroundConfig({ type: 'hologram' });
            }
        } else {
            // Save current wallpaper settings before hiding
            try {
                const currentWallpaperConfig = { ...backgroundConfig };
                localStorage.setItem('lastWallpaperConfig', JSON.stringify(currentWallpaperConfig));
            } catch (e) {
                console.error('Error saving current wallpaper:', e);
            }
            updateBackgroundConfig({ ...backgroundConfig, type: 'none' });
        }
    };

    const resetToDefaults = () => {
        const defaultConfig = {
            type: 'hologram',
            opacity: 0.5,
            animationSpeed: 1,
            density: 1,
            colorMode: 'matrix',
            customColor: '#00ff41',
            isAnimated: true,
            particleCount: 100
        };
        setBackgroundConfig(defaultConfig);
        try {
            localStorage.setItem('globalBackgroundConfig', JSON.stringify(defaultConfig));
        } catch (e) {
            console.error('Error saving default background config:', e);
        }
    };

    const clearStoredConfig = () => {
        try {
            localStorage.removeItem('globalBackgroundConfig');
        } catch (e) {
            console.error('Error clearing background config:', e);
        }
    };

    return (
        <BackgroundContext.Provider value={{
            backgroundConfig,
            updateBackgroundConfig,
            toggleBackground,
            resetToDefaults,
            clearStoredConfig
        }}>
            {children}
        </BackgroundContext.Provider>
    );
};
