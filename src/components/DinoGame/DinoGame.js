import React from "react";
import styles from "./DinoGame.module.css";

const GAME_WIDTH = Math.min(window.innerWidth * 0.98, 400);
const GAME_HEIGHT = 150;

const DinoGame = () => {
  const [dinoY, setDinoY] = React.useState(0);
  const [isJumping, setIsJumping] = React.useState(false);
  const [obstacles, setObstacles] = React.useState([{ x: 400, height: 32, passed: false }]); // <-- missing passed: false
  const [score, setScore] = React.useState(0);
  const [gameOver, setGameOver] = React.useState(false);
  const dinoRef = React.useRef();
  const [jumpStart, setJumpStart] = React.useState(null);
  const [jumpPower, setJumpPower] = React.useState(0);
  const [gameStarted, setGameStarted] = React.useState(false);
  const [windowPos, setWindowPos] = React.useState({
    x: (window.innerWidth - GAME_WIDTH) / 2,
    y: (window.innerHeight - GAME_HEIGHT) / 2 + 200,
  });
  const [dragging, setDragging] = React.useState(false);
  const dragOffset = React.useRef({ x: 0, y: 0 });
  const draggingRef = React.useRef(false);
  const windowPosRef = React.useRef(windowPos);
  // eslint-disable-next-line
  const [gameSpeed, setGameSpeed] = React.useState(20); // initial speed in px/sec
  const speedRef = React.useRef(20); // initial speed

  // Spacebar jump logic
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.code === "Space" || e.key === " ")) {
        if (!gameStarted) {
          setGameStarted(true);
          return;
        }
        if (!isJumping && !gameOver && jumpStart === null) {
          setJumpStart(Date.now());
          setIsJumping(true);
        }
        if (gameOver) {
          setObstacles([{ x: 400, height: 32, passed: false }]);
          setScore(0);
          setGameOver(false);
        }
      }
    };
    const handleKeyUp = (e) => {
      if (
        (e.code === "Space" || e.key === " ") &&
        isJumping &&
        jumpStart !== null
      ) {
        const duration = Math.min(Date.now() - jumpStart, 350);
        const power = duration / 350;
        setJumpPower(power);
        setJumpStart(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isJumping, gameOver, jumpStart, gameStarted]);

  // Handle jump
  React.useEffect(() => {
    if (jumpPower > 0) {
      const jumpHeight = -40 - jumpPower * 40;
      setDinoY(jumpHeight);
      setTimeout(() => {
        setDinoY(0);
        setIsJumping(false);
        setJumpPower(0);
      }, 400 + jumpPower * 100);
    }
  }, [jumpPower]);

  // Collision detection
  React.useEffect(() => {
    if (gameOver || !gameStarted) return;
    for (let o of obstacles) {
      if (
        o.x < 50 &&
        o.x > 10 &&
        dinoY > -30 &&
        o.height > 20
      ) {
        setGameOver(true);
      }
    }
  }, [obstacles, dinoY, gameOver, gameStarted]);

  // Unified jump handler
  const handleJump = () => {
    if (!gameStarted) {
      setGameStarted(true);
      return;
    }
    if (!isJumping && !gameOver && jumpStart === null) {
      setJumpStart(Date.now());
      setIsJumping(true);
      // Instantly set jump power for mouse click
      const power = 1;
      setJumpPower(power);
      setJumpStart(null);
    }
    if (gameOver) {
      setObstacles([{ x: 400, height: 32, passed: false }]);
      setScore(0);
      setGameOver(false);
    }
  };

  const handleTouchEnd = () => {
    if (isJumping && jumpStart !== null) {
      const duration = Math.min(Date.now() - jumpStart, 350);
      const power = duration / 350;
      setJumpPower(power);
      setJumpStart(null);
    }
  };

  const handleMouseUp = () => {
    if (isJumping && jumpStart !== null) {
      const duration = Math.min(Date.now() - jumpStart, 350);
      const power = duration / 350;
      setJumpPower(power);
      setJumpStart(null);
    }
  };

  const handleBarMouseDown = (e) => {
    setDragging(true);
    draggingRef.current = true;
    dragOffset.current = {
      x: e.clientX - windowPos.x,
      y: e.clientY - windowPos.y,
    };
    window.addEventListener("mousemove", handleBarMouseMove);
    window.addEventListener("mouseup", handleBarMouseUp);
  };

  const handleBarMouseMove = (e) => {
    if (!draggingRef.current) return;
    windowPosRef.current = {
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y,
    };
    // Force a re-render by updating state, but throttle with requestAnimationFrame for smoothness
    if (!handleBarMouseMove.raf) {
      handleBarMouseMove.raf = requestAnimationFrame(() => {
        setWindowPos({ ...windowPosRef.current });
        handleBarMouseMove.raf = null;
      });
    }
  };

  const handleBarMouseUp = () => {
    setDragging(false);
    draggingRef.current = false;
    setWindowPos({ ...windowPosRef.current }); // Final update
    window.removeEventListener("mousemove", handleBarMouseMove);
    window.removeEventListener("mouseup", handleBarMouseUp);
  };

  // Touch support
  const handleBarTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    setDragging(true);
    dragOffset.current = {
      x: e.touches[0].clientX - windowPos.x,
      y: e.touches[0].clientY - windowPos.y,
    };
    window.addEventListener("touchmove", handleBarTouchMove, { passive: false });
    window.addEventListener("touchend", handleBarTouchEnd);
  };

  const handleBarTouchMove = (e) => {
    if (e.touches.length !== 1) return;
    setWindowPos({
      x: e.touches[0].clientX - dragOffset.current.x,
      y: e.touches[0].clientY - dragOffset.current.y,
    });
    e.preventDefault();
  };

  const handleBarTouchEnd = () => {
    setDragging(false);
    window.removeEventListener("touchmove", handleBarTouchMove);
    window.removeEventListener("touchend", handleBarTouchEnd);
  };

  // Reset speed on game start/restart
  React.useEffect(() => {
    if (gameStarted && !gameOver) {
      setGameSpeed(5);
      speedRef.current = 5;
    }
  }, [gameStarted, gameOver]);

  // Game loop for obstacle movement and speed adjustment
  React.useEffect(() => {
    if (gameOver || !gameStarted) return;

    let lastTime = performance.now();
    let animationFrame;

    const SPEED_INCREMENT = 20;
    const BASE_SPEED = 200;
    // Breakpoints for speed adjustment
    const BREAKPOINT_START = 2;
    const BREAKPOINT_STEP = 6;
    const BREAKPOINT_COUNT = 100;

    const SPEED_BREAKPOINTS = Array.from(
      { length: BREAKPOINT_COUNT },
      (_, i) => BREAKPOINT_START + i * BREAKPOINT_STEP
    );

    const getSpeedForScore = (score) => {
      let speed = BASE_SPEED;
      for (let i = 0; i < SPEED_BREAKPOINTS.length; i++) {
        if (score >= SPEED_BREAKPOINTS[i]) {
          speed = BASE_SPEED + (i + 1) * SPEED_INCREMENT;
        }
      }
      return speed;
    };

    const loop = (now) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // Set speed based on score
      const currentSpeed = getSpeedForScore(score);
      speedRef.current = currentSpeed;
      setGameSpeed(currentSpeed);

      setObstacles((obs) => {
        let newObs = obs.map((o) => ({ ...o, x: o.x - currentSpeed * delta }));

        // Add new obstacles as before
        if (
          newObs.length === 0 ||
          newObs[newObs.length - 1].x < 200 + Math.random() * 80
        ) {
          newObs.push({
            x: 400 + Math.random() * 100,
            height: 24 + Math.floor(Math.random() * 32),
            passed: false, // <-- add this
          });
        }

        // Filter out obstacles that have left the screen
        newObs = newObs.filter((o) => o.x > -20);

        // Count obstacles passed
        let passedCount = 0;
        newObs = newObs.map((o) => {
          if (!o.passed && o.x + 10 < 0) { // x+width < 0, adjust as needed
            passedCount += 1;
            return { ...o, passed: true };
          }
          return o;
        });

        if (passedCount > 0) {
          setScore((s) => s + passedCount);
        }

        return newObs;
      });

      animationFrame = requestAnimationFrame(loop);
    };

    animationFrame = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animationFrame);
  }, [gameOver, gameStarted, score]); // <-- do NOT add gameSpeed here!

  return (
    <div
      className={styles.dinoGameWrapper}
      style={{
        position: "fixed",
        left: windowPos.x,
        top: windowPos.y,
        zIndex: 10000,
        userSelect: dragging ? "none" : "auto",
      }}
    >
      {/* Draggable Window Bar */}
      <div
        className={styles.gameWindowBar}
        style={{ cursor: dragging ? "grabbing" : "grab" }}
        onMouseDown={handleBarMouseDown}
        onTouchStart={handleBarTouchStart}
      >
        <span className={styles.gameWindowBarDot} style={{ background: '#ff5f56' }} onClick={() => { }} />
        <span className={styles.gameWindowBarDot} style={{ background: '#ffbd2e' }} onClick={() => { }} />
        <span className={styles.gameWindowBarDot} style={{ background: '#27c93f' }} onClick={() => { }} />
        <span className={styles.gameStartTitle}>DINO BLINK GAME</span>
        <span className={styles.crashDotTooltip}>
          <div className={styles.gameStartMeme}>
            {"// dev was too lazy to animate, so we blink now"}<br />
            {"// blink mains only. titans and hunters, cope"}
          </div>
        </span>
      </div>

      <div className={styles.dinoGameContainer} tabIndex={0} onClick={handleJump} onMouseUp={handleMouseUp} onTouchStart={handleJump} onTouchEnd={handleTouchEnd}>
        {/* Game Start Screen */}
        {!gameStarted && (
          <div className={styles.gameStart}>
            <div className={styles.gameStartDescription}>
              <span className={styles.flicker}>{">"}</span> {"dino doesn't jump. he just blinks ahead."}<br />
              <span className={styles.flicker}>{">"}</span> {"why you ask? "}<br />
              <span className={styles.flicker}>{">"}</span> {"he thinks he's a warlock. he's not."}<br />
              <span className={styles.blink}>{">"}</span> {"press "}<span style={{ textDecoration: "underline" }}>space</span> {" or tap to start."}<br />
            </div>
            <div className={styles.gameStartMeme}>

            </div>
          </div>
        )}
        {/* Dino */}
        <div ref={dinoRef} className={styles.dino} style={{ bottom: 10 + dinoY }}>
          {/* 🦖 */}
          <img
            src="https://cdn.ujjwalvivek.com/images/dino.svg"
            alt="Dino"
            style={{ width: "32px", height: "32px", display: "block", opacity: isJumping ? 0 : 0.9 }}
            draggable={false}
          />
        </div>
        {/* Obstacles */}
        {obstacles.map((o, i) => (
          <div key={i} className={styles.obstacle} style={{ left: o.x, height: o.height }} />
        ))}
        {/* Ground */}
        <div className={styles.ground} />
        {/* Score */}
        <div className={styles.score}>{score}</div>
        {/* Game Over */}
        {gameOver && (
          <div className={styles.gameOver}>
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
              <div className={styles.gameOverText}>D.E.A.D</div>
              <div className={styles.gameOverScore} style={{ position: "absolute", right: "10px", top: "6px" }}>
                score: <span style={{ color: "#7fffd4" }}>{score}</span>
              </div>
            </div>
            <div className={styles.gameOverHint} style={{ marginTop: "0rem" }}>
              press <span style={{ textDecoration: "underline", color: "#7fffd4" }}>space</span> to restart
            </div>
            <div className={styles.gameOverHint} style={{ opacity: "0.25" }}>
              ⟬tip: open your đɘʋ ĉøŋşɸʟə⟭
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DinoGame;