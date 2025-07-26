import { useEffect, useRef } from 'react';
import { useBackground } from './BackgroundContext';

export const useCapabilityProbe = () => {
    const { backgroundConfig, updateBackgroundConfig } = useBackground();
    const probeDone = useRef(false);

    useEffect(() => {
        // If already static or probe already completed, skip
        if (backgroundConfig.isAnimated === false || probeDone.current) return;

        const LS_KEY = 'bgAnimationAutoDecision';
        const cached = localStorage.getItem(LS_KEY);

        if (cached) {
            if (backgroundConfig.isAnimated === (cached === 'on')) return;
            if (!window.__bg_probe_logged) {
                window.__bg_probe_logged = true;
            }
            updateBackgroundConfig({ isAnimated: cached === 'on' });
            probeDone.current = true;
            return;
        }

        /* ---------- 1. Gather synchronous hints ---------- */
        const ua = navigator.userAgent;
        const isIpad =
            /iPad/.test(ua) ||
            (ua.includes('Macintosh') && ('ontouchstart' in window || navigator.maxTouchPoints > 1));
        const isMobile = /iPhone|iPod|Android/i.test(ua) || isIpad;
        const cores = navigator.hardwareConcurrency ?? 2;
        const ram = navigator.deviceMemory ?? 2;
        // const width = window.screen.availWidth || window.screen.width;
        // const height = window.screen.availHeight || window.screen.height;

        /* ---------- 2. WebGL sanity test ---------- */
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

        /* score buckets */
        let score = 0;
        score += cores >= 8 ? 2 : cores >= 6 ? 1 : 0;
        score += glOK ? 2 : 0;
        const effRam = ram || 4;
        score += effRam >= 6 ? 2 : effRam >= 4 ? 1 : 0;
        score += !isMobile ? 2 : 1;

        if (!window.__bg_probe_static_logged) {
            // console.groupCollapsed('[BG-Probe] static hints');
            // console.table({ ua, isMobile, cores, ram: `${ram}GB`, screen: `${width}×${height}`, glOK });
            // console.groupEnd();
            window.__bg_probe_static_logged = true;
        }

        if (cores <= 4) score = Math.min(score, 4);

        /* ---------- 3. 1-second rAF warm-up ---------- */
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
                const fpsScore = warmFPS >= 60 ? 2 : warmFPS >= 45 ? 1 : 0;
                score += fpsScore;

                // console.groupCollapsed('[BG-Probe] runtime hint');
                // console.groupEnd();

                /* ---------- 4. Final verdict ---------- */
                let capable = score >= 8;
                if (warmFPS >= 36 && glOK) capable = true;
                if (warmFPS < 18) capable = false;

                // Only update if verdict is different
                if (backgroundConfig.isAnimated !== capable) {
                    updateBackgroundConfig({ isAnimated: capable });
                    localStorage.setItem(LS_KEY, capable ? 'on' : 'off');
                }
                probeDone.current = true; 
            }
        };

        requestAnimationFrame(loop);

        // Cleanup
        return () => {
            cancelled = true;
        };
    }, [backgroundConfig.isAnimated, updateBackgroundConfig]);
};