/**
 *  ██████╗ ██████╗ ██╗      ██████╗ ██████╗                 
 * ██╔════╝██╔═══██╗██║     ██╔═══██╗██╔══██╗                
 * ██║     ██║   ██║██║     ██║   ██║██████╔╝                
 * ██║     ██║   ██║██║     ██║   ██║██╔══██╗                
 * ╚██████╗╚██████╔╝███████╗╚██████╔╝██║  ██║                
 *  ╚═════╝ ╚═════╝ ╚══════╝ ╚═════╝ ╚═╝  ╚═╝                
 *                                                           
 * ██╗   ██╗████████╗██╗██╗     ███████╗    ██╗   ██╗██████╗ 
 * ██║   ██║╚══██╔══╝██║██║     ██╔════╝    ██║   ██║╚════██╗
 * ██║   ██║   ██║   ██║██║     ███████╗    ██║   ██║ █████╔╝
 * ██║   ██║   ██║   ██║██║     ╚════██║    ╚██╗ ██╔╝██╔═══╝ 
 * ╚██████╔╝   ██║   ██║███████╗███████║     ╚████╔╝ ███████╗
 *  ╚═════╝    ╚═╝   ╚═╝╚══════╝╚══════╝      ╚═══╝  ╚══════╝
 *                                                           
 */

/**========================================================================
 **                     Context Hooks 
 *========================================================================**/
import { useContext, useEffect } from 'react';
import { useBackground } from './BackgroundContext';
import { ThemeContext } from '../Utils/ThemeSwitcher/ThemeContext';

/***
 *    ███╗   ███╗ █████╗ ████████╗██╗  ██╗
 *    ████╗ ████║██╔══██╗╚══██╔══╝██║  ██║
 *    ██╔████╔██║███████║   ██║   ███████║
 *    ██║╚██╔╝██║██╔══██║   ██║   ██╔══██║
 *    ██║ ╚═╝ ██║██║  ██║   ██║   ██║  ██║
 *    ╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝
 *                                        
 */

/**============================================
 **   Convert hex color to RGB object
 *=============================================**/
export const hexToRgb = (hex) => {
    //! Handle null/undefined
    if (!hex) {
        console.warn(`Invalid hex color: ${hex}, using black as fallback`);
        return { r: 0, g: 0, b: 0 };
    }

    //* Convert to string and trim
    const hexStr = String(hex).trim();

    //* Validate hex string format - accept 6 or 8 character hex (with alpha)
    if (!/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(hexStr)) {
        console.warn(`Invalid hex color format: ${hex}, using black as fallback`);
        return { r: 0, g: 0, b: 0 };
    }

    //* Extract RGB components (ignore alpha if present)
    const r = parseInt(hexStr.slice(1, 3), 16);
    const g = parseInt(hexStr.slice(3, 5), 16);
    const b = parseInt(hexStr.slice(5, 7), 16);

    return { r, g, b };
};

/**============================================
 **   Convert RGB object to hex string
 *=============================================**/
const rgbToHex = (r, g, b) => {
    const toHex = (n) => {
        const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**============================================
 **  Average an array of RGB objects using simple arithmetic mean
 *=============================================**/
const averageRgbColors = (rgbColors) => {
    if (!rgbColors || rgbColors.length === 0) {
        return { r: 0, g: 0, b: 0 };
    }

    const sum = rgbColors.reduce((acc, color) => ({
        r: acc.r + color.r,
        g: acc.g + color.g,
        b: acc.b + color.b
    }), { r: 0, g: 0, b: 0 });

    return {
        r: Math.round(sum.r / rgbColors.length),
        g: Math.round(sum.g / rgbColors.length),
        b: Math.round(sum.b / rgbColors.length)
    };
};

/**============================================
 **  Convert RGB to HSL for better color space averaging
 *=============================================**/
const rgbToHsl = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; //! achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
            default: h = 0; break;
        }
        h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
};

/**======================
 **  Convert HSL back to RGB
 *========================**/
const hslToRgb = (h, s, l) => {
    h /= 360;
    s /= 100;
    l /= 100;

    const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };

    if (s === 0) {
        return { r: l * 255, g: l * 255, b: l * 255 }; //! achromatic
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        return {
            r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
            g: Math.round(hue2rgb(p, q, h) * 255),
            b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255)
        };
    }
};

/**============================================
 **   Average colors in HSL space for more vibrant results
 *=============================================**/
const averageRgbColorsHSL = (rgbColors) => {
    if (!rgbColors || rgbColors.length === 0) {
        return { r: 0, g: 0, b: 0 };
    }

    //* Convert to HSL
    const hslColors = rgbColors.map(({ r, g, b }) => rgbToHsl(r, g, b));

    //* Average HSL values (special handling for hue)
    let avgH = 0, avgS = 0, avgL = 0;
    let validHues = [];

    hslColors.forEach(({ h, s, l }) => {
        avgS += s;
        avgL += l;
        if (s > 5) { //! Only consider hue if color is saturated enough
            validHues.push(h);
        }
    });

    //* Average hue using circular mean for better results
    if (validHues.length > 0) {
        const x = validHues.reduce((sum, h) => sum + Math.cos(h * Math.PI / 180), 0) / validHues.length;
        const y = validHues.reduce((sum, h) => sum + Math.sin(h * Math.PI / 180), 0) / validHues.length;
        avgH = Math.atan2(y, x) * 180 / Math.PI;
        if (avgH < 0) avgH += 360;
    }

    avgS /= hslColors.length;
    avgL /= hslColors.length;

    //* Convert back to RGB
    return hslToRgb(avgH, avgS, avgL);
};

/**============================================
 **  Get dominant color from the palette (most saturated)
 *=============================================**/
const getDominantColor = (rgbColors) => {
    if (!rgbColors || rgbColors.length === 0) {
        return { r: 0, g: 0, b: 0 };
    }

    //* Find the most saturated color
    let maxSaturation = 0;
    let dominantColor = rgbColors[0];

    rgbColors.forEach(color => {
        const hsl = rgbToHsl(color.r, color.g, color.b);
        if (hsl.s > maxSaturation) {
            maxSaturation = hsl.s;
            dominantColor = color;
        }
    });

    return dominantColor;
};

/**
 *     ██████╗ ██████╗ ██████╗ ███████╗
 *    ██╔════╝██╔═══██╗██╔══██╗██╔════╝
 *    ██║     ██║   ██║██║  ██║█████╗  
 *    ██║     ██║   ██║██║  ██║██╔══╝  
 *    ╚██████╗╚██████╔╝██████╔╝███████╗
 *     ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝
 *                                     
 */

/**============================================
 **  Adaptive color schemes based on theme mode
 *=============================================**/
export const getThemeColors = (darkMode) => {

    return {
        cyber: darkMode ? { primary: '#ff0080', secondary: '#8000ff', accent: '#00ffff' } : { primary: '#d63384', secondary: '#6f42c1', accent: '#0dcaf0' },
        ocean: darkMode ? { primary: '#00aaff', secondary: '#0066aa', accent: '#00ffff' } : { primary: '#0d6efd', secondary: '#0a58ca', accent: '#17a2b8' },
        fire: darkMode ? { primary: '#ff4500', secondary: '#ff6600', accent: '#ffff00' } : { primary: '#fd7e14', secondary: '#dc3545', accent: '#ffc107' },
        spark: darkMode ? { primary: '#00ff41', secondary: '#0080ff', accent: '#ff4500' } : { primary: '#28a745', secondary: '#007bff', accent: '#fd7e14' },
        forest: darkMode ? { primary: '#90EE90', secondary: '#8FBC8F', accent: '#F0E68C' } : { primary: '#6B8E23', secondary: '#9ACD32', accent: '#DEB887' },
        synthwave: darkMode ? { primary: '#ff6ec7', secondary: '#7209b7', accent: '#00f5ff' } : { primary: '#e91e63', secondary: '#9c27b0', accent: '#00bcd4' },
        sunset: darkMode ? { primary: '#ff6b35', secondary: '#f7931e', accent: '#ffcd3c' } : { primary: '#ff5722', secondary: '#ff9800', accent: '#ffc107' },
        midnight: darkMode ? { primary: '#1e3a8a', secondary: '#3730a3', accent: '#6366f1' } : { primary: '#1565c0', secondary: '#1976d2', accent: '#42a5f5' },
        aurora: darkMode ? { primary: '#10b981', secondary: '#06b6d4', accent: '#8b5cf6' } : { primary: '#059669', secondary: '#0891b2', accent: '#7c3aed' },
        neon: darkMode ? { primary: '#39ff14', secondary: '#ff073a', accent: '#ff9f00' } : { primary: '#4caf50', secondary: '#f44336', accent: '#ff9800' }
    };
};

/**========================================================================
**    Determine current colors based on wallpaper and color mode
*========================================================================**/
export const getCurrentColors = (backgroundConfig, darkMode) => {
    const themeColors = getThemeColors(darkMode);

    /**======================
     **  Custom color mode
     *========================**/
    if (backgroundConfig.colorMode === 'custom' && backgroundConfig.customColor) {
        return {
            primary: backgroundConfig.customColor,
            secondary: backgroundConfig.customColor + '80',
            accent: backgroundConfig.customColor + '60',
            background: darkMode ? '#0a0a0a' : '#f8f9fa'
        };
    }

    /**======================
     **  Themed color mode
     *========================**/
    if (backgroundConfig.colorMode && themeColors[backgroundConfig.colorMode]) {
        return {
            ...themeColors[backgroundConfig.colorMode],
            background: darkMode ? '#0a0a0a' : '#f8f9fa'
        };
    }

    return themeColors.forest; //! Error handling to set default colors
};

/**========================================================================
 **        Get all colors from the current theme as an array
 *========================================================================**/
export const getAllThemeColors = (backgroundConfig, darkMode = false) => {
    try {
        const colors = getCurrentColors(backgroundConfig, darkMode);
        return [colors.primary, colors.secondary, colors.accent, colors.background]
            .filter(color => color && typeof color === 'string')
            .map(color => {
                //! Ensure we return clean 6-character hex codes for display
                const rgb = hexToRgb(color);
                return rgbToHex(rgb.r, rgb.g, rgb.b);
            });
    } catch (error) {
        console.error('Error getting theme colors:', error);
        return [];
    }
};

/**============================================
 **   Get color information for debugging purposes
 *=============================================**/
export const getColorInfo = (backgroundConfig, darkMode = false) => {
    try {
        const isDarkMode = darkMode;

        const colors = getCurrentColors(backgroundConfig, isDarkMode);
        const averageHex = getAverageHex(backgroundConfig, false, isDarkMode);
        const averageHexWithBg = getAverageHex(backgroundConfig, true, isDarkMode);

        return {
            theme: backgroundConfig.type || 'quantum',
            colorMode: backgroundConfig.colorMode,
            customColor: backgroundConfig.customColor,
            darkMode: isDarkMode,
            colors: {
                primary: colors.primary,
                secondary: colors.secondary,
                accent: colors.accent,
                background: colors.background
            },
            averageHex,
            averageHexWithBackground: averageHexWithBg,
            rgbValues: {
                primary: hexToRgb(colors.primary),
                secondary: hexToRgb(colors.secondary),
                accent: hexToRgb(colors.accent),
                background: hexToRgb(colors.background)
            }
        };
    } catch (error) {
        console.error('Error getting color info:', error);
        return null;
    }
};

/***
 *     █████╗ ██╗   ██╗███████╗██████╗  █████╗  ██████╗ ███████╗ ██╗ ██╗ 
 *    ██╔══██╗██║   ██║██╔════╝██╔══██╗██╔══██╗██╔════╝ ██╔════╝████████╗
 *    ███████║██║   ██║█████╗  ██████╔╝███████║██║  ███╗█████╗  ╚██╔═██╔╝
 *    ██╔══██║╚██╗ ██╔╝██╔══╝  ██╔══██╗██╔══██║██║   ██║██╔══╝  ████████╗
 *    ██║  ██║ ╚████╔╝ ███████╗██║  ██║██║  ██║╚██████╔╝███████╗╚██╔═██╔╝
 *    ╚═╝  ╚═╝  ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝ ╚═╝ ╚═╝ 
 *                                                                       
 */

export const getAverageHex = (backgroundConfig, includeBackground = false, darkMode = false, method = 'hsl') => {
    try {
        const colors = getCurrentColors(backgroundConfig, darkMode);
        const colorValues = [colors.primary, colors.secondary, colors.accent];
        if (includeBackground) {
            colorValues.push(colors.background);
        }

        const rgbColors = colorValues
            .filter(color => color && typeof color === 'string') //! Filter out invalid colors
            .map(color => hexToRgb(color)); //! No need to slice, hexToRgb handles alpha

        //* Calculate average using specified method
        let averageRgb;
        switch (method) {
            case 'hsl':
                averageRgb = averageRgbColorsHSL(rgbColors);
                break;
            case 'dominant':
                averageRgb = getDominantColor(rgbColors);
                break;
            case 'rgb':
            default:
                averageRgb = averageRgbColors(rgbColors);
                break;
        }

        //! Convert back to hex
        return rgbToHex(averageRgb.r, averageRgb.g, averageRgb.b);

    } catch (error) {
        console.error('Error calculating average hex:', error);
        //! Return a safe fallback color based on provided dark mode
        return darkMode ? '#e0e0e0ff' : '#202020ff';
    }
};

/***
 *     ██████╗███████╗███████╗    ██╗   ██╗ █████╗ ██████╗ ██╗ █████╗ ██████╗ ██╗     ███████╗
 *    ██╔════╝██╔════╝██╔════╝    ██║   ██║██╔══██╗██╔══██╗██║██╔══██╗██╔══██╗██║     ██╔════╝
 *    ██║     ███████╗███████╗    ██║   ██║███████║██████╔╝██║███████║██████╔╝██║     █████╗  
 *    ██║     ╚════██║╚════██║    ╚██╗ ██╔╝██╔══██║██╔══██╗██║██╔══██║██╔══██╗██║     ██╔══╝  
 *    ╚██████╗███████║███████║     ╚████╔╝ ██║  ██║██║  ██║██║██║  ██║██████╔╝███████╗███████╗
 *     ╚═════╝╚══════╝╚══════╝      ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚══════╝
 *                                                                                            
 */

export const updateColorVariables = (backgroundConfig, element = document.documentElement, darkMode = false) => {
    try {
        const isBackgroundOff = !backgroundConfig || backgroundConfig.type === 'none';
        const isDarkMode = darkMode;

        let rgbAverage, hslAverage, dominantColor, colorInfo;

        if (isBackgroundOff) {
            //! Use theme-based fallback colors when background is off
            if (isDarkMode) {
                rgbAverage = '#b6b6b6ff';
                hslAverage = '#bbbbbbff';
                dominantColor = '#b4b4b4ff';
            } else {
                rgbAverage = '#252525ff';
                hslAverage = '#303030ff';
                dominantColor = '#222222ff';
            }

            colorInfo = {
                theme: 'none',
                colorMode: 'disabled',
                colors: null
            };
        } else {
            //* Get all three averaging methods from active background
            rgbAverage = getAverageHex(backgroundConfig, false, isDarkMode, 'rgb');
            hslAverage = getAverageHex(backgroundConfig, false, isDarkMode, 'hsl');
            dominantColor = getAverageHex(backgroundConfig, false, isDarkMode, 'dominant');
            colorInfo = getColorInfo(backgroundConfig);
        }

        //* Convert hex colors to RGB values for CSS variables
        const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : { r: 128, g: 128, b: 128 };
        };

        //* Convert to RGB values
        const rgbAvgRgb = hexToRgb(rgbAverage);
        const hslAvgRgb = hexToRgb(hslAverage);
        const dominantRgb = hexToRgb(dominantColor);

        /**======================
         **  Update CSS custom properties
         *========================**/
        element.style.setProperty('--dynamic-rgb-average', rgbAverage);
        element.style.setProperty('--dynamic-rgb-average-rgb', `${rgbAvgRgb.r}, ${rgbAvgRgb.g}, ${rgbAvgRgb.b}`);

        element.style.setProperty('--dynamic-hsl-average', hslAverage);
        element.style.setProperty('--dynamic-hsl-average-rgb', `${hslAvgRgb.r}, ${hslAvgRgb.g}, ${hslAvgRgb.b}`);

        element.style.setProperty('--dynamic-dominant-color', dominantColor);
        element.style.setProperty('--dynamic-dominant-color-rgb', `${dominantRgb.r}, ${dominantRgb.g}, ${dominantRgb.b}`);

        /**======================
         **  Also set theme info variables
         *========================**/
        element.style.setProperty('--dynamic-theme-name', `"${colorInfo?.theme || 'unknown'}"`);
        element.style.setProperty('--dynamic-color-mode', `"${colorInfo?.colorMode || 'default'}"`);

        //! Optional: Set individual theme colors if available
        if (colorInfo?.colors) {
            Object.entries(colorInfo.colors).forEach(([name, color]) => {
                const colorRgb = hexToRgb(color);
                element.style.setProperty(`--dynamic-theme-${name}`, String(color));
                element.style.setProperty(`--dynamic-theme-${name}-rgb`, `${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}`);
            });
        }

    } catch (error) {
        console.error('Error updating CSS color variables:', error);
    }
};

/***
 *    ███████╗██╗  ██╗██████╗  ██████╗ ██████╗ ████████╗
 *    ██╔════╝╚██╗██╔╝██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝
 *    █████╗   ╚███╔╝ ██████╔╝██║   ██║██████╔╝   ██║   
 *    ██╔══╝   ██╔██╗ ██╔═══╝ ██║   ██║██╔══██╗   ██║   
 *    ███████╗██╔╝ ██╗██║     ╚██████╔╝██║  ██║   ██║   
 *    ╚══════╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝   
 *                                                      
*/

export const RealTimeColorChange = () => {
    const { backgroundConfig } = useBackground();
    const { darkMode } = useContext(ThemeContext);

    useEffect(() => {
        //* Update CSS custom properties with current color averages, passing darkMode for theme-aware updates
        updateColorVariables(backgroundConfig, document.documentElement, darkMode);
    }, [backgroundConfig, darkMode]);
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