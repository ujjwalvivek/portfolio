/**
 * ██╗    ██╗ █████╗ ██╗     ██╗     ██████╗  █████╗ ██████╗ ███████╗██████╗ 
 * ██║    ██║██╔══██╗██║     ██║     ██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔══██╗
 * ██║ █╗ ██║███████║██║     ██║     ██████╔╝███████║██████╔╝█████╗  ██████╔╝
 * ██║███╗██║██╔══██║██║     ██║     ██╔═══╝ ██╔══██║██╔═══╝ ██╔══╝  ██╔══██╗
 * ╚███╔███╔╝██║  ██║███████╗███████╗██║     ██║  ██║██║     ███████╗██║  ██║
 *  ╚══╝╚══╝ ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝     ╚═╝  ╚═╝╚═╝     ╚══════╝╚═╝  ╚═╝
 *                                                                           
 *  ██████╗ ██████╗ ███╗   ██╗███████╗██╗ ██████╗                            
 * ██╔════╝██╔═══██╗████╗  ██║██╔════╝██║██╔════╝                            
 * ██║     ██║   ██║██╔██╗ ██║█████╗  ██║██║  ███╗                           
 * ██║     ██║   ██║██║╚██╗██║██╔══╝  ██║██║   ██║                           
 * ╚██████╗╚██████╔╝██║ ╚████║██║     ██║╚██████╔╝                           
 *  ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝     ╚═╝ ╚═════╝                            
 *                                                                           
 */

/**============================================
 **               Media Icons
 *=============================================**/
import { TiFlowSwitch } from "react-icons/ti";
import { GiVanillaFlower } from "react-icons/gi";
import { HiMiniCubeTransparent } from "react-icons/hi2";
import { BiSolidNetworkChart } from "react-icons/bi";

/**============================================
 **               Context Hooks
 *=============================================**/
import { getDeviceClass } from './useCapabilityProbe';

export const WALLPAPER_CONFIGS = {

    /***************************************************************
     **          Hologram Wallpaper Main Configuration
     ***************************************************************/
    hologram: {
        metadata: {
            name: 'Digital Hologram',
            description: 'Futuristic holographic projections with geometric patterns',
            techStack: ['Geometric', 'Projection', 'Sci-Fi'],
            icon: HiMiniCubeTransparent,
            colorModes: ['cyber', 'ocean', 'fire', 'spark', 'forest', 'custom']
        },
        performance: {
            highEnd: { opacity: 0.9, animationSpeed: 1.5, density: 1.0 },
            midRange: { opacity: 0.7, animationSpeed: 1.2, density: 0.8 },
            lowEnd: { opacity: 0.5, animationSpeed: 0.8, density: 0.6 },
            preview: { opacity: 0.4, animationSpeed: 0.6, density: 0.4 }
        },
        controls: {
            opacity: { min: 0.1, max: 0.9, step: 0.1, default: null },
            animationSpeed: { min: 0.1, max: 3.0, step: 0.1, default: null },
            density: { min: 0.2, max: 1.5, step: 0.1, default: null }
        }
    },

    /***************************************************************
     **          Circuit Wallpaper Main Configuration
     ***************************************************************/
    circuit: {
        metadata: {
            name: 'Circuit Flora',
            description: 'Organic circuits with flowing electrical patterns',
            techStack: ['Circuit Design', 'Organic Shapes', 'Electrical Flow'],
            icon: TiFlowSwitch,
            colorModes: ['cyber', 'ocean', 'fire', 'spark', 'forest', 'custom']
        },
        performance: {
            highEnd: { opacity: 0.9, animationSpeed: 1.4, density: 1.2 },
            midRange: { opacity: 0.7, animationSpeed: 1.1, density: 0.9 },
            lowEnd: { opacity: 0.5, animationSpeed: 0.7, density: 0.6 },
            preview: { opacity: 0.3, animationSpeed: 0.5, density: 0.4 }
        },
        controls: {
            opacity: { min: 0.1, max: 0.9, step: 0.1, default: null },
            animationSpeed: { min: 0.1, max: 2.5, step: 0.1, default: null },
            density: { min: 0.3, max: 1.8, step: 0.1, default: null }
        }
    },

    /***************************************************************
     **          Psychedelic Wallpaper Main Configuration
     ***************************************************************/
    psychedelic: {
        metadata: {
            name: 'Psych Dream',
            description: 'Trippy kaleidoscope patterns with vibrant colors',
            techStack: ['Kaleidoscope', 'Color Theory', 'Generative Art'],
            icon: GiVanillaFlower,
            colorModes: ['cyber', 'ocean', 'fire', 'spark', 'forest', 'synthwave', 'sunset', 'midnight', 'aurora', 'neon', 'custom']
        },
        performance: {
            highEnd: { opacity: 0.8, animationSpeed: 1.0, density: 2.6 },
            midRange: { opacity: 0.6, animationSpeed: 0.8, density: 1.8 },
            lowEnd: { opacity: 0.4, animationSpeed: 0.6, density: 1.2 },
            preview: { opacity: 0.3, animationSpeed: 0.4, density: 0.8 }
        },
        controls: {
            opacity: { min: 0.1, max: 0.8, step: 0.1, default: null },
            animationSpeed: { min: 0.1, max: 2.0, step: 0.1, default: null },
            density: { min: 0.2, max: 2.6, step: 0.1, default: null }
        }
    },

    /***************************************************************
     **          Vortex Wallpaper Main Configuration
     ***************************************************************/
    vortex: {
        metadata: {
            name: 'Quantum Nodes',
            description: 'Interconnected quantum particles in dynamic motion',
            techStack: ['Particle Physics', 'Network Theory', 'Quantum Effects'],
            icon: BiSolidNetworkChart,
            colorModes: ['cyber', 'ocean', 'fire', 'spark', 'forest', 'custom']
        },
        performance: {
            highEnd: { opacity: 0.9, animationSpeed: 1.3, density: 1.1 },
            midRange: { opacity: 0.7, animationSpeed: 1.0, density: 0.8 },
            lowEnd: { opacity: 0.5, animationSpeed: 0.7, density: 0.5 },
            preview: { opacity: 0.4, animationSpeed: 0.5, density: 0.3 }
        },
        controls: {
            opacity: { min: 0.1, max: 0.9, step: 0.1, default: null },
            animationSpeed: { min: 0.1, max: 2.5, step: 0.1, default: null },
            density: { min: 0.2, max: 1.5, step: 0.1, default: null }
        }
    }
};

/**============================================
 **    Configuration Selector Function
 *=============================================**/
export const getWallpaperConfig = (wallpaperType, context = 'fullscreen', deviceClass = null) => {
    const config = WALLPAPER_CONFIGS[wallpaperType];
    if (!config) {
        console.warn(`Unknown wallpaper type: ${wallpaperType}`);
        return null;
    }

    //* INFO: For preview context, always use preview performance profile
    if (context === 'preview') {
        return {
            type: wallpaperType,
            ...config.performance.preview,
            colorMode: 'cyber', // Default for previews
            isAnimated: true
        };
    }

    /* Get Device Class and its appropriate performance profile with fallback */
    const targetDeviceClass = deviceClass || getDeviceClass();
    const performanceProfile = config.performance[targetDeviceClass] ||
        config.performance.midRange ||
        { opacity: 0.6, animationSpeed: 1.0, density: 1.0 };

    return {
        type: wallpaperType,
        ...performanceProfile,
        colorMode: 'cyber',
        isAnimated: true,
        deviceClass: targetDeviceClass
    };
};

/**============================================
 **    Get defaults for a wallpaper type
 *=============================================**/
export const getSmartDefaults = (wallpaperType, deviceClass = null) => {
    const targetDeviceClass = deviceClass || getDeviceClass();
    const config = getWallpaperConfig(wallpaperType, 'fullscreen', targetDeviceClass);

    if (!config) return null;

    return {
        ...config,
        ...(targetDeviceClass === 'lowEnd' && {
            //! WARNING: Force more conservative settings for low-end devices
            opacity: Math.min(config.opacity, 0.6),
            animationSpeed: Math.min(config.animationSpeed, 0.8)
        })
    };
};

/**========================================================================
 **        Get metadata and control ranges for a wallpaper type
 *========================================================================**/
export const getWallpaperMeta = (wallpaperType) => { return WALLPAPER_CONFIGS[wallpaperType]?.metadata || null; };
export const getControlRanges = (wallpaperType) => { return WALLPAPER_CONFIGS[wallpaperType]?.controls || null; };
export const getAllWallpaperTypes = () => { return Object.keys(WALLPAPER_CONFIGS); };

/**
 * ███████╗ ██████╗ ███████╗
 * ██╔════╝██╔═══██╗██╔════╝
 * █████╗  ██║   ██║█████╗  
 * ██╔══╝  ██║   ██║██╔══╝  
 * ███████╗╚██████╔╝██║     
 * ╚══════╝ ╚═════╝ ╚═╝     
 *                          
 */