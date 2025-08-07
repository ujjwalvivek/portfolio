import React from 'react';
import styles from './TopPages.module.css';

const TopPages = ({ data, onShowMore }) => {
  if (!data || data.length === 0) {
    return (
      <div className={styles.noData}>
        <span className={styles.noDataIcon}>📄</span>
        <p>No page data available</p>
      </div>
    );
  }

  // Show top 8 pages, with option to show more
  const displayData = data.slice(0, 6);

  return (
    <div className={styles.container}>
      <div className={styles.pagesList}>
        {displayData.map((page, index) => (
          <div key={page.path} className={styles.pageItem}>
            <div className={styles.rank}>
              {/* {String(index + 1).padStart(2, '0')} */}
              {page.path}
            </div>
            <div className={styles.pageInfo}>
              <div className={styles.pageTitle} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{page.title}</div>
            </div>
            <div className={styles.pageViews}>
              {page.views.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
      
      {data.length > 3 && (
        <button className={styles.showMoreButton} onClick={onShowMore}>
          View All {data.length} Pages
        </button>
      )}
    </div>
  );
};

export default TopPages;
