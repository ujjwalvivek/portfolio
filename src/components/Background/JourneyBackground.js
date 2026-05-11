/**
 *      ██╗ ██████╗ ██╗   ██╗██████╗ ███╗   ██╗███████╗██╗   ██╗
 *      ██║██╔═══██╗██║   ██║██╔══██╗████╗  ██║██╔════╝╚██╗ ██╔╝
 *      ██║██║   ██║██║   ██║██████╔╝██╔██╗ ██║█████╗   ╚████╔╝
 * ██   ██║██║   ██║██║   ██║██╔══██╗██║╚██╗██║██╔══╝    ╚██╔╝
 * ╚█████╔╝╚██████╔╝╚██████╔╝██║  ██║██║ ╚████║███████╗   ██║
 *  ╚════╝  ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝   ╚═╝
 *
 */

import { useContext, useEffect, useRef, useState } from "react";
import { useBackground } from "./BackgroundContext";
import { ThemeContext } from "../Utils/ThemeSwitcher/ThemeContext";

const WASM_READY_EVENT = "journey:first-frame";
const INTERNAL_ASPECT = 640 / 360;

let wasmInitPromise = null;
let wasmModule = null;
let persistentCanvas = null;
//eslint-disable-next-line no-unused-vars
let removeCover = null;

const MODE_MAP = {
    journey: "topographic",
};

function applyCanvasStyles(canvas) {
    canvas.style.position = "fixed";
    canvas.style.inset = "0";
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.style.zIndex = "-2";
    canvas.style.imageRendering = "pixelated";
    canvas.style.pointerEvents = "none";
    canvas.style.transformOrigin = "center center";
}

function applyCover(canvas) {
    const sa = window.innerWidth / window.innerHeight;
    const scale =
        sa > INTERNAL_ASPECT ? sa / INTERNAL_ASPECT : INTERNAL_ASPECT / sa;
    canvas.style.transform = scale > 1 ? `scale(${scale})` : "";
}

const JourneyBackground = () => {
    const { backgroundConfig } = useBackground();
    const { darkMode } = useContext(ThemeContext);
    const [wasmReady, setWasmReady] = useState(false);
    const canvasRef = useRef(null);

    useEffect(() => {
        if (persistentCanvas) {
            persistentCanvas.style.display = "";
            applyCover(persistentCanvas);
            canvasRef.current = persistentCanvas;
            setWasmReady(true);
            return () => {
                if (persistentCanvas) persistentCanvas.style.display = "none";
            };
        }

        const existing = document.querySelector("body > canvas");
        if (existing) {
            applyCanvasStyles(existing);
            applyCover(existing);
            existing.style.display = "";
            const onResize = () => applyCover(existing);
            window.addEventListener("resize", onResize);
            removeCover = () => window.removeEventListener("resize", onResize);
            persistentCanvas = existing;
            canvasRef.current = existing;
            setWasmReady(true);
            return () => {
                if (persistentCanvas) persistentCanvas.style.display = "none";
            };
        }

        let cancelled = false;

        const boot = async () => {
            try {
                const mod = await import(
                    /* webpackIgnore: true */ "/games/journey/portfolio_bg.js"
                );
                wasmModule = mod;
                if (!wasmInitPromise) {
                    wasmInitPromise = mod.default();
                }
                await wasmInitPromise;
            } catch (err) {
                console.error("[JourneyBackground] WASM init failed:", err);
                wasmInitPromise = null;
            }
        };

        const handleReady = () => {
            if (cancelled) return;

            const candidate = document.querySelector("body > canvas");
            if (!candidate) return;

            applyCanvasStyles(candidate);
            applyCover(candidate);

            const onResize = () => applyCover(candidate);
            window.addEventListener("resize", onResize);
            removeCover = () => window.removeEventListener("resize", onResize);

            persistentCanvas = candidate;
            canvasRef.current = candidate;
            setWasmReady(true);
        };

        window.addEventListener(WASM_READY_EVENT, handleReady, { once: true });
        boot();

        return () => {
            cancelled = true;
            window.removeEventListener(WASM_READY_EVENT, handleReady);
            //? Hide — don't remove. Removing kills the wGPU surface permanently.
            if (persistentCanvas) persistentCanvas.style.display = "none";
        };
    }, []);

    //? Apply invert filter directly on the canvas when in light mode
    useEffect(() => {
        const c = canvasRef.current ?? persistentCanvas;
        if (!c) return;
        c.style.filter = darkMode ? "" : "invert(1) brightness(0.7)";
    }, [darkMode, wasmReady]);

    useEffect(() => {
        if (!wasmReady || !wasmModule?.set_mode) return;
        const mode = MODE_MAP[backgroundConfig.type] || "topographic";
        wasmModule.set_mode(mode);
    }, [backgroundConfig.type, wasmReady]);

    useEffect(() => {
        const handler = (e) => {
            window.dispatchEvent(
                new CustomEvent("fpsUpdate", {
                    detail: { fps: e.detail, source: backgroundConfig.type },
                }),
            );
        };
        window.addEventListener("journey:fps", handler);
        return () => window.removeEventListener("journey:fps", handler);
    }, [backgroundConfig.type]);

    if (!wasmReady) return null;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: -1,
                pointerEvents: "none",
                backgroundImage:
                    "linear-gradient(to bottom right, var(--dynamic-dominant-color), var(--dynamic-hsl-average))",
                mixBlendMode: darkMode ? "color" : "multiply",
                transition: "background-color 0.5s ease",
                opacity: backgroundConfig.opacity ?? 0.85,
            }}
        />
    );
};

export default JourneyBackground;
