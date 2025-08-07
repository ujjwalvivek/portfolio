import React from 'react';
import styles from './SearchAnalytics.module.css';

const SearchAnalytics = ({ data, onShowMore }) => {
  if (!data || data.length === 0) {
    return (
      <div className={styles.noData}>
        <span className={styles.noDataIcon}>🔍</span>
        <p>No search data available</p>
      </div>
    );
  }

  const displayData = data.slice(0, 5);

  return (
    <div className={styles.container}>
      <div className={styles.searchList}>
        {displayData.map((search, index) => (
          <div key={search.term} className={styles.searchItem}>
            <div className={styles.searchInfo}>
              <div className={styles.searchTerm}>"{search.term}"</div>
            </div>
            <div className={styles.searchCount}>
              {search.count}
            </div>
          </div>
        ))}
      </div>

      {data.length > 5 && (
        <button className={styles.showMoreButton} onClick={onShowMore}>
          View All {data.length} Terms
        </button>
      )}
    </div>
  );
};

export default SearchAnalytics;
