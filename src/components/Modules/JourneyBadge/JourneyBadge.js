import styles from './JourneyBadge.module.css';

const JourneyBadge = () => {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.topGlow}></div>
        <div className={styles.content}>
          <div className={styles.titleSection}>
            <div className={styles.titleRow}>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className={styles.iconMain}
              >
                <path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>
              </svg>
              <div className={styles.titleText}>
                Journey Engine
              </div>
            </div>
            <div className={styles.subtitle}>
              v0.2.0 • Live Status
            </div>
          </div>

          <div className={styles.statusSection}>
            <div className={styles.phaseDone}>
              <div className={styles.dotContainer}>
                <span className={styles.ping}></span>
                <span className={styles.dot}></span>
              </div>
              <span style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>Phase 1 & 2 Done</span>
            </div>
            
            <div className={styles.phaseWip}>
               <svg 
                 className={styles.spinner}
                 xmlns="http://www.w3.org/2000/svg" 
                 fill="none" 
                 viewBox="0 0 24 24"
               >
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>Phase 3 & 4</span>
                <span className={styles.badgeWip}>
                  WIP
                </span>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default JourneyBadge;