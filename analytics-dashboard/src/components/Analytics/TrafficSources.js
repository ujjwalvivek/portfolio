import React from 'react';
import styles from './TrafficSources.module.css';

const TrafficSources = ({ data, onShowMore }) => {
  if (!data || data.length === 0) {
    return (
      <div className={styles.noData}>
        <span className={styles.noDataIcon}>🌐</span>
        <p>No traffic data available</p>
      </div>
    );
  }

  const displayData = data.slice(0, 5);
  
  return (
    <div className={styles.container}>
      <div className={styles.sourcesList}>
        {displayData.map((source, index) => (
          <div key={source.source} className={styles.sourceItem}>
            <div className={styles.sourceInfo}>
              <div className={styles.sourceName}>{source.source}</div>
              <div className={styles.sourceBar}>
                <div 
                  className={styles.sourceBarFill}
                  style={{ 
                    width: `${source.percentage}%` 
                  }}
                ></div>
              </div>
            </div>
            <div className={styles.sourcePercentage}>
              {source.percentage}%
            </div>
          </div>
        ))}
      </div>

      {data.length > 5 && (
        <button className={styles.showMoreButton} onClick={onShowMore}>
          View All {data.length} Sources
        </button>
      )}
    </div>
  );
};

export default TrafficSources;
