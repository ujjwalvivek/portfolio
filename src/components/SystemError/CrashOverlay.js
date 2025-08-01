import React from "react";
import DinoGame from "../DinoGame/DinoGame";
import styles from "./CrashOverlay.module.css";
import { MdOutlineBugReport } from "react-icons/md";

const CrashOverlay = ({ onRestart }) => {
  const [mockClose, setMockClose] = React.useState(false);

  // React.useEffect(() => {
  //   if (performance.getEntriesByType("navigation")[0]?.type === "reload") {
  //     window.location.href = '/';
  //   }
  // }, []);

  return (
    <div className={styles.crashOverlay} onContextMenu={e => e.preventDefault()}>
      <div className={styles.crashWindow}>
        <div className={styles.crashWindowBar}>
          <span className={styles.crashDot} style={{ background: '#ff5f56' }} onClick={() => {
            setMockClose(true);
            setTimeout(() => setMockClose(false), 800);
          }} title="You wouldn't" />
          <span className={styles.crashDot} style={{ background: '#ffbd2e' }} onClick={() => window.open('https://duckduckgo.com', '_blank')} title="Embrace Privacy!" />
          <span className={styles.crashDot} style={{ background: '#27c93f' }} onClick={onRestart} title="Refresh button for the curious." />
          <span className={styles.crashTitle}>uh oh!</span>
          <a className={styles.restartButton} href="mailto:hello@ujjwalvivek.com" target="_blank" rel="noopener noreferrer" title="Send Feedback/Report or Just Say Hi"> <MdOutlineBugReport /> </a>
        </div>
        <div className={styles.crashWindowContent}>
          {mockClose && (
            <div className={styles.mockCloseMsg}>
              <span>Nice try! Try Harder.</span>
            </div>
          )}
          <div className={styles.crashTextMain + ' ' + styles.blink}>{"> session.crashed _"}</div>
          <div className={styles.crashTextSub}>logs flushed. session configurations saved. play the game.</div>
          <DinoGame />
        </div>
        <div className={styles.crashFooter}>
          <div className={styles.crashFooterText + ' ' + styles.flicker} style={{ textShadow: '0 0 0.5rem rgba(82, 255, 39, 0.8)' }}>ujjwalvivek.com ⊗ no trackers ⊗ no cookies ⊗ no analytics</div>
        </div>
      </div>
    </div>
  );
};

export default CrashOverlay;