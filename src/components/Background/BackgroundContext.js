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
                type: 'hologram',
                opacity: 0.5,
                animationSpeed: 1,
                density: 1,
                colorMode: 'matrix',
                customColor: '#00ff41',
                isAnimated: true,
                particleCount: 100
            };
        } catch (e) {
            console.error('Error loading background config:', e);
            return {
                type: 'hologram',
                opacity: 0.5,
                animationSpeed: 1,
                density: 1,
                colorMode: 'matrix',
                customColor: '#00ff41',
                isAnimated: true,
                particleCount: 100
            };
        }
    });

    const updateBackgroundConfig = (newConfig) => {
        setBackgroundConfig(prev => {
            const updated = { ...prev, ...newConfig };
            try {
                localStorage.setItem('globalBackgroundConfig', JSON.stringify(updated));
            } catch (e) {
                console.error('Error saving background config:', e);
            }
            return updated;
        });
    };

    const toggleBackground = () => {
        updateBackgroundConfig({ 
            type: backgroundConfig.type === 'none' ? 'hologram' : 'none' 
        });
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
