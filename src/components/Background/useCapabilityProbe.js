/**
 *  ██████╗ █████╗ ██████╗  █████╗ ██████╗ ██╗██╗     ██╗████████╗██╗   ██╗
 * ██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔══██╗██║██║     ██║╚══██╔══╝╚██╗ ██╔╝
 * ██║     ███████║██████╔╝███████║██████╔╝██║██║     ██║   ██║    ╚████╔╝ 
 * ██║     ██╔══██║██╔═══╝ ██╔══██║██╔══██╗██║██║     ██║   ██║     ╚██╔╝  
 * ╚██████╗██║  ██║██║     ██║  ██║██████╔╝██║███████╗██║   ██║      ██║   
 *  ╚═════╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝╚═════╝ ╚═╝╚══════╝╚═╝   ╚═╝      ╚═╝   
 *                                                                         
 * ██████╗ ██████╗  ██████╗ ██████╗ ███████╗                               
 * ██╔══██╗██╔══██╗██╔═══██╗██╔══██╗██╔════╝                               
 * ██████╔╝██████╔╝██║   ██║██████╔╝█████╗                                 
 * ██╔═══╝ ██╔══██╗██║   ██║██╔══██╗██╔══╝                                 
 * ██║     ██║  ██║╚██████╔╝██████╔╝███████╗                               
 * ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝                               
 *                                                                         
 */

/**========================================================================
 **                     Context Hooks 
 *========================================================================**/
import { useEffect, useRef } from 'react';
import { useBackground } from './BackgroundContext';

/**========================================================================
 **   Utility function to get device class from storage or detect it
 *========================================================================**/
export const getDeviceClass = () => {
    //! Try to get from localStorage first
    try {
        const stored = localStorage.getItem('bgDeviceClass');
        if (stored && ['highEnd', 'midRange', 'lowEnd'].includes(stored)) {
            return stored;
        }
    } catch (e) {
        // Private mode - Reduce Computation while respecting user privacy
        console.warn('Storage unavailable (private mode?):', e.message);
        // Try sessionStorage for session-scoped caching
        try {
            const stored = sessionStorage.getItem('bgDeviceClass');
            if (stored && ['highEnd', 'midRange', 'lowEnd'].includes(stored)) {
                return stored;
            }
        } catch (e2) {
            // Both storage types failed - truly private mode
        }
    }

    //! iOS-specific detection first
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPod|iPad/i.test(ua) ||
        (ua.includes('Macintosh') && ('ontouchstart' in window || navigator.maxTouchPoints > 1));

    if (isIOS) {
        // Screen resolution and memory heuristics for iOS devices
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;
        const pixelRatio = window.devicePixelRatio || 1;
        const totalPixels = screenWidth * screenHeight * pixelRatio * pixelRatio;
        const effectiveWidth = screenWidth * pixelRatio;
        const effectiveHeight = screenHeight * pixelRatio;

        // iPad detection by screen size - all modern iPads are high-end
        if (effectiveWidth >= 1600 || effectiveHeight >= 1000) {
            return 'highEnd';
        }

        // iPhone/iPod detection (smaller iOS devices with touch)
        // Modern iPhones with high pixel density or large screens
        if (totalPixels >= 6000000 || pixelRatio >= 3 || screenHeight >= 844) {
            return 'highEnd'; // iPhone 12+, 13, 14, 15 series
        }

        // Mid-range iPhones (iPhone X, XS, XR, 11 series)
        if (totalPixels >= 2000000 || screenHeight >= 812 || pixelRatio >= 2.5) {
            return 'midRange';
        }

        // Older iPhones (iPhone 6, 7, 8 and older)
        return 'lowEnd';
    }

    //! Android and other mobile detection
    const isAndroid = /Android/i.test(ua);
    const isMobile = isIOS || isAndroid;

    //! Fallback detection for non-iOS devices
    const cores = navigator.hardwareConcurrency ?? 2;
    const ram = navigator.deviceMemory ?? (isMobile ? 4 : 8); // Better mobile default

    let score = 0;
    score += cores >= 8 ? 2 : cores >= 6 ? 1 : 0;
    score += ram >= 8 ? 2 : ram >= 4 ? 1 : 0;
    score += !isMobile ? 1 : 0; // Less penalty for mobile

    if (score >= 4) return 'highEnd';
    if (score >= 2) return 'midRange';
    return 'lowEnd';
};

/**============================================
 **        Capability Probe Hook
 *=============================================**/
export const useCapabilityProbe = () => {
    const { backgroundConfig, updateBackgroundConfig } = useBackground();
    const probeDone = useRef(false);
    const probeRunning = useRef(false);

    useEffect(() => {
        //! If already static or probe already completed, skip
        if (backgroundConfig.isAnimated === false || probeDone.current || probeRunning.current) return;

        const LS_KEY = 'bgAnimationAutoDecision';
        let cached;
        try {
            cached = localStorage.getItem(LS_KEY);
        } catch (e) {
            try {
                cached = sessionStorage.getItem(LS_KEY);
            } catch (e2) {
                cached = undefined;
            }
        }

        if (cached) {
            if (backgroundConfig.isAnimated === (cached === 'on')) {
                probeDone.current = true;
                return;
            }
            if (!window.__bg_probe_logged) {
                window.__bg_probe_logged = true;
            }
            updateBackgroundConfig({ isAnimated: cached === 'on' });
            probeDone.current = true;
            return;
        }

        probeRunning.current = true;

        /**============================================
         **  1. Gather synchronous hints
         *=============================================**/
        const ua = navigator.userAgent;
        const isIpad =
            /iPad/.test(ua) ||
            (ua.includes('Macintosh') && ('ontouchstart' in window || navigator.maxTouchPoints > 1));
        const isMobile = /iPhone|iPod|Android/i.test(ua) || isIpad;
        const cores = navigator.hardwareConcurrency ?? 2;
        const ram = navigator.deviceMemory ?? 2;

        /**============================================
         **  2. WebGL sanity test
         *=============================================**/
        let glOK = false;
        try {
            const canvas = document.createElement('canvas');
            glOK = !!(
                canvas.getContext('webgl') ||
                canvas.getContext('experimental-webgl')
            );
        } catch (_) {
            glOK = false;
        }

        /**======================
         **      Score Buckets
         *========================**/
        let score = 0;
        score += cores >= 8 ? 2 : cores >= 6 ? 1 : 0;
        score += glOK ? 2 : 0;
        const effRam = ram || 4;
        score += effRam >= 6 ? 2 : effRam >= 4 ? 1 : 0;
        score += !isMobile ? 2 : 1;

        if (!window.__bg_probe_static_logged) {
            window.__bg_probe_static_logged = true;
        }

        if (cores <= 4) score = Math.min(score, 4);

        /**============================================
         **  3. 1-second rAF warm-up
         *=============================================**/
        let frames = 0;
        const t0 = performance.now();
        let cancelled = false;

        const loop = t => {
            if (cancelled) return;
            frames += 1;
            if (t - t0 < 1_000) {
                requestAnimationFrame(loop);
            } else {
                const warmFPS = frames;

                //* Target FPS matches animation engine limits (20 mobile, 30 desktop)
                const targetFPS = isMobile ? 20 : 30;
                const fpsScore = warmFPS >= targetFPS * 0.9 ? 2 : warmFPS >= targetFPS * 0.7 ? 1 : 0;
                score += fpsScore;

                /**============================================
                 **  4. Final verdict and device classification
                 *=============================================**/
                let capable = score >= 8;
                if (warmFPS >= targetFPS * 0.8 && glOK) capable = true;
                if (warmFPS < targetFPS * 0.5) capable = false;

                //* Device classification based on score and realistic performance targets
                // let deviceClass = 'midRange'; //! Default fallback
                // if (score >= 10 || (warmFPS >= targetFPS * 0.85 && glOK && cores >= 8)) {
                //     deviceClass = 'highEnd';
                // } else if (score >= 6 && warmFPS >= targetFPS * 0.6) {
                //     deviceClass = 'midRange';
                // } else {
                //     deviceClass = 'lowEnd';
                // }

                const deviceClass = getDeviceClass();

                //* Store device class for future use
                try {
                    localStorage.setItem('bgDeviceClass', deviceClass);
                } catch (e) {
                    // Private mode - Reduce Computation while respecting user privacy
                    console.warn('Storage unavailable (private mode?):', e.message);
                    // Try sessionStorage for session-scoped caching
                    try {
                        sessionStorage.setItem('bgDeviceClass', deviceClass);
                    } catch (e2) {
                        // Both storage types failed - truly private mode
                    }
                }

                //! Only update if verdict is different
                if (backgroundConfig.isAnimated !== capable) {
                    updateBackgroundConfig({
                        isAnimated: capable,
                        deviceClass: deviceClass
                    });
                    try {
                        localStorage.setItem(LS_KEY, capable ? 'on' : 'off');
                    } catch (e) {
                        try {
                            sessionStorage.setItem(LS_KEY, capable ? 'on' : 'off');
                        } catch (e2) {
                            // Both failed
                        }
                    }
                }
                probeDone.current = true;
                probeRunning.current = false;
            }
        };

        requestAnimationFrame(loop);

        //* Cleanup
        return () => {
            cancelled = true;
            probeRunning.current = false;
        };
    }, [backgroundConfig.isAnimated, updateBackgroundConfig]);
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