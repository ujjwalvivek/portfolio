// https://codepen.io/burlapjack/pen/ZBWPVW

import { useEffect, useRef } from 'react';

const LemmingCanvas = ({ isAnimated = true, ...props }) => {
    const canvasRef = useRef(null);
    const isAnimatedRef = useRef(isAnimated);

    useEffect(() => {
        isAnimatedRef.current = isAnimated;
    }, [isAnimated]);

    useEffect(() => {
        const c = canvasRef.current;
        if (!c) return;

        // Configuration
        c.width = c.clientWidth;
        c.height = c.clientHeight;

        const ctx = c.getContext("2d");
        const numFrames = 15;
        let scale = c.height / 10;
        let lemArray = [];

        // Colors
        const blk = "#000000"; //black
        const wht = "#ffffff"; // white

        // Dynamic colors - defined as lets so they can be updated
        let lbu = "#5555ff";
        let dgr = "#00aa00";

        const updateColors = () => {
            const styles = getComputedStyle(c);
            lbu = styles.getPropertyValue('--dynamic-dominant-color').trim() || "#5555ff";
            dgr = styles.getPropertyValue('--dynamic-hsl-average').trim() || "#00aa00";
        };

        updateColors();

        if (scale === 0) scale = 10;

        // Resize handler
        const handleResize = () => {
            if (!c) return;
            c.width = c.clientWidth;
            c.height = c.clientHeight;
            scale = c.height / 10;
            if (scale === 0) scale = 10;
        };

        window.addEventListener('resize', handleResize);

        class Blocker {
            constructor(x) {
                this.kind = "blocker";
                this.x = x;
                this.frame = 0;
                this.sprite = [
                    [0, 0, 0, 3, 3, 3, 0, 0, 0, 0],
                    [0, 0, 3, 3, 3, 3, 3, 0, 0, 0],
                    [0, 0, 3, 3, 1, 1, 1, 0, 0, 0],
                    [1, 0, 0, 0, 1, 1, 0, 0, 0, 1],
                    [1, 1, 1, 1, 2, 2, 1, 1, 1, 1],
                    [0, 0, 0, 0, 2, 2, 0, 0, 0, 0],
                    [0, 0, 0, 0, 2, 2, 0, 0, 0, 0],
                    [0, 0, 0, 2, 2, 2, 2, 0, 0, 0],
                    [0, 0, 0, 2, 0, 0, 2, 0, 0, 0],
                    [0, 0, 1, 1, 0, 0, 1, 1, 0, 0]
                ];
                lemArray.push(this);
            }

            animate(shouldUpdate) {
                switch (this.frame) {
                    case 0:
                        this.sprite[0] = [0, 0, 0, 3, 3, 3, 0, 0, 0, 0];
                        this.sprite[1] = [0, 0, 3, 3, 3, 3, 3, 0, 0, 0];
                        this.sprite[2] = [0, 0, 3, 3, 1, 1, 1, 0, 0, 0];
                        this.sprite[8] = [0, 0, 0, 2, 0, 0, 2, 0, 0, 0];
                        this.sprite[9] = [0, 0, 1, 1, 0, 0, 1, 1, 0, 0];
                        break;
                    case 1:
                        this.sprite[0] = [0, 0, 0, 0, 3, 3, 0, 0, 0, 0];
                        this.sprite[1] = [0, 0, 3, 3, 3, 3, 3, 0, 0, 0];
                        this.sprite[2] = [0, 0, 3, 3, 3, 1, 1, 0, 0, 0];
                        break;
                    case 2:
                        this.sprite[0] = [0, 0, 0, 0, 3, 3, 0, 0, 0, 0];
                        this.sprite[1] = [0, 0, 0, 3, 3, 3, 3, 0, 0, 0];
                        this.sprite[2] = [0, 0, 3, 3, 3, 1, 1, 0, 0, 0];
                        this.sprite[8] = [0, 0, 0, 2, 0, 0, 2, 1, 0, 0];
                        this.sprite[9] = [0, 0, 1, 1, 0, 0, 1, 0, 0, 0];
                        break;
                    case 3:
                        this.sprite[0] = [0, 0, 0, 0, 3, 3, 0, 0, 0, 0];
                        this.sprite[1] = [0, 0, 0, 3, 3, 3, 3, 0, 0, 0];
                        this.sprite[2] = [0, 0, 0, 3, 3, 1, 1, 0, 0, 0];
                        break;
                    case 4:
                        this.sprite[8] = [0, 0, 0, 2, 0, 0, 2, 0, 0, 0];
                        this.sprite[9] = [0, 0, 1, 1, 0, 0, 1, 1, 0, 0];
                        break;
                    case 5: break;
                    case 6:
                        this.sprite[0] = [0, 0, 0, 0, 3, 3, 0, 0, 0, 0];
                        this.sprite[1] = [0, 0, 0, 3, 3, 3, 3, 0, 0, 0];
                        this.sprite[2] = [0, 0, 0, 3, 1, 1, 3, 0, 0, 0];
                        this.sprite[8] = [0, 0, 0, 2, 0, 0, 2, 1, 0, 0];
                        this.sprite[9] = [0, 0, 1, 1, 0, 0, 1, 0, 0, 0];
                        break;
                    case 7: break;
                    case 8:
                        this.sprite[0] = [0, 0, 0, 0, 3, 3, 3, 0, 0, 0];
                        this.sprite[1] = [0, 0, 0, 3, 3, 3, 3, 3, 0, 0];
                        this.sprite[2] = [0, 0, 0, 1, 1, 1, 3, 3, 0, 0];
                        this.sprite[8] = [0, 0, 0, 2, 0, 0, 2, 0, 0, 0];
                        this.sprite[9] = [0, 0, 1, 1, 0, 0, 1, 1, 0, 0];
                        break;
                    case 9:
                        this.sprite[0] = [0, 0, 0, 0, 3, 3, 0, 0, 0, 0];
                        this.sprite[1] = [0, 0, 0, 3, 3, 3, 3, 3, 0, 0];
                        this.sprite[2] = [0, 0, 0, 1, 1, 3, 3, 3, 0, 0];
                        break;
                    case 10:
                        this.sprite[0] = [0, 0, 0, 0, 3, 3, 0, 0, 0, 0];
                        this.sprite[1] = [0, 0, 0, 3, 3, 3, 3, 0, 0, 0];
                        this.sprite[2] = [0, 0, 0, 1, 1, 3, 3, 3, 0, 0];
                        this.sprite[8] = [0, 0, 0, 2, 0, 0, 2, 1, 0, 0];
                        this.sprite[9] = [0, 0, 1, 1, 0, 0, 1, 0, 0, 0];
                        break;
                    case 11:
                        this.sprite[0] = [0, 0, 0, 0, 3, 3, 0, 0, 0, 0];
                        this.sprite[1] = [0, 0, 0, 3, 3, 3, 3, 0, 0, 0];
                        this.sprite[2] = [0, 0, 0, 1, 1, 3, 3, 0, 0, 0];
                        break;
                    case 12:
                        this.sprite[8] = [0, 0, 0, 2, 0, 0, 2, 0, 0, 0];
                        this.sprite[9] = [0, 0, 1, 1, 0, 0, 1, 1, 0, 0];
                        break;
                    case 13: break;
                    case 14:
                        this.sprite[0] = [0, 0, 0, 0, 3, 3, 0, 0, 0, 0];
                        this.sprite[1] = [0, 0, 0, 3, 3, 3, 3, 0, 0, 0];
                        this.sprite[2] = [0, 0, 0, 3, 1, 1, 3, 0, 0, 0];
                        this.sprite[8] = [0, 0, 0, 2, 0, 0, 2, 1, 0, 0];
                        this.sprite[9] = [0, 0, 1, 1, 0, 0, 1, 0, 0, 0];
                        break;
                    case 15: break;
                    default: break;
                }

                for (let i = 0; i < 10; i++) {
                    for (let j = 0; j < 10; j++) {
                        switch (this.sprite[i][j]) {
                            case 0: ctx.fillStyle = blk; break;
                            case 1: ctx.fillStyle = wht; break;
                            case 2: ctx.fillStyle = lbu; break;
                            case 3: ctx.fillStyle = dgr; break;
                            default: break;
                        }
                        if (this.sprite[i][j] !== 0) {
                            // Added overlap (+ 0.4) to fix sub-pixel rendering gaps
                            ctx.fillRect(scale * j + this.x, scale * i, scale + 0.4, scale + 0.4);
                        }
                    }
                }

                if (shouldUpdate) {
                    if (this.frame < numFrames) {
                        this.frame++;
                    } else if (this.frame === numFrames) {
                        this.frame = 0;
                    }
                }
            }
        }

        class Walker {
            constructor(x, dr) {
                this.kind = "walker";
                this.frame = 0;
                this.x = x;
                this.dr = dr;
                this.sprite = [
                    [
                        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        [0, 0, 0, 3, 3, 3, 3, 0, 0, 0],
                        [0, 0, 0, 3, 3, 1, 0, 0, 0, 0],
                        [0, 0, 0, 0, 1, 1, 1, 0, 0, 0],
                        [0, 0, 0, 0, 1, 2, 0, 0, 0, 0],
                        [0, 0, 0, 0, 1, 2, 0, 0, 0, 0],
                        [0, 0, 0, 0, 1, 2, 0, 0, 0, 0],
                        [0, 0, 0, 0, 2, 2, 0, 0, 0, 0],
                        [0, 0, 0, 1, 2, 2, 0, 0, 0, 0],
                        [0, 0, 0, 0, 1, 1, 0, 0, 0, 0]
                    ],
                    [
                        [0, 0, 0, 0, 3, 0, 3, 0, 0, 0], //frame 1
                        [0, 0, 0, 3, 3, 3, 0, 0, 0, 0],
                        [0, 0, 0, 3, 3, 1, 0, 0, 0, 0],
                        [0, 0, 0, 0, 1, 1, 1, 0, 0, 0],
                        [0, 0, 0, 0, 1, 2, 0, 0, 0, 0],
                        [0, 0, 0, 1, 2, 2, 0, 0, 0, 0],
                        [0, 0, 0, 1, 2, 2, 0, 1, 0, 0],
                        [0, 0, 0, 0, 2, 2, 0, 1, 0, 0],
                        [0, 0, 0, 2, 2, 0, 1, 0, 0, 0],
                        [0, 0, 0, 1, 1, 0, 0, 0, 0, 0]
                    ],
                    [
                        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //frame 2
                        [0, 0, 0, 3, 0, 3, 0, 0, 0, 0],
                        [0, 0, 0, 3, 3, 3, 0, 0, 0, 0],
                        [0, 0, 0, 0, 3, 1, 0, 0, 0, 0],
                        [0, 0, 0, 0, 1, 1, 1, 0, 0, 0],
                        [0, 0, 0, 1, 1, 2, 0, 0, 0, 0],
                        [0, 0, 0, 1, 2, 2, 0, 0, 0, 0],
                        [0, 0, 1, 1, 2, 2, 2, 0, 0, 0],
                        [0, 0, 0, 2, 2, 2, 2, 0, 0, 0],
                        [0, 0, 1, 1, 0, 0, 1, 1, 0, 0]
                    ],
                    [
                        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //frame 3
                        [0, 0, 0, 0, 3, 3, 0, 0, 0, 0],
                        [0, 0, 0, 3, 3, 1, 3, 0, 0, 0],
                        [0, 0, 0, 3, 1, 1, 1, 0, 0, 0],
                        [0, 0, 0, 0, 1, 2, 0, 0, 0, 0],
                        [0, 0, 0, 0, 1, 2, 0, 0, 0, 0],
                        [0, 0, 0, 1, 2, 2, 0, 0, 0, 0],
                        [0, 0, 0, 0, 2, 2, 0, 0, 0, 0],
                        [0, 0, 1, 2, 2, 2, 2, 0, 0, 0],
                        [0, 0, 1, 0, 0, 1, 1, 0, 0, 0]
                    ],
                    [
                        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //frame 4
                        [0, 0, 0, 3, 3, 3, 3, 0, 0, 0],
                        [0, 0, 0, 3, 3, 1, 0, 0, 0, 0],
                        [0, 0, 0, 0, 1, 1, 1, 0, 0, 0],
                        [0, 0, 0, 0, 1, 2, 0, 0, 0, 0],
                        [0, 0, 0, 0, 2, 1, 0, 0, 0, 0],
                        [0, 0, 0, 0, 1, 2, 0, 0, 0, 0],
                        [0, 0, 0, 0, 2, 2, 0, 0, 0, 0],
                        [0, 0, 0, 1, 2, 2, 0, 0, 0, 0],
                        [0, 0, 0, 0, 1, 1, 0, 0, 0, 0]
                    ],
                    [
                        [0, 0, 0, 0, 3, 0, 3, 0, 0, 0], // frame 5
                        [0, 0, 0, 3, 3, 3, 0, 0, 0, 0],
                        [0, 0, 0, 3, 3, 1, 0, 0, 0, 0],
                        [0, 0, 0, 0, 1, 1, 1, 0, 0, 0],
                        [0, 0, 0, 0, 1, 2, 0, 0, 0, 0],
                        [0, 0, 0, 0, 2, 1, 0, 0, 0, 0],
                        [0, 0, 0, 0, 2, 1, 0, 1, 0, 0],
                        [0, 0, 0, 0, 2, 2, 0, 1, 0, 0],
                        [0, 0, 0, 2, 2, 0, 1, 0, 0, 0],
                        [0, 0, 0, 1, 1, 0, 0, 0, 0, 0]
                    ],
                    [
                        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // frame 6
                        [0, 0, 0, 3, 0, 3, 0, 0, 0, 0],
                        [0, 0, 0, 3, 3, 3, 0, 0, 0, 0],
                        [0, 0, 0, 0, 3, 1, 0, 0, 0, 0],
                        [0, 0, 0, 0, 1, 1, 1, 0, 0, 0],
                        [0, 0, 0, 0, 2, 1, 0, 0, 0, 0],
                        [0, 0, 0, 0, 2, 1, 0, 0, 0, 0],
                        [0, 0, 0, 0, 2, 2, 1, 0, 0, 0],
                        [0, 0, 0, 2, 2, 2, 2, 0, 0, 0],
                        [0, 0, 1, 1, 0, 0, 1, 1, 0, 0]
                    ],
                    [
                        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // frame 7
                        [0, 0, 0, 0, 3, 3, 0, 0, 0, 0],
                        [0, 0, 0, 3, 3, 1, 3, 0, 0, 0],
                        [0, 0, 0, 3, 1, 1, 1, 0, 0, 0],
                        [0, 0, 0, 0, 1, 2, 0, 0, 0, 0],
                        [0, 0, 0, 0, 1, 2, 0, 0, 0, 0],
                        [0, 0, 0, 0, 2, 1, 0, 0, 0, 0],
                        [0, 0, 0, 0, 2, 2, 0, 0, 0, 0],
                        [0, 0, 1, 2, 2, 2, 2, 0, 0, 0],
                        [0, 0, 1, 0, 0, 1, 1, 0, 0, 0]
                    ]
                ];
                lemArray.push(this);
            }

            animate(shouldUpdate) {
                for (let i = 0; i < 10; i++) {
                    for (let j = 0; j < 10; j++) {
                        switch (this.sprite[this.frame][i][j]) {
                            case 1: ctx.fillStyle = wht; break;
                            case 2: ctx.fillStyle = lbu; break;
                            case 3: ctx.fillStyle = dgr; break;
                            default: break;
                        }
                        if (this.sprite[this.frame][i][j] !== 0) {
                            var nt = Math.min(this.dr * scale * 10, 0);
                            ctx.fillRect(
                                scale * j * this.dr + this.x - nt,
                                scale * i,
                                scale + 0.4,
                                scale + 0.4
                            );
                        }
                    }
                }
                if (shouldUpdate) {
                    if (this.frame < 7) {
                        this.frame++;
                    } else if (this.frame === 7) {
                        this.frame = 0;
                    }

                    var sprWidth = scale * 10;
                    if (
                        this.x + this.dr * scale > 0 &&
                        this.x + this.dr * scale + sprWidth < c.width
                    ) {
                        this.x += this.dr * scale;
                    } else {
                        this.dr *= -1;
                    }

                    //check for collisions with blockers
                    for (let q = 0; q < lemArray.length; q++) {
                        if (
                            lemArray[q].kind === "blocker" &&
                            this.x + sprWidth + this.dr > lemArray[q].x &&
                            this.x + this.dr < lemArray[q].x + sprWidth
                        ) {
                            this.dr *= -1;
                        }
                    }
                }
            }
        }

        // Initialize objects
        const bl0 = new Blocker(600);
        const bl1 = new Blocker(300);
        const wk0 = new Walker(0, 1);
        const wk1 = new Walker(400, -1);
        const wk2 = new Walker(480, 1);
        const wk3 = new Walker(710, 1);

        // Animation loop
        const intervalId = setInterval(function () {
            // Update colors to react to theme changes
            updateColors();

            //run lemming animations
            ctx.clearRect(0, 0, c.width, c.height);

            const shouldUpdate = isAnimatedRef.current;
            bl0.animate(shouldUpdate);
            bl1.animate(shouldUpdate);
            wk0.animate(shouldUpdate);
            wk1.animate(shouldUpdate);
            wk2.animate(shouldUpdate);
            wk3.animate(shouldUpdate);
        }, 1000 / 15);

        // Cleanup
        return () => {
            clearInterval(intervalId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <canvas
            id="lemming"
            ref={canvasRef}
            style={{
                width: "100%",
                display: "block",
                ...props.style
            }}
            {...props}
        />
    );
};

export default LemmingCanvas;