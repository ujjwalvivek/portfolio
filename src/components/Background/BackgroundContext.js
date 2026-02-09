/**
 *  ██████╗ █████╗ ███╗   ██╗██╗   ██╗ █████╗ ███████╗          
 * ██╔════╝██╔══██╗████╗  ██║██║   ██║██╔══██╗██╔════╝          
 * ██║     ███████║██╔██╗ ██║██║   ██║███████║███████╗          
 * ██║     ██╔══██║██║╚██╗██║╚██╗ ██╔╝██╔══██║╚════██║          
 * ╚██████╗██║  ██║██║ ╚████║ ╚████╔╝ ██║  ██║███████║          
 *  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═══╝  ╚═══╝  ╚═╝  ╚═╝╚══════╝          
 *                                                              
 *  ██████╗ ██████╗ ███╗   ██╗████████╗███████╗██╗  ██╗████████╗
 * ██╔════╝██╔═══██╗████╗  ██║╚══██╔══╝██╔════╝╚██╗██╔╝╚══██╔══╝
 * ██║     ██║   ██║██╔██╗ ██║   ██║   █████╗   ╚███╔╝    ██║   
 * ██║     ██║   ██║██║╚██╗██║   ██║   ██╔══╝   ██╔██╗    ██║   
 * ╚██████╗╚██████╔╝██║ ╚████║   ██║   ███████╗██╔╝ ██╗   ██║   
 *  ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚═╝  ╚═╝   ╚═╝   
 *                                                              
 */

/**========================================================================
 **                     Context Hooks 
 *========================================================================**/
import { createContext, useState, useContext, useMemo, useEffect, useCallback } from 'react';
import { usePrefersReducedMotion } from '../Modules/A11y/UsePrefersReducedMotion';
import { useCapabilityProbe, getDeviceClass } from './useCapabilityProbe';
import {
    getWallpaperConfig,
    getWallpaperMeta,
    getControlRanges,
    getAllWallpaperTypes,
    getSmartDefaults
} from './BackgroundConfig';

/**============================================
 **    Context for background settings
 *=============================================**/
const BackgroundContext = createContext(null);

/**============================================
 **   User settings persistence utilities
 *=============================================**/
const loadUserSettings = () => {
    try {
        const stored = localStorage.getItem('userWallpaperSettings');
        return stored ? JSON.parse(stored) : {};
    } catch (e) {
        console.error('Error loading user settings:', e);
        return {};
    }
};

const saveUserSettings = (settings) => {
    try {
        localStorage.setItem('userWallpaperSettings', JSON.stringify(settings));
    } catch (e) {
        console.error('Error saving user settings:', e);
    }
};

/**============================================
 **   Capability probe runner
 *=============================================**/
export const CapabilityProbeRunner = () => {
    useCapabilityProbe();      //* runs after provider context is ready
    return null;               //* renders nothing
};

/**============================================
 **   Background context hook
 *=============================================**/
export const useBackground = () => {
    const context = useContext(BackgroundContext);
    if (!context) {
        throw new Error('useBackground must be used within a BackgroundProvider');
    }
    return context;
};

/**============================================
 **   Background provider component
 *=============================================**/
export const BackgroundProvider = ({ children }) => {
    const prefersReducedMotion = usePrefersReducedMotion(); //* Use prefersReducedMotion for animations
    const deviceClass = useMemo(() => {
        const result = getDeviceClass();
        return result;
    }, []);
    const [userSettings, setUserSettings] = useState(() => loadUserSettings()); //* User settings persistence state

    /**======================
     **  Add isMobile logic
     *========================**/
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

    /**========================================================================
     **      Enhanced background config with smart defaults
     *========================================================================**/
    const [backgroundConfig, setBackgroundConfig] = useState(() => {
        try {
            const saved = localStorage.getItem('globalBackgroundConfig');
            if (saved) {
                const parsedConfig = JSON.parse(saved);
                //! Migrate old configs to new structure if needed
                return {
                    ...parsedConfig,
                    deviceClass: parsedConfig.deviceClass || deviceClass
                };
            }

            //* Use smart defaults for new users
            const smartDefaults = getSmartDefaults('psychedelic', deviceClass);
            return {
                ...smartDefaults,
                colorMode: 'custom',
                customColor: '#d63031',
                isAnimated: true,
            };
        } catch (e) {
            console.error('Error loading background config:', e);
            const smartDefaults = getSmartDefaults('psychedelic', deviceClass);
            return {
                ...smartDefaults,
                colorMode: 'custom',
                customColor: '#d63031',
                isAnimated: true,
            };
        }
    });

    /**============================================
    **   Background config updater
    *=============================================**/
    const updateBackgroundConfig = useCallback((newConfig) => {
        setBackgroundConfig(prev => {
            const updated = { ...prev, ...newConfig };
            try {
                localStorage.setItem('globalBackgroundConfig', JSON.stringify(updated));

                //* If we're setting a wallpaper (not 'none'), save it as last wallpaper
                if (updated.type && updated.type !== 'none') {
                    localStorage.setItem('lastWallpaperConfig', JSON.stringify(updated));
                }
            } catch (e) {
                console.error('Error saving background config:', e);
            }
            return updated;
        });
    }, []);

    /**============================================
     **    Background toggle function
     *=============================================**/
    const toggleBackground = () => {
        if (backgroundConfig.type === 'none') {
            //* Restore last wallpaper from localStorage
            try {
                const lastWallpaperData = localStorage.getItem('lastWallpaperConfig');
                if (lastWallpaperData) {
                    const lastConfig = JSON.parse(lastWallpaperData);
                    updateBackgroundConfig(lastConfig);
                } else {
                    //! Fallback to default hologram if no saved wallpaper
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
            //* Save current wallpaper settings before hiding
            try {
                const currentWallpaperConfig = { ...backgroundConfig };
                localStorage.setItem('lastWallpaperConfig', JSON.stringify(currentWallpaperConfig));
            } catch (e) {
                console.error('Error saving current wallpaper:', e);
            }
            updateBackgroundConfig({ ...backgroundConfig, type: 'none' });
        }
    };

    //! If prefersReducedMotion is true, disable animations globally
    useEffect(() => {
        if (prefersReducedMotion && backgroundConfig.type !== 'none') {
            setBackgroundConfig(prev => ({
                ...prev,
                type: backgroundConfig.type,
                isAnimated: false,
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

    /**========================================================================
     **      Enhanced wallpaper switching with settings preservation
     *========================================================================**/
    const switchWallpaper = useCallback((newType, preserveSettings = true) => {
        if (preserveSettings && backgroundConfig.type !== newType) {
            //! Save current settings to user settings storage
            const currentSettings = {
                opacity: backgroundConfig.opacity,
                animationSpeed: backgroundConfig.animationSpeed,
                density: backgroundConfig.density,
                colorMode: backgroundConfig.colorMode,
                customColor: backgroundConfig.customColor
            };

            const updatedUserSettings = {
                ...userSettings,
                [backgroundConfig.type]: currentSettings
            };

            setUserSettings(updatedUserSettings);
            saveUserSettings(updatedUserSettings);
        }

        //* Load saved settings or smart defaults for new wallpaper
        const savedSettings = userSettings[newType] || {};
        const smartDefaults = getSmartDefaults(newType, deviceClass);

        const finalConfig = {
            ...smartDefaults,
            ...savedSettings, //* User settings override defaults
            type: newType,
            isAnimated: backgroundConfig.isAnimated, //! Preserve animation state
        };

        updateBackgroundConfig(finalConfig);
    }, [backgroundConfig, userSettings, deviceClass, updateBackgroundConfig]);

    /**============================================
     **    User settings management
     *=============================================**/
    const saveCurrentWallpaperSettings = useCallback(() => {
        const currentSettings = {
            opacity: backgroundConfig.opacity,
            animationSpeed: backgroundConfig.animationSpeed,
            density: backgroundConfig.density,
            colorMode: backgroundConfig.colorMode,
            customColor: backgroundConfig.customColor
        };

        const updatedUserSettings = {
            ...userSettings,
            [backgroundConfig.type]: currentSettings
        };

        setUserSettings(updatedUserSettings);
        saveUserSettings(updatedUserSettings);
    }, [backgroundConfig, userSettings]);

    const resetWallpaperToDefaults = useCallback((wallpaperType = null) => {
        const targetType = wallpaperType || backgroundConfig.type;
        const smartDefaults = getSmartDefaults(targetType, deviceClass);

        //! Remove user settings for this wallpaper
        const updatedUserSettings = { ...userSettings };
        delete updatedUserSettings[targetType];
        setUserSettings(updatedUserSettings);
        saveUserSettings(updatedUserSettings);

        //! Apply smart defaults
        updateBackgroundConfig({
            ...smartDefaults,
            type: targetType,
            isAnimated: backgroundConfig.isAnimated,
        });
    }, [backgroundConfig, userSettings, deviceClass, updateBackgroundConfig]);

    return (
        <BackgroundContext.Provider value={{
            //* Core state
            backgroundConfig,
            updateBackgroundConfig,
            userSettings,

            //* Legacy functions
            toggleBackground,
            clearStoredConfig,

            //* Enhanced wallpaper management
            switchWallpaper,
            saveCurrentWallpaperSettings,
            resetWallpaperToDefaults,

            //* Configuration utilities
            getWallpaperConfig: (type, context, deviceClassOverride) =>
                getWallpaperConfig(type, context, deviceClassOverride || deviceClass),
            getWallpaperMeta,
            getControlRanges,
            getAllWallpaperTypes,
            getSmartDefaults: (type, deviceClassOverride) =>
                getSmartDefaults(type, deviceClassOverride || deviceClass),

            //* Device info
            deviceClass,
            isMobile,
        }}>
            <CapabilityProbeRunner />
            {children}
        </BackgroundContext.Provider>
    );
};

/**
 * ███████╗ ██████╗ ███████╗
 * ██╔════╝██╔═══██╗██╔════╝
 * █████╗  ██║   ██║█████╗  
 * ██╔══╝  ██║   ██║██╔══╝  
 * ███████╗╚██████╔╝██║     
 * ╚══════╝ ╚═════╝ ╚═╝     
 *                          
 */