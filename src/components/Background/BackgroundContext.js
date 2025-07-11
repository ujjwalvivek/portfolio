import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';
import { usePrefersReducedMotion } from '../A11y/UsePrefersReducedMotion';


const BackgroundContext = createContext();

export const useBackground = () => {
    const context = useContext(BackgroundContext);
    if (!context) {
        throw new Error('useBackground must be used within a BackgroundProvider');
    }
    return context;
};

export const BackgroundProvider = ({ children }) => {

    // --- Use prefersReducedMotion for animations ---
    const prefersReducedMotion = usePrefersReducedMotion();


    // --- Add isMobile logic ---
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

    // --- Use isMobile for defaults ---
    const [backgroundConfig, setBackgroundConfig] = useState(() => {
        try {
            const saved = localStorage.getItem('globalBackgroundConfig');
            return saved ? JSON.parse(saved) : {
                type: 'psychedelic',
                opacity: 0.7,
                animationSpeed: 1,
                density: isMobile ? 2 : 2.5, // <-- use isMobile here
                colorMode: 'custom',
                customColor: '#d63031',
                isAnimated: true,
            };
        } catch (e) {
            console.error('Error loading background config:', e);
            return {
                type: 'psychedelic',
                opacity: 0.7,
                animationSpeed: 1,
                density: isMobile ? 2 : 2.5, // <-- use isMobile here
                colorMode: 'custom',
                customColor: '#d63031',
                isAnimated: true,
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
                        type: 'psychedelic',
                        opacity: 0.7,
                        animationSpeed: 1,
                        density: isMobile ? 2 : 2.5,
                        colorMode: 'custom',
                        customColor: '#d63031',
                        isAnimated: true,
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

        // If prefersReducedMotion is true, disable animations globally
    useEffect(() => {
        if (prefersReducedMotion && backgroundConfig.type !== 'none') {
            setBackgroundConfig(prev => ({
                ...prev,
                type: backgroundConfig.type,
                isAnimated: false,
            }));
        }
        else {
            setBackgroundConfig(prev => ({
                ...prev,
                isAnimated: true,
            }));
        }
    }, [prefersReducedMotion, backgroundConfig.type]);

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
            clearStoredConfig
        }}>
            {children}
        </BackgroundContext.Provider>
    );
};
