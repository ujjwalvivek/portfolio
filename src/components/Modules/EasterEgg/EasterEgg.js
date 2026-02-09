import { useState, useRef, useEffect } from "react";
import TerminalFooter from "../TerminalFooter/TerminalFooter";
import styles from "./EasterEgg.module.css";
import { useBackground } from "../../Background/BackgroundContext";

const EasterEgg = () => {
  const easterEggText = "ђэýýý קรร†!! ý๏µ ки๏ω ý๏µ ωลи† †๏ ¢ℓเ¢к мэ :)";
  const [showTerminal, setShowTerminal] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const terminalRef = useRef(null);

  const { backgroundConfig } = useBackground();

  // Only add glitch/pulse/flicker if background is not "none"
  const glitchyClasses = backgroundConfig.type !== 'none' ? `${styles.blink} ${styles.flicker}` : '';

  useEffect(() => {
    if (showTerminal && terminalRef.current) {
      requestAnimationFrame(() => {
        terminalRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }, [showTerminal]);

  return (
    <>
      {!showTerminal && (
        <div className={styles.easterEgg}>
          <span
            className={`${styles.easterEggIcon} ${glitchyClasses}`}
            onClick={() => {
              if (!showTerminal) setShowTerminal(true);
            }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseMove={e => setTooltipPos({ x: e.clientX, y: e.clientY })}
            onMouseLeave={() => setShowTooltip(false)}
            style={{ cursor: 'help' }}
          >
            {easterEggText}
          </span>
          {showTooltip && (
            <span
              className={styles.easterEggTooltip}
              style={{
                position: 'fixed',
                left: tooltipPos.x + 8,
                top: tooltipPos.y + 8,
                zIndex: 9999,
                pointerEvents: 'none'
              }}
            >
              {"Click me :)"}
            </span>
          )}
        </div>
      )}
      {showTerminal && (
        <div className={styles.clicked} style={{ position: 'relative', width: '100%' }} ref={terminalRef}>
          <TerminalFooter />
        </div>
      )}
    </>
  );
};

export default EasterEgg;