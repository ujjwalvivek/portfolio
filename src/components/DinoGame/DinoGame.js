import React from "react";
import styles from "./DinoGame.module.css";

const DinoGame = () => {
const [dinoY, setDinoY] = React.useState(0); // 0 = ground, -60 = jump
  const [isJumping, setIsJumping] = React.useState(false);
  const [obstacles, setObstacles] = React.useState([{ x: 400, height: 32 }]);
  const [score, setScore] = React.useState(0);
  const [gameOver, setGameOver] = React.useState(false);
  const gameRef = React.useRef();
  const dinoRef = React.useRef();
  const [jumpStart, setJumpStart] = React.useState(null);
  const [jumpPower, setJumpPower] = React.useState(0);

  // Draggable state
  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  const [dragging, setDragging] = React.useState(false);
  const [rel, setRel] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
  setPos({
    x: window.innerWidth / 2 - 200,
    y: window.innerHeight / 2 - 250
  });
}, []);

  // Drag handlers
  const onMouseDown = (e) => {
    setDragging(true);
    const rect = gameRef.current.getBoundingClientRect();
    setRel({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    e.preventDefault();
  };
  React.useEffect(() => {
    const onMouseMove = (e) => {
      if (!dragging) return;
      setPos({
        x: e.clientX - rel.x,
        y: e.clientY - rel.y,
      });
    };
    const onMouseUp = () => setDragging(false);
    if (dragging) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging, rel]);

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.code === "Space" || e.key === " ") && !isJumping && !gameOver && jumpStart === null) {
        setJumpStart(Date.now());
        setIsJumping(true);
      }
      if ((e.code === "Space" || e.key === " ") && gameOver) {
        setObstacles([{ x: 400, height: 32 }]);
        setScore(0);
        setGameOver(false);
      }
    };
    const handleKeyUp = (e) => {
      if ((e.code === "Space" || e.key === " ") && isJumping && jumpStart !== null) {
        const duration = Math.min(Date.now() - jumpStart, 350); // max 350ms
        const power = duration / 350; // 0 to 1
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
  }, [isJumping, gameOver, jumpStart]);

  // Handle jump
  React.useEffect(() => {
    if (jumpPower > 0) {
      const jumpHeight = -40 - jumpPower * 40; // -40 to -80
      setDinoY(jumpHeight);
      setTimeout(() => {
        setDinoY(0);
        setIsJumping(false);
        setJumpPower(0);
      }, 400 + jumpPower * 100); // slightly longer hang time for phasing further
    }
  }, [jumpPower]);

  // Move obstacles and check collision
  React.useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setObstacles((obs) => {
        let newObs = obs.map(o => ({ ...o, x: o.x - 5 }));
        // Add new obstacle if needed
        if (newObs.length === 0 || newObs[newObs.length - 1].x < 200 + Math.random() * 80) {
          newObs.push({
            x: 400 + Math.random() * 100,
            height: 24 + Math.floor(Math.random() * 32) // height between 24 and 56px
          });
        }
        // Remove off-screen
        newObs = newObs.filter(o => o.x > -20);
        return newObs;
      });
      setScore(s => s + 1);
    }, 20);
    return () => clearInterval(interval);
  }, [gameOver]);

  // Collision detection
  React.useEffect(() => {
    if (gameOver) return;
    for (let o of obstacles) {
      if (
        o.x < 50 && o.x > 10 &&
        dinoY > -30 && // dino is on ground
        o.height > 20 // only check if obstacle is tall enough
      ) {
        setGameOver(true);
      }
    }
  }, [obstacles, dinoY, gameOver]);

  return (
    <>
      <div
        className={styles.dinoGameNote}
        style={{
          left: pos.x,
          top: pos.y + 130,
        }}
      >
        too lazy to animate, let this phasing 🦖 be your friend in this downtime. try not to crash!
      </div>
      <div
        ref={gameRef}
        className={
          styles.dinoGameContainer +
          " " +
          (dragging ? styles.grabbing : styles.grab)
        }
        style={{
          left: pos.x,
          top: pos.y,
        }}
        tabIndex={0}
        onMouseDown={onMouseDown}
      >
        {/* Dino */}
        <div
          ref={dinoRef}
          className={styles.dino}
          style={{
            bottom: 10 + dinoY,
          }}
        >
          🦖
        </div>

        {/* Obstacles */}
        {obstacles.map((o, i) => (
          <div
            key={i}
            className={styles.obstacle}
            style={{
              left: o.x,
              height: o.height,
            }}
          />
        ))}

        {/* Ground */}
        <div className={styles.ground} />

        {/* Score */}
        <div className={styles.score}>{score}</div>

        {/* Game Over */}
        {gameOver && (
          <div className={styles.gameOver}>
            <div>D E A D</div>
            <div className={styles.gameOverScore}>
              score: <span style={{ color: "#7fffd4" }}>{score}</span>
            </div>
            <div className={styles.gameOverHint}>
              press space to restart
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DinoGame;