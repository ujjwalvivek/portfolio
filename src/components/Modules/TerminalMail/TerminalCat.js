import { useEffect, useRef } from "react";

function parseCSSRGB(str) {
    str = (str || "").trim();
    let m = str.match(/rgb\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)\s*\)/);
    if (!m) m = str.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    return m ? [+m[1], +m[2], +m[3]] : [128, 128, 128];
}

export default function TerminalCat() {
    const canvasRef = useRef(null);
    const genRef = useRef(0);

    useEffect(() => {
        const myGen = ++genRef.current;
        function isAlive() { return genRef.current === myGen; }

        const cvs = canvasRef.current;
        const size = 110;
        const pxSize = 2;

        cvs.width = size;
        cvs.height = size;

        const ctx = cvs.getContext("2d");

        const computed = getComputedStyle(document.documentElement);
        const textRGB = parseCSSRGB(computed.getPropertyValue("--text-color"));
        let dominantRGB = parseCSSRGB(computed.getPropertyValue("--dynamic-dominant-color-rgb"));

        let pixelRGB = [...textRGB];

        const font = {
            T: ["xxx", ".x.", ".x.", ".x.", ".x."],
            E: ["xxx", "x..", "xx.", "x..", "xxx"],
            R: ["xx.", "x.x", "xx.", "x.x", "x.x"],
            M: ["x.x", "xxx", "x.x", "x.x", "x.x"],
            I: ["xxx", ".x.", ".x.", ".x.", "xxx"],
            N: ["x.x", "xxx", "xxx", "xxx", "x.x"],
            A: [".x.", "x.x", "xxx", "x.x", "x.x"],
            L: ["x..", "x..", "x..", "x..", "xxx"],
            C: [".xx", "x..", "x..", "x..", ".xx"]
        };

        const sleepingCat = `
xx...xx........x
x.xxx.x........x
x.....x.......x.
x.x.x.xxxxx..x..
x.....x....xxx..
.x...x.....x....
..xxxx.....x....
....xxxxxxx.....
`;

        const standingCatToLeft = `
xx...xx........x
x.xxx.x........x
x.....x.......x.
x.x.x.xxxxx..x..
x.....x....xxx..
.x...x.....x....
..xxxx.....x....
....xxxxxxx.....
.....x.x.xxx....
.....x.x.x.x....
`;

        const standingCatToLeftPose2 = `
xx...xx........x
x.xxx.x........x
x.....x.......x.
x.x.x.xxxxx..x..
x.....x....xxx..
.x...x.....x....
..xxxx.....x....
....xxxxxxx.....
....x.x.xxx.....
...x..x.x..x....
`;

        const sleepZSml = `
xx
.x.
.xx
`;

        const sleepZMed = `
xxx.
..x.
.x..
.xxx
`;

        const sleepZLarge = `
xxxx.
..x..
.x...
.xxxx
`;

        let state = { type: "walk", x: 0 };
        let colorT = 0;

        function drawRect(x, y) {
            ctx.fillStyle = `rgb(${pixelRGB.join(",")})`;
            ctx.fillRect(x * pxSize, y * pxSize, pxSize, pxSize);
        }

        function drawArt(px, py, str, flip) {
            const lines = str.split("\n");
            for (let y = 0; y < lines.length; y++) {
                let chars = lines[y].split("");
                if (flip) chars.reverse();
                for (let x = 0; x < chars.length; x++) {
                    if (chars[x] === "x") drawRect(x + px, y + py);
                }
            }
        }

        function drawText(px, py, text) {
            let offset = 0;
            for (const ch of text) {
                if (ch === " ") { offset += 4; continue }

                const glyph = font[ch];
                if (!glyph) continue;

                for (let y = 0; y < glyph.length; y++) {
                    for (let x = 0; x < glyph[y].length; x++) {
                        if (glyph[y][x] === "x") drawRect(px + x + offset, py + y);
                    }
                }

                offset += 4;
            }
        }

        function clear() { ctx.clearRect(0, 0, size, size) }

        function sleepAnimation() {
            if (state.t === undefined) state.t = 0;

            drawArt(20, 32, sleepingCat);
            if (state.t >= 1) drawArt(28, 27, sleepZSml);
            if (state.t >= 2) drawArt(32, 22, sleepZMed);
            if (state.t >= 3) drawArt(36, 18, sleepZLarge);

            state.t = (state.t + 1) % 4;

            if (Math.random() < 0.1) state = { type: "walk", x: 0 };

            setTimeout(() => { if (isAlive()) refresh(); }, 500);
        }

        function walkAnimation() {
            if (state.t === undefined) state.t = 0;
            if (state.dir === undefined) state.dir = "left";

            const flip = state.dir === "right";

            if (state.t < 4) drawArt(20 + state.x, 30, standingCatToLeft, flip);
            else drawArt(20 + state.x, 30, standingCatToLeftPose2, flip);

            state.t++;
            if (state.t > 8) state.t -= 8;

            state.x += state.dir === "left" ? -1 : 1;

            if (state.dir === "left" && state.x < -10) state.dir = "right";
            if (state.dir === "right" && state.x > 10) state.dir = "left";

            if (state.x === 0 && Math.random() < 0.5) { state = { type: "sleep" }; }

            setTimeout(() => { if (isAlive()) refresh(); }, 100);
        }

        function refresh() {
            clear();

            drawText(4, 6, "TERMINAL CAT");

            // eslint-disable-next-line default-case
            switch (state.type) {
                case "sleep": sleepAnimation(); break;
                case "walk": walkAnimation(); break;
            }
        }

        function easeInOut(t) {
            const sqt = t ** 2;
            return sqt / (2 * (sqt - t) + 1);
        }

        function colorTweenRGB(a, b, t) { return a.map((av, i) => (b[i] - av) * t + av) }

        function setColor() {
            const computed = getComputedStyle(document.documentElement);
            dominantRGB = parseCSSRGB(computed.getPropertyValue("--dynamic-dominant-color-rgb"));

            let t = colorT;
            const inc = 0.05;

            if (state.type === "sleep") colorT = Math.min(t + inc, 1);
            else colorT = Math.max(t - inc, 0);

            t = easeInOut(t);

            const bgRGB = colorTweenRGB(dominantRGB, textRGB, t);
            cvs.style.backgroundColor = `rgb(${bgRGB.join(",")})`;

            pixelRGB = colorT < 0.5 ? textRGB : dominantRGB;
        }

        refresh();
        const colorInterval = setInterval(setColor, 30);

        return () => {
            //eslint-disable-next-line react-hooks/exhaustive-deps
            genRef.current++;
            clearInterval(colorInterval);
        };

    }, []);

    return (
        <canvas
            ref={canvasRef}
        />
    );
}
