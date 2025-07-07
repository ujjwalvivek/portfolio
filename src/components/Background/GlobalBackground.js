import React, { useRef, useEffect, useCallback, useContext } from 'react';
import { useBackground } from './BackgroundContext';
import { ThemeContext } from '../ThemeSwitcher/ThemeContext';
import styles from './GlobalBackground.module.css';

const GlobalBackground = () => {
    const { backgroundConfig } = useBackground();
    const { darkMode } = useContext(ThemeContext);
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const lastFrameTime = useRef(0);
    const fpsRef = useRef(0);
    const frameCount = useRef(0);
    const lastFpsUpdate = useRef(0);

    // Adaptive color schemes based on theme mode
    const getThemeColors = () => {
        if (darkMode) {
            // Dark mode colors
            return {
                quantum: { 
                    primary: '#00ffff', 
                    secondary: '#ff00ff', 
                    accent: '#ffff00',
                    background: '#0a0a0a'
                },
                datastream: { 
                    primary: '#00ff41', 
                    secondary: '#0080ff', 
                    accent: '#ff4500',
                    background: '#0d0d0d'
                }
            };
        } else {
            // Light mode colors
            return {
                quantum: { 
                    primary: '#4a90e2', 
                    secondary: '#7b68ee', 
                    accent: '#ff6b6b',
                    background: '#f8f9fa'
                },
                datastream: { 
                    primary: '#28a745', 
                    secondary: '#007bff', 
                    accent: '#fd7e14',
                    background: '#ffffff'
                }
            };
        }
    };

    const getCurrentColors = () => {
        const themeColors = getThemeColors();
        
        // If using old color mode system, map to appropriate wallpaper colors
        if (backgroundConfig.colorMode && backgroundConfig.colorMode !== 'matrix') {
            if (backgroundConfig.colorMode === 'custom' && backgroundConfig.customColor) {
                // Use custom color for both wallpapers
                return {
                    primary: backgroundConfig.customColor,
                    secondary: backgroundConfig.customColor + '80',
                    accent: backgroundConfig.customColor + '60',
                    background: darkMode ? '#0a0a0a' : '#f8f9fa'
                };
            }
            
            // Map old color modes to reasonable defaults
            const legacyColorMappings = {
                cyber: darkMode ? { primary: '#ff0080', secondary: '#8000ff', accent: '#00ffff' } : { primary: '#d63384', secondary: '#6f42c1', accent: '#0dcaf0' },
                terminal: darkMode ? { primary: '#ffff00', secondary: '#ff8000', accent: '#00ff00' } : { primary: '#fd7e14', secondary: '#dc3545', accent: '#198754' },
                ocean: darkMode ? { primary: '#00aaff', secondary: '#0066aa', accent: '#00ffff' } : { primary: '#0d6efd', secondary: '#0a58ca', accent: '#17a2b8' },
                fire: darkMode ? { primary: '#ff4500', secondary: '#ff6600', accent: '#ffff00' } : { primary: '#fd7e14', secondary: '#dc3545', accent: '#ffc107' }
            };
            
            const legacyColors = legacyColorMappings[backgroundConfig.colorMode];
            if (legacyColors) {
                return {
                    ...legacyColors,
                    background: darkMode ? '#0a0a0a' : '#f8f9fa'
                };
            }
        }
        
        // Default to theme-adaptive colors for the current wallpaper
        return themeColors[backgroundConfig.type] || themeColors.quantum;
    };

    // Helper function to get alpha-adjusted colors based on canvas opacity
    const getAlphaAdjustedColors = (colors) => {
        const canvasOpacity = backgroundConfig.opacity || 0.5;
        
        // Helper function to convert hex to rgb
        const hexToRgb = (hex) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return { r, g, b };
        };
        
        // Smooth alpha adjustment function - gradually increases alpha values as opacity increases
        const adjustAlpha = (alphaHex) => {
            const baseAlpha = parseInt(alphaHex, 16);
            
            // Smooth transition from normal alpha to boosted alpha
            // At opacity 0.5: use original alpha
            // At opacity 0.8: use 1.5x alpha  
            // At opacity 1.0: use 3x alpha
            let multiplier;
            if (canvasOpacity <= 0.5) {
                multiplier = 1.0;
            } else if (canvasOpacity <= 0.8) {
                // Linear interpolation from 1.0 to 1.5 between opacity 0.5 and 0.8
                const t = (canvasOpacity - 0.5) / 0.3;
                multiplier = 1.0 + t * 0.5;
            } else {
                // Linear interpolation from 1.5 to 3.0 between opacity 0.8 and 1.0
                const t = (canvasOpacity - 0.8) / 0.2;
                multiplier = 1.5 + t * 1.5;
            }
            
            const adjustedAlpha = Math.min(Math.round(baseAlpha * multiplier), 255);
            return adjustedAlpha / 255; // Return as 0-1 value for rgba
        };
        
        return {
            ...colors,
            primaryAlpha: (alphaHex) => {
                const rgb = hexToRgb(colors.primary);
                const alpha = adjustAlpha(alphaHex);
                return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
            },
            secondaryAlpha: (alphaHex) => {
                const rgb = hexToRgb(colors.secondary);
                const alpha = adjustAlpha(alphaHex);
                return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
            },
            accentAlpha: (alphaHex) => {
                const rgb = hexToRgb(colors.accent);
                const alpha = adjustAlpha(alphaHex);
                return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
            },
            backgroundAlpha: (alphaHex) => {
                const rgb = hexToRgb(colors.background);
                const alpha = adjustAlpha(alphaHex);
                return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
            }
        };
    };

    // Helper function to convert any color + alpha to rgba
    const hexWithAlpha = (hex, alphaHex) => {
        // Validate hex string
        if (typeof hex !== 'string' || !/^#([0-9a-fA-F]{6})$/.test(hex)) {
            // fallback to transparent if invalid
            return 'rgba(0,0,0,0)';
        }
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const alpha = parseInt(alphaHex, 16) / 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    // New wallpaper generators
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const generators = useCallback(() => ({
        hologram: (ctx, width, height, time = 0) => {
            const colors = getCurrentColors();
            const speed = backgroundConfig.animationSpeed || 1;
            const density = backgroundConfig.density || 1;
            const opacity = backgroundConfig.opacity || 0.5;

            // Holographic projection base field
            const holoGradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height) * 0.7);
            holoGradient.addColorStop(0, hexWithAlpha(colors.primary, '12'));
            holoGradient.addColorStop(0.4, hexWithAlpha(colors.accent, '08'));
            holoGradient.addColorStop(0.8, hexWithAlpha(colors.secondary, '06'));
            holoGradient.addColorStop(1, hexWithAlpha(colors.primary, '02'));
            ctx.fillStyle = holoGradient;
            ctx.fillRect(0, 0, width, height);

            // Holographic interference patterns (scanlines)
            const scanlineSpacing = 4;
            ctx.globalAlpha = 0.08; // Fixed subtle alpha
            ctx.strokeStyle = colors.primary;
            ctx.lineWidth = 1;
            
            for (let y = 0; y < height; y += scanlineSpacing) {
                const scanIntensity = Math.sin(time * 0.002 * speed + y * 0.01) * 0.5 + 0.5;
                const scanOffset = Math.sin(time * 0.001 * speed + y * 0.02) * 2;
                
                if (scanIntensity > 0.3) {
                    ctx.globalAlpha = 0.05 + scanIntensity * 0.03;
                    ctx.beginPath();
                    ctx.moveTo(0, y + scanOffset);
                    ctx.lineTo(width, y + scanOffset);
                    ctx.stroke();
                }
            }

            // 3D wireframe objects floating in space
            const objectCount = Math.floor(8 * density);
            
            for (let obj = 0; obj < objectCount; obj++) {
                const objTime = time * speed * 0.001 + obj * 2.5;
                const objX = width * 0.2 + (obj % 3) * width * 0.3 + Math.sin(objTime * 0.7) * 80;
                const objY = height * 0.2 + Math.floor(obj / 3) * height * 0.25 + Math.cos(objTime * 0.9) * 60;
                const objZ = Math.sin(objTime) * 100 + 200; // Z-depth for perspective
                const rotX = objTime * 0.8;
                const rotY = objTime * 1.2;
                const rotZ = objTime * 0.5;
                
                // Draw 3D cube wireframe with perspective
                const cubeSize = 40 + Math.sin(objTime * 1.5) * 15;
                const perspective = 500;
                
                // Define cube vertices
                const vertices = [
                    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
                    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
                ];
                
                // Rotate and project vertices
                const projectedVertices = vertices.map(([x, y, z]) => {
                    // Scale by cube size
                    x *= cubeSize;
                    y *= cubeSize;
                    z *= cubeSize;
                    
                    // 3D rotation
                    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
                    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
                    const cosZ = Math.cos(rotZ), sinZ = Math.sin(rotZ);
                    
                    // Rotate around X
                    let newY = y * cosX - z * sinX;
                    let newZ = y * sinX + z * cosX;
                    y = newY;
                    z = newZ;
                    
                    // Rotate around Y
                    let newX = x * cosY + z * sinY;
                    newZ = -x * sinY + z * cosY;
                    x = newX;
                    z = newZ;
                    
                    // Rotate around Z
                    newX = x * cosZ - y * sinZ;
                    newY = x * sinZ + y * cosZ;
                    
                    // Perspective projection
                    const scale = perspective / (perspective + z + objZ);
                    return [objX + newX * scale, objY + newY * scale, scale];
                });
                
                // Draw cube edges with holographic effect
                const edges = [
                    [0,1], [1,2], [2,3], [3,0], // Front face
                    [4,5], [5,6], [6,7], [7,4], // Back face
                    [0,4], [1,5], [2,6], [3,7]  // Connecting edges
                ];
                
                edges.forEach(([a, b]) => {
                    const [x1, y1, scale1] = projectedVertices[a];
                    const [x2, y2, scale2] = projectedVertices[b];
                    
                    // Fade edges based on Z-depth
                    const avgScale = (scale1 + scale2) * 0.5;
                    ctx.globalAlpha = opacity * avgScale * 0.6;
                    ctx.strokeStyle = obj % 2 === 0 ? colors.primary : colors.accent;
                    ctx.lineWidth = 1.5;
                    
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                    
                    // Holographic shimmer on edges
                    const shimmer = Math.sin(time * 0.005 * speed + obj + a + b) * 0.5 + 0.5;
                    if (shimmer > 0.8) {
                        ctx.globalAlpha = opacity * 0.4;
                        ctx.strokeStyle = colors.secondary;
                        ctx.lineWidth = 3;
                        ctx.stroke();
                    }
                });
                
                // Holographic vertices
                projectedVertices.forEach(([x, y, scale], i) => {
                    const vertexPulse = Math.sin(time * 0.008 * speed + obj + i) * 0.5 + 0.5;
                    ctx.globalAlpha = opacity * scale * vertexPulse * 0.8;
                    ctx.fillStyle = colors.accent;
                    ctx.beginPath();
                    ctx.arc(x, y, 3 * scale, 0, Math.PI * 2);
                    ctx.fill();
                });
            }

            // Holographic data streams
            const streamCount = Math.floor(15 * density);
            
            for (let s = 0; s < streamCount; s++) {
                const streamPhase = (time * speed * 0.02 + s * 0.4) % 1;
                const streamPath = s % 4; // 4 different stream patterns
                
                let streamX, streamY;
                
                switch (streamPath) {
                    case 0: // Horizontal sweep
                        streamX = streamPhase * width;
                        streamY = height * 0.3 + Math.sin(streamPhase * Math.PI * 2) * 50;
                        break;
                    case 1: // Vertical sweep
                        streamX = width * 0.7 + Math.cos(streamPhase * Math.PI * 2) * 80;
                        streamY = streamPhase * height;
                        break;
                    case 2: // Diagonal sweep
                        streamX = streamPhase * width;
                        streamY = streamPhase * height;
                        break;
                    case 3: // Circular sweep
                        const angle = streamPhase * Math.PI * 2;
                        streamX = width/2 + Math.cos(angle) * 200;
                        streamY = height/2 + Math.sin(angle) * 200;
                        break;
                    default:
                        // Default case for safety
                        streamX = streamPhase * width;
                        streamY = height * 0.5;
                }
                
                // Data stream trail
                for (let trail = 0; trail < 12; trail++) {
                    const trailOffset = trail * 8;
                    const trailAlpha = (1 - trail / 12) * opacity * 0.5;
                    
                    // Adjust trail position based on stream direction
                    let trailX = streamX - (streamPath === 0 ? trailOffset : 0);
                    let trailY = streamY - (streamPath === 1 ? trailOffset : 0);
                    
                    if (streamPath === 2) {
                        trailX = streamX - trailOffset * 0.7;
                        trailY = streamY - trailOffset * 0.7;
                    } else if (streamPath === 3) {
                        const trailAngle = (streamPhase - trail * 0.02) * Math.PI * 2;
                        trailX = width/2 + Math.cos(trailAngle) * 200;
                        trailY = height/2 + Math.sin(trailAngle) * 200;
                    }
                    
                    ctx.globalAlpha = trailAlpha;
                    ctx.fillStyle = trail < 3 ? colors.primary : colors.secondary;
                    
                    // Holographic data particles
                    const particleSize = 2 + (3 - Math.min(trail, 3)) * 0.5;
                    ctx.beginPath();
                    ctx.arc(trailX, trailY, particleSize, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Data glitch effect
                    if (trail === 0 && Math.sin(time * 0.01 * speed + s) > 0.9) {
                        ctx.globalAlpha = opacity * 0.6;
                        ctx.fillStyle = colors.accent;
                        ctx.fillRect(trailX - 4, trailY - 4, 8, 8);
                    }
                }
            }

            // Holographic grid overlay (subtle structural lines)
            ctx.globalAlpha = 0.06; // Very subtle
            ctx.strokeStyle = colors.secondary;
            ctx.lineWidth = 0.5;
            
            const gridSize = 100;
            
            // Perspective grid lines
            for (let x = 0; x <= width; x += gridSize) {
                const gridWave = Math.sin(time * 0.001 * speed + x * 0.01) * 5;
                ctx.beginPath();
                ctx.moveTo(x + gridWave, 0);
                ctx.lineTo(x + gridWave * 2, height);
                ctx.stroke();
            }
            
            for (let y = 0; y <= height; y += gridSize) {
                const gridWave = Math.cos(time * 0.001 * speed + y * 0.01) * 5;
                ctx.beginPath();
                ctx.moveTo(0, y + gridWave);
                ctx.lineTo(width, y + gridWave * 2);
                ctx.stroke();
            }
            
            // Holographic glitch artifacts
            if (Math.sin(time * 0.003 * speed) > 0.95) {
                const glitchCount = Math.floor(5 * density);
                ctx.globalCompositeOperation = 'screen';
                
                for (let g = 0; g < glitchCount; g++) {
                    const glitchX = (g * 234.5) % width;
                    const glitchY = (g * 123.7) % height;
                    const glitchW = 50 + (g * 43) % 100;
                    const glitchH = 3 + (g * 17) % 8;
                    
                    ctx.globalAlpha = opacity * 0.3;
                    ctx.fillStyle = g % 2 === 0 ? colors.primary : colors.accent;
                    ctx.fillRect(glitchX, glitchY, glitchW, glitchH);
                }
                
                ctx.globalCompositeOperation = 'source-over';
            }
            
            ctx.globalAlpha = 1;
        },

        circuit: (ctx, width, height, time = 0) => {
            const colors = getCurrentColors();
            const speed = backgroundConfig.animationSpeed || 1;
            const density = backgroundConfig.density || 1;
            const opacity = backgroundConfig.opacity || 0.5;

            // Organic circuit substrate (bio-electronic background)
            const substrate = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height));
            substrate.addColorStop(0, hexWithAlpha(colors.background, '25'));
            substrate.addColorStop(0.5, hexWithAlpha(colors.primary, '08'));
            substrate.addColorStop(1, hexWithAlpha(colors.secondary, '04'));
            ctx.fillStyle = substrate;
            ctx.fillRect(0, 0, width, height);

            // Bio-circuit trees (organic electronic growth)
            const treeCount = Math.floor(8 * density);
            
            for (let tree = 0; tree < treeCount; tree++) {
                const rootX = (tree * width / (treeCount + 1)) + width / (treeCount + 1);
                const rootY = height * 1 + Math.sin(time * 0.001 * speed + tree) * 30;
                const treePhase = time * speed * 0.001 + tree * 2.3;
                
                const drawCircuitBranch = (x, y, angle, length, depth, energy, isMainStem) => {
                    if (depth > 9 || length < 8) return;
                    
                    // Organic growth with electronic precision
                    const growthPulse = Math.sin(treePhase + depth * 0.3) * 0.2 + 1.0;
                    const actualLength = length * growthPulse;
                    
                    // Slight organic curvature
                    const curvature = Math.sin(treePhase + depth + x * 0.01) * 0.1;
                    const curvedAngle = angle + curvature;
                    
                    const endX = x + Math.cos(curvedAngle) * actualLength;
                    const endY = y - Math.sin(curvedAngle) * actualLength;
                    
                    // Circuit trace coloring (deeper = more refined circuitry)
                    let traceColor, traceWidth;
                    if (isMainStem) {
                        traceColor = colors.primary;
                        traceWidth = Math.max(2, 6 - depth);
                    } else if (depth < 4) {
                        traceColor = colors.secondary;
                        traceWidth = Math.max(1, 4 - depth);
                    } else {
                        traceColor = colors.accent;
                        traceWidth = 1;
                    }
                    
                    // Draw organic circuit trace
                    ctx.globalAlpha = opacity * energy * 0.8;
                    ctx.strokeStyle = traceColor;
                    ctx.lineWidth = traceWidth;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(endX, endY);
                    ctx.stroke();
                    
                    // Electronic nodes at growth points
                    if (depth % 2 === 0 && actualLength > 12) {
                        const nodeX = x + Math.cos(curvedAngle) * actualLength * 0.7;
                        const nodeY = y - Math.sin(curvedAngle) * actualLength * 0.7;
                        const nodeActivity = Math.sin(treePhase * 2 + depth + tree) * 0.5 + 0.5;
                        
                        // Circuit component (capacitor, resistor, or LED)
                        const componentType = (depth + tree) % 3;
                        
                        ctx.globalAlpha = opacity * energy * nodeActivity;
                        
                        if (componentType === 0) {
                            // LED/diode
                            ctx.fillStyle = nodeActivity > 0.7 ? colors.primary : colors.accent;
                            ctx.beginPath();
                            ctx.arc(nodeX, nodeY, 4 + nodeActivity * 2, 0, Math.PI * 2);
                            ctx.fill();
                            
                            // LED light emission
                            if (nodeActivity > 0.8) {
                                ctx.globalAlpha = opacity * 0.3;
                                const glowGradient = ctx.createRadialGradient(nodeX, nodeY, 0, nodeX, nodeY, 12);
                                glowGradient.addColorStop(0, hexWithAlpha(colors.primary, '60'));
                                glowGradient.addColorStop(1, hexWithAlpha(colors.primary, '00'));
                                ctx.fillStyle = glowGradient;
                                ctx.beginPath();
                                ctx.arc(nodeX, nodeY, 12, 0, Math.PI * 2);
                                ctx.fill();
                            }
                        } else if (componentType === 1) {
                            // Resistor
                            ctx.strokeStyle = colors.secondary;
                            ctx.lineWidth = 3;
                            ctx.strokeRect(nodeX - 6, nodeY - 2, 12, 4);
                            
                            // Resistance bands
                            ctx.strokeStyle = colors.accent;
                            ctx.lineWidth = 1;
                            for (let band = 0; band < 3; band++) {
                                const bandX = nodeX - 4 + band * 3;
                                ctx.beginPath();
                                ctx.moveTo(bandX, nodeY - 2);
                                ctx.lineTo(bandX, nodeY + 2);
                                ctx.stroke();
                            }
                        } else {
                            // Capacitor
                            ctx.strokeStyle = colors.accent;
                            ctx.lineWidth = 2;
                            ctx.beginPath();
                            ctx.moveTo(nodeX - 3, nodeY - 4);
                            ctx.lineTo(nodeX - 3, nodeY + 4);
                            ctx.moveTo(nodeX + 3, nodeY - 4);
                            ctx.lineTo(nodeX + 3, nodeY + 4);
                            ctx.stroke();
                        }
                    }
                    
                    // Organic branching with electronic constraints
                    if (actualLength > 15) {
                        let branchCount;
                        if (isMainStem && depth < 3) {
                            branchCount = 3; // Main stems branch more
                        } else {
                            branchCount = 2; // Secondary branches
                        }
                        
                        for (let b = 0; b < branchCount; b++) {
                            // Bio-electronic branching angles (mix of organic and geometric)
                            let branchAngle;
                            if (isMainStem) {
                                branchAngle = angle + (b - 1) * 0.5 + Math.sin(treePhase + depth + b) * 0.3;
                            } else {
                                branchAngle = angle + (b - 0.5) * 0.7 + Math.sin(treePhase + depth) * 0.2;
                            }
                            
                            const newLength = length * (0.7 + Math.sin(treePhase + b) * 0.1);
                            const newEnergy = energy * 0.85;
                            
                            drawCircuitBranch(endX, endY, branchAngle, newLength, depth + 1, newEnergy, false);
                        }
                    }
                };
                
                // Start with main stem
                const mainAngle = Math.PI/2 + Math.sin(treePhase) * 0.2;
                const mainLength = 70 + Math.sin(treePhase * 0.8) * 25;
                drawCircuitBranch(rootX, rootY, mainAngle, mainLength, 0, 1.0, true);
            }

            // Bio-electric data streams flowing through circuit paths
            const streamCount = Math.floor(25 * density);
            
            for (let stream = 0; stream < streamCount; stream++) {
                const streamPhase = (time * speed * 0.04 + stream * 0.3) % 1;
                
                // Organic flow paths (following natural curves)
                const pathType = stream % 4;
                let streamX, streamY, prevX, prevY;
                
                switch (pathType) {
                    case 0: // Vine-like horizontal flow
                        streamX = streamPhase * width;
                        streamY = height * 0.4 + Math.sin(streamPhase * Math.PI * 3 + stream) * 80;
                        prevX = streamX - 12;
                        prevY = height * 0.4 + Math.sin((streamPhase - 0.02) * Math.PI * 3 + stream) * 80;
                        break;
                    case 1: // Root-like vertical flow
                        streamX = width * 0.3 + Math.cos(streamPhase * Math.PI * 2 + stream) * 60;
                        streamY = streamPhase * height;
                        prevX = width * 0.3 + Math.cos((streamPhase - 0.02) * Math.PI * 2 + stream) * 60;
                        prevY = streamY - 12;
                        break;
                    case 2: // Spiral growth pattern
                        const spiralAngle = streamPhase * Math.PI * 6 + stream;
                        const spiralRadius = 100 + streamPhase * 150;
                        streamX = width/2 + Math.cos(spiralAngle) * spiralRadius;
                        streamY = height/2 + Math.sin(spiralAngle) * spiralRadius;
                        
                        const prevSpiralAngle = (streamPhase - 0.02) * Math.PI * 6 + stream;
                        const prevSpiralRadius = 100 + (streamPhase - 0.02) * 150;
                        prevX = width/2 + Math.cos(prevSpiralAngle) * prevSpiralRadius;
                        prevY = height/2 + Math.sin(prevSpiralAngle) * prevSpiralRadius;
                        break;
                    case 3: // Branching network flow
                        streamX = streamPhase * width;
                        streamY = height * 0.6 + Math.sin(streamPhase * Math.PI * 4) * 100;
                        prevX = streamX - 15;
                        prevY = height * 0.6 + Math.sin((streamPhase - 0.025) * Math.PI * 4) * 100;
                        break;
                    default:
                        // Default case for safety
                        streamX = streamPhase * width;
                        streamY = height * 0.5;
                        prevX = streamX - 10;
                        prevY = streamY;
                }
                
                // Data packet visualization
                const packetSize = 3 + Math.sin(time * 0.008 * speed + stream) * 2;
                const packetEnergy = Math.sin(time * 0.012 * speed + stream * 0.7) * 0.5 + 0.5;
                
                // Main data packet
                ctx.globalAlpha = opacity * packetEnergy * 0.9;
                ctx.fillStyle = stream % 2 === 0 ? colors.primary : colors.accent;
                ctx.beginPath();
                ctx.arc(streamX, streamY, packetSize, 0, Math.PI * 2);
                ctx.fill();
                
                // Organic trail effect
                const trailLength = 6;
                for (let trail = 1; trail <= trailLength; trail++) {
                    const trailProgress = trail / trailLength;
                    const trailX = streamX + (prevX - streamX) * trailProgress;
                    const trailY = streamY + (prevY - streamY) * trailProgress;
                    const trailAlpha = (1 - trailProgress) * packetEnergy;
                    const trailSize = packetSize * (1 - trailProgress * 0.5);
                    
                    ctx.globalAlpha = opacity * trailAlpha * 0.6;
                    ctx.fillStyle = colors.secondary;
                    ctx.beginPath();
                    ctx.arc(trailX, trailY, trailSize, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // Energy discharge effect
                if (packetEnergy > 0.85) {
                    ctx.globalAlpha = opacity * 0.4;
                    ctx.strokeStyle = colors.primary;
                    ctx.lineWidth = 1;
                    
                    for (let spark = 0; spark < 4; spark++) {
                        const sparkAngle = (spark / 4) * Math.PI * 2 + time * 0.02 * speed;
                        const sparkLength = 8 + packetEnergy * 6;
                        ctx.beginPath();
                        ctx.moveTo(streamX, streamY);
                        ctx.lineTo(streamX + Math.cos(sparkAngle) * sparkLength,
                                  streamY + Math.sin(sparkAngle) * sparkLength);
                        ctx.stroke();
                    }
                }
            }

            // Subtle organic circuit board grid
            ctx.globalAlpha = 0.08;
            ctx.strokeStyle = colors.secondary;
            ctx.lineWidth = 0.5;
            
            const gridSpacing = 120;
            
            // Organic horizontal traces
            for (let y = gridSpacing; y < height; y += gridSpacing) {
                const organicY = y + Math.sin(time * 0.0008 * speed + y * 0.01) * 8;
                ctx.beginPath();
                
                for (let x = 0; x <= width; x += 20) {
                    const traceY = organicY + Math.sin(time * 0.001 * speed + x * 0.02) * 3;
                    if (x === 0) {
                        ctx.moveTo(x, traceY);
                    } else {
                        ctx.lineTo(x, traceY);
                    }
                }
                ctx.stroke();
            }
            
            // Organic vertical traces
            for (let x = gridSpacing; x < width; x += gridSpacing) {
                const organicX = x + Math.cos(time * 0.0008 * speed + x * 0.01) * 8;
                ctx.beginPath();
                
                for (let y = 0; y <= height; y += 20) {
                    const traceX = organicX + Math.cos(time * 0.001 * speed + y * 0.02) * 3;
                    if (y === 0) {
                        ctx.moveTo(traceX, y);
                    } else {
                        ctx.lineTo(traceX, y);
                    }
                }
                ctx.stroke();
            }
            
            ctx.globalAlpha = 1;
        },

        psychedelic: (ctx, width, height, time = 0) => {
            const colors = getCurrentColors();
            const adjustedColors = getAlphaAdjustedColors(colors);
            const speed = backgroundConfig.animationSpeed || 1;
            const density = backgroundConfig.density || 1;

            const centerX = width / 2;
            const centerY = height / 2;

            // Trippy kaleidoscopic background
            const kaleidoGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.8);
            kaleidoGradient.addColorStop(0, hexWithAlpha(colors.background, '40'));
            kaleidoGradient.addColorStop(0.3, adjustedColors.primaryAlpha('20'));
            kaleidoGradient.addColorStop(0.6, adjustedColors.secondaryAlpha('15'));
            kaleidoGradient.addColorStop(1, adjustedColors.accentAlpha('10'));
            ctx.fillStyle = kaleidoGradient;
            ctx.fillRect(0, 0, width, height);

            // Mandala sacred geometry layers
            const mandalaLayers = Math.floor(8 * density);
            
            for (let layer = 0; layer < mandalaLayers; layer++) {
                const layerPhase = time * speed * 0.001 + layer * 0.8;
                const layerRadius = 50 + layer * 30 + Math.sin(layerPhase * 0.7) * 20;
                const layerRotation = layerPhase * (layer % 2 === 0 ? 1 : -1) * 0.3;
                const petalCount = 6 + layer * 2;
                
                // Mandala petals/segments
                for (let petal = 0; petal < petalCount; petal++) {
                    const petalAngle = (petal / petalCount) * Math.PI * 2 + layerRotation;
                    const petalPhase = layerPhase + petal * 0.2;
                    const petalScale = 0.7 + Math.sin(petalPhase * 1.5) * 0.4;
                    
                    // Petal geometry
                    const petalRadius = layerRadius * petalScale;
                    const petalX = centerX + Math.cos(petalAngle) * petalRadius;
                    const petalY = centerY + Math.sin(petalAngle) * petalRadius;
                    
                    // Color cycling through spectrum
                    const colorCycle = (petalPhase + layer) % 3;
                    let petalColor;
                    if (colorCycle < 1) {
                        petalColor = colors.primary;
                    } else if (colorCycle < 2) {
                        petalColor = colors.secondary;
                    } else {
                        petalColor = colors.accent;
                    }
                    
                    // Draw mandala segment
                    ctx.globalAlpha = 0.6 + Math.sin(petalPhase * 2) * 0.3;
                    
                    // Inner petal geometry
                    const innerRadius = petalRadius * 0.3;
                    const outerRadius = petalRadius * 0.8;
                    
                    // Mandala petal with sacred geometry
                    ctx.beginPath();
                    
                    // Create complex petal shape
                    for (let point = 0; point <= 20; point++) {
                        const pointAngle = petalAngle + (point / 20) * (Math.PI / petalCount) - Math.PI / (petalCount * 2);
                        const pointRadius = innerRadius + (outerRadius - innerRadius) * 
                                          (0.5 + 0.5 * Math.sin(point * Math.PI / 10));
                        
                        // Add psychedelic warping
                        const warpFactor = Math.sin(petalPhase * 3 + point * 0.3) * 0.2;
                        const warpedRadius = pointRadius * (1 + warpFactor);
                        
                        const x = centerX + Math.cos(pointAngle) * warpedRadius;
                        const y = centerY + Math.sin(pointAngle) * warpedRadius;
                        
                        if (point === 0) {
                            ctx.moveTo(x, y);
                        } else {
                            ctx.lineTo(x, y);
                        }
                    }
                    
                    ctx.closePath();
                    
                    // Gradient fill for each petal
                    const petalGradient = ctx.createRadialGradient(petalX, petalY, 0, petalX, petalY, outerRadius);
                    petalGradient.addColorStop(0, adjustedColors.primaryAlpha('80'));
                    petalGradient.addColorStop(0.7, adjustedColors.primaryAlpha('40'));
                    petalGradient.addColorStop(1, adjustedColors.primaryAlpha('10'));
                    
                    ctx.fillStyle = petalGradient;
                    ctx.fill();
                    
                    // Petal outline with psychedelic effect
                    ctx.globalAlpha = 0.8;
                    ctx.strokeStyle = petalColor;
                    ctx.lineWidth = 1 + Math.sin(petalPhase * 4) * 1;
                    ctx.stroke();
                    
                    // Fractal sub-patterns within petals
                    if (layer < 4) {
                        const subPatterns = 3;
                        for (let sub = 0; sub < subPatterns; sub++) {
                            const subAngle = petalAngle + (sub - 1) * 0.2;
                            const subRadius = petalRadius * (0.4 + sub * 0.1);
                            const subX = centerX + Math.cos(subAngle) * subRadius;
                            const subY = centerY + Math.sin(subAngle) * subRadius;
                            const subSize = 3 + Math.sin(petalPhase * 5 + sub) * 2;
                            
                            ctx.globalAlpha = 0.6;
                            ctx.fillStyle = sub % 2 === 0 ? colors.accent : colors.secondary;
                            ctx.beginPath();
                            ctx.arc(subX, subY, subSize, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                }
                
                // Connecting geometric patterns between layers
                if (layer > 0) {
                    const connectionCount = petalCount * 2;
                    for (let conn = 0; conn < connectionCount; conn++) {
                        const connAngle = (conn / connectionCount) * Math.PI * 2 + layerRotation * 0.5;
                        const innerConnRadius = (50 + (layer - 1) * 30) * 0.9;
                        const outerConnRadius = layerRadius * 0.9;
                        
                        const connPhase = layerPhase + conn * 0.1;
                        const connAlpha = Math.sin(connPhase * 6) * 0.5 + 0.5;
                        
                        if (connAlpha > 0.7) {
                            ctx.globalAlpha = 0.3;
                            ctx.strokeStyle = colors.primary;
                            ctx.lineWidth = 1;
                            ctx.beginPath();
                            ctx.moveTo(centerX + Math.cos(connAngle) * innerConnRadius,
                                      centerY + Math.sin(connAngle) * innerConnRadius);
                            ctx.lineTo(centerX + Math.cos(connAngle) * outerConnRadius,
                                      centerY + Math.sin(connAngle) * outerConnRadius);
                            ctx.stroke();
                        }
                    }
                }
            }

            // Central mandala core with intense psychedelic effects
            const corePhase = time * speed * 0.002;
            const coreRadius = 40 + Math.sin(corePhase * 3) * 15;
            
            // Multi-layered core
            for (let coreLayer = 0; coreLayer < 5; coreLayer++) {
                const coreLayerRadius = coreRadius * (1 - coreLayer * 0.15);
                const coreLayerPhase = corePhase + coreLayer * 0.5;
                const coreRotation = coreLayerPhase * (coreLayer % 2 === 0 ? 2 : -1.5);
                
                // Core sacred symbols
                const symbolSides = 6 + coreLayer;
                
                ctx.globalAlpha = 0.8 - coreLayer * 0.1;
                
                for (let side = 0; side < symbolSides; side++) {
                    const sideAngle = (side / symbolSides) * Math.PI * 2 + coreRotation;
                    const sideX = centerX + Math.cos(sideAngle) * coreLayerRadius;
                    const sideY = centerY + Math.sin(sideAngle) * coreLayerRadius;
                    
                    // Psychedelic color shifting
                    const colorShift = (coreLayerPhase + side) % 3;
                    let coreColor = colorShift < 1 ? colors.primary : 
                                   colorShift < 2 ? colors.secondary : colors.accent;
                    
                    // Sacred symbol at each point
                    if (coreLayer < 3) {
                        // Inner core symbols
                        ctx.fillStyle = coreColor;
                        ctx.beginPath();
                        ctx.arc(sideX, sideY, 3 + Math.sin(coreLayerPhase * 8 + side) * 2, 0, Math.PI * 2);
                        ctx.fill();
                    } else {
                        // Outer core lines
                        ctx.strokeStyle = coreColor;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(centerX, centerY);
                        ctx.lineTo(sideX, sideY);
                        ctx.stroke();
                    }
                }
            }

            // Psychedelic particle field
            const particleCount = Math.floor(80 * density);
            
            for (let particle = 0; particle < particleCount; particle++) {
                const particlePhase = time * speed * 0.003 + particle * 0.1;
                const particleAngle = (particle * 2.39998) % (Math.PI * 2) + particlePhase; // Golden angle
                const particleRadius = 100 + (particle % 200) + Math.sin(particlePhase * 2) * 50;
                
                const particleX = centerX + Math.cos(particleAngle) * particleRadius;
                const particleY = centerY + Math.sin(particleAngle) * particleRadius;
                
                // Psychedelic particle properties
                const particleIntensity = Math.sin(particlePhase * 7) * 0.5 + 0.5;
                const particleSize = 2 + Math.sin(particlePhase * 11) * 3;
                const colorIndex = Math.floor((particlePhase * 3) % 3);
                
                const particleColor = colorIndex === 0 ? colors.primary :
                                    colorIndex === 1 ? colors.secondary : colors.accent;
                
                // Check if particle is within canvas bounds
                if (particleX >= 0 && particleX <= width && particleY >= 0 && particleY <= height) {
                    ctx.globalAlpha = particleIntensity * 0.7;
                    
                    // Particle glow effect
                    const glowRadius = Math.max(particleSize * 3, 1); // Ensure positive radius
                    const glowGradient = ctx.createRadialGradient(particleX, particleY, 0, 
                                                                particleX, particleY, glowRadius);
                    glowGradient.addColorStop(0, adjustedColors.primaryAlpha('FF'));
                    glowGradient.addColorStop(0.5, adjustedColors.primaryAlpha('80'));
                    glowGradient.addColorStop(1, adjustedColors.primaryAlpha('00'));
                    
                    ctx.fillStyle = glowGradient;
                    ctx.beginPath();
                    ctx.arc(particleX, particleY, glowRadius, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Particle core
                    ctx.globalAlpha = particleIntensity;
                    ctx.fillStyle = particleColor;
                    ctx.beginPath();
                    ctx.arc(particleX, particleY, Math.max(particleSize, 1), 0, Math.PI * 2); // Ensure positive radius
                    ctx.fill();
                }
            }

            // Psychedelic energy waves
            const waveCount = Math.floor(6 * density);
            
            for (let wave = 0; wave < waveCount; wave++) {
                const wavePhase = time * speed * 0.001 + wave * 1.2;
                const waveRadius = 200 + wave * 100 + Math.sin(wavePhase * 1.5) * 80;
                const waveIntensity = Math.sin(wavePhase * 4) * 0.5 + 0.5;
                
                if (waveIntensity > 0.3) {
                    ctx.globalAlpha = (waveIntensity - 0.3) * 0.4;
                    ctx.strokeStyle = wave % 2 === 0 ? colors.primary : colors.accent;
                    ctx.lineWidth = 2 + waveIntensity * 3;
                    
                    // Psychedelic distorted circles
                    ctx.beginPath();
                    
                    const segments = 60;
                    for (let seg = 0; seg <= segments; seg++) {
                        const segAngle = (seg / segments) * Math.PI * 2;
                        const distortion = Math.sin(segAngle * 8 + wavePhase * 6) * 0.2 + 1;
                        const segRadius = waveRadius * distortion;
                        
                        const x = centerX + Math.cos(segAngle) * segRadius;
                        const y = centerY + Math.sin(segAngle) * segRadius;
                        
                        if (seg === 0) {
                            ctx.moveTo(x, y);
                        } else {
                            ctx.lineTo(x, y);
                        }
                    }
                    
                    ctx.closePath();
                    ctx.stroke();
                }
            }

            ctx.globalAlpha = 1;
        },

        vortex: (ctx, width, height, time = 0) => {
            // QUANTUM THREADS: Visualizing invisible quantum fields through interconnected light filaments
            const colors = getCurrentColors();
            const t = time * 0.0003 * (backgroundConfig.animationSpeed || 1);
            const density = backgroundConfig.density || 1;

            // Quantum field parameters
            const nodeCount = Math.floor(25 * density);
            const maxDistance = 180;
            
            // Initialize quantum nodes if not exists
            if (!ctx.quantumNodes) {
                ctx.quantumNodes = [];
                for (let i = 0; i < nodeCount; i++) {
                    ctx.quantumNodes.push({
                        x: Math.random() * width,
                        y: Math.random() * height,
                        vx: (Math.random() - 0.5) * 0.3,
                        vy: (Math.random() - 0.5) * 0.3,
                        energy: Math.random(),
                        phase: Math.random() * Math.PI * 2,
                        connections: []
                    });
                }
            }

            // Helper function to validate colors
            const validateColor = (color, fallback = '#000000') => {
                if (!color || typeof color !== 'string') return fallback;
                if (color.includes('var(')) return fallback;
                if (!color.startsWith('#')) return fallback;
                return color;
            };

            // Validate all colors upfront
            const validColors = {
                background: validateColor(colors.background, '#0a0b1e'),
                primary: validateColor(colors.primary, '#00ffff'),
                secondary: validateColor(colors.secondary, '#ff00ff'),
                accent: validateColor(colors.accent, '#ffff00')
            };

            // Deep space background with quantum foam - respects theme colors
            const bgGrad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height));
            
            try {
                bgGrad.addColorStop(0, validColors.background);
                bgGrad.addColorStop(1, validColors.background === '#0a0b1e' ? '#000000' : validColors.background + 'cc');
                ctx.fillStyle = bgGrad;
                ctx.fillRect(0, 0, width, height);
            } catch (e) {
                // Fallback to solid color
                ctx.fillStyle = '#0a0b1e';
                ctx.fillRect(0, 0, width, height);
            }

            // Quantum foam (subtle background noise)
            ctx.save();
            ctx.globalAlpha = 0.05;
            for (let i = 0; i < 200; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                const intensity = Math.sin(t * 20 + x * 0.01 + y * 0.01) * 0.5 + 0.5;
                if (intensity > 0.7) {
                    ctx.fillStyle = validColors.primary;
                    ctx.fillRect(x, y, 1, 1);
                }
            }
            ctx.restore();

            // Update quantum nodes with field dynamics
            ctx.quantumNodes.forEach((node, i) => {
                // Quantum field influence (wave function)
                const fieldX = Math.sin(t * 2 + node.phase) * 0.5;
                const fieldY = Math.cos(t * 1.7 + node.phase) * 0.5;
                
                // Apply quantum tunneling effect
                node.vx += fieldX * 0.02;
                node.vy += fieldY * 0.02;
                
                // Damping to prevent runaway motion
                node.vx *= 0.98;
                node.vy *= 0.98;
                
                // Update position
                node.x += node.vx;
                node.y += node.vy;
                
                // Quantum boundary conditions (wrap around)
                if (node.x < 0) node.x = width;
                if (node.x > width) node.x = 0;
                if (node.y < 0) node.y = height;
                if (node.y > height) node.y = 0;
                
                // Update energy based on position in field
                node.energy = (Math.sin(t * 3 + node.x * 0.01) + Math.cos(t * 2.5 + node.y * 0.01)) * 0.5 + 0.5;
            });

            // Calculate quantum entanglements (connections)
            ctx.quantumNodes.forEach(node => {
                node.connections = [];
                ctx.quantumNodes.forEach(other => {
                    if (node !== other) {
                        const dx = other.x - node.x;
                        const dy = other.y - node.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (distance < maxDistance) {
                            const strength = 1 - (distance / maxDistance);
                            const resonance = Math.sin(t * 5 + distance * 0.02) * 0.5 + 0.5;
                            node.connections.push({
                                target: other,
                                strength: strength * resonance,
                                distance: distance
                            });
                        }
                    }
                });
            });

            // Draw quantum threads (entangled connections)
            ctx.quantumNodes.forEach(node => {
                node.connections.forEach(connection => {
                    if (connection.strength > 0.3) {
                        const target = connection.target;
                        const energy = (node.energy + target.energy) / 2;
                        
                        // Quantum thread appearance
                        ctx.save();
                        ctx.globalAlpha = connection.strength * 0.6 * energy;
                        
                        // Color based on energy state
                        const threadColor = energy > 0.7 ? validColors.accent : 
                                          energy > 0.4 ? validColors.primary : validColors.secondary;
                        
                        ctx.strokeStyle = threadColor;
                        ctx.lineWidth = 0.5 + connection.strength * 2;
                        ctx.shadowColor = threadColor;
                        ctx.shadowBlur = 8;
                        
                        // Draw curved quantum thread
                        ctx.beginPath();
                        ctx.moveTo(node.x, node.y);
                        
                        // Quantum fluctuation in the thread
                        const midX = (node.x + target.x) / 2 + Math.sin(t * 8 + connection.distance * 0.03) * 15;
                        const midY = (node.y + target.y) / 2 + Math.cos(t * 6 + connection.distance * 0.03) * 15;
                        
                        ctx.quadraticCurveTo(midX, midY, target.x, target.y);
                        ctx.stroke();
                        ctx.restore();
                    }
                });
            });

            // Draw quantum nodes (field intersections)
            ctx.quantumNodes.forEach(node => {
                const nodeSize = 2 + node.energy * 4;
                const nodeColor = node.energy > 0.6 ? validColors.accent : validColors.primary;
                
                ctx.save();
                ctx.globalAlpha = 0.8 + node.energy * 0.2;
                
                // Node core
                const nodeGrad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, nodeSize * 2);
                try {
                    nodeGrad.addColorStop(0, '#ffffff');
                    nodeGrad.addColorStop(0.5, nodeColor);
                    nodeGrad.addColorStop(1, nodeColor + '00');
                    ctx.fillStyle = nodeGrad;
                } catch (e) {
                    // Fallback to solid color if gradient fails
                    ctx.fillStyle = nodeColor;
                }
                ctx.shadowColor = nodeColor;
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(node.x, node.y, nodeSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [backgroundConfig, darkMode]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const animate = useCallback((timestamp) => {
        const canvas = canvasRef.current;
        if (!canvas || !backgroundConfig.isAnimated) return;

        // Calculate FPS
        frameCount.current++;
        if (timestamp - lastFpsUpdate.current >= 1000) { // Update FPS every second
            fpsRef.current = Math.round(frameCount.current * 1000 / (timestamp - lastFpsUpdate.current));
            frameCount.current = 0;
            lastFpsUpdate.current = timestamp;
            
            // Dispatch custom event with FPS data
            window.dispatchEvent(new CustomEvent('fpsUpdate', { detail: fpsRef.current }));
        }

        // Throttle to 30fps to reduce interference with other animations
        const now = timestamp;
        if (now - lastFrameTime.current < 33) { // 33ms = ~30fps
            animationRef.current = requestAnimationFrame(animate);
            return;
        }
        lastFrameTime.current = now;

        // Check if canvas is visible
        const rect = canvas.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        
        if (!isVisible) {
            animationRef.current = requestAnimationFrame(animate);
            return;
        }

        const ctx = canvas.getContext('2d');
        // Clear the canvas first
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const generatorFunctions = generators();
        const generator = generatorFunctions[backgroundConfig.type];
        
        if (generator) {
            // Pass the raw timestamp - let each generator handle its own speed scaling
            const timeInSeconds = timestamp * 0.001;
            generator(ctx, canvas.width, canvas.height, timeInSeconds);
        }
        
        if (backgroundConfig.isAnimated) {
            animationRef.current = requestAnimationFrame(animate);
        }
    }, [backgroundConfig.type, backgroundConfig.isAnimated, generators]); // eslint-disable-line react-hooks/exhaustive-deps

    // Canvas setup and animation control
    useEffect(() => {
        if (backgroundConfig.type === 'none') {
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Setup canvas
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Clear any existing animation
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }

        if (backgroundConfig.isAnimated) {
            // Start animation
            animationRef.current = requestAnimationFrame(animate);
        } else {
            // Render static frame
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const generatorFunctions = generators();
            const generator = generatorFunctions[backgroundConfig.type];
            if (generator) {
                generator(ctx, canvas.width, canvas.height, 0);
            }
        }

        // Handle resize
        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
        };
    }, [backgroundConfig.type, backgroundConfig.isAnimated, animate, generators]); // Only restart on type or animation state change

    if (backgroundConfig.type === 'none') {
        return null;
    }

    return (
        <canvas
            ref={canvasRef}
            className={styles.globalBackground}
            style={{ opacity: backgroundConfig.opacity }}
        />
    );
};

export default GlobalBackground;
