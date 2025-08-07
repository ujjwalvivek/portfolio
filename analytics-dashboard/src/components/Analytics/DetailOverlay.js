import React from 'react';
import styles from './DetailOverlay.module.css';

const DetailOverlay = ({ type, data, onClose }) => {
  const getOverlayContent = () => {
    switch (type) {
      case 'search':
        return {
          title: 'Search Analytics',
          subtitle: 'Detailed search query statistics',
          items: data?.topSearchTerms || [],
          renderItem: (item, index) => (
            <div key={item.term} className={styles.overlayItem}>
              <span className={styles.rank}>{String(index + 1).padStart(2, '0')}</span>
              <div className={styles.itemContent}>
                <div className={styles.itemTitle}>"{item.term}"</div>
                <div className={styles.itemMeta}>{item.count} searches</div>
              </div>
              <div className={styles.itemValue}>{item.count}</div>
            </div>
          )
        };
      
      case 'pages':
        return {
          title: 'Top Pages',
          subtitle: 'Most visited pages on your site',
          items: data?.topPages || [],
          renderItem: (item, index) => (
            <div key={item.path} className={styles.overlayItem}>
              <span className={styles.rank}>{String(index + 1).padStart(2, '0')}</span>
              <div className={styles.itemContent}>
                <div className={styles.itemTitle}>{item.path}</div>
                <div className={styles.itemMeta}>{item.title}</div>
              </div>
              <div className={styles.itemValue}>{item.views}</div>
            </div>
          )
        };
      
      case 'blog':
        return {
          title: 'Blog Performance',
          items: data?.blogPerformance || [],
          renderItem: (item, index) => (
            <div key={item.postId} className={styles.overlayItem}>
              <div className={styles.itemContent}>
                <div className={styles.itemTitle}>{item.title}</div>
                <div className={styles.itemMeta}>
                  <span className={styles.rank}>{item.views} views</span>
                  <span className={styles.rank}>{item.likes} likes</span>
                  <span className={styles.rank}>{item.shares} shares</span>
                </div>
              </div>
              <div className={styles.itemValue}>{item.views}</div>
            </div>
          )
        };
      
      case 'traffic':
        return {
          title: 'Traffic Sources',
          subtitle: 'Where your visitors are coming from',
          items: data?.trafficSources || [],
          renderItem: (item, index) => (
            <div key={item.source} className={styles.overlayItem}>
              <span className={styles.rank}>{String(index + 1).padStart(2, '0')}</span>
              <div className={styles.itemContent}>
                <div className={styles.itemTitle}>{item.source}</div>
                <div className={styles.itemMeta}>{item.percentage}% of total traffic</div>
              </div>
              <div className={styles.itemValue}>{item.visits}</div>
            </div>
          )
        };
      
      default:
        return {
          title: 'Data Overview',
          subtitle: 'Detailed analytics information',
          items: [],
          renderItem: () => null
        };
    }
  };

  const overlayContent = getOverlayContent();

  return (
    <div className={styles.overlayBackdrop} onClick={onClose}>
      <div className={styles.overlayContainer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.overlayHeader}>
          <div className={styles.headerContent}>
            <h2 className={styles.overlayTitle}>{overlayContent.title}</h2>
            
          </div>
          <button 
            className={styles.footerButton}
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className={styles.overlayBody}>
          {overlayContent.items.length > 0 ? (
            <div className={styles.itemsList}>
              {overlayContent.items.map((item, index) => 
                overlayContent.renderItem(item, index)
              )}
            </div>
          ) : (
            <div className={styles.noData}>
              <span className={styles.noDataIcon}>📊</span>
              <h3>No data available</h3>
              <p>There's no data to display for this section yet.</p>
            </div>
          )}
        </div>
        <div style={{ textAlign: 'center', paddingBottom: '1rem'}}>
          <p className={styles.overlaySubtitle}>Total items: {overlayContent.items.length}</p>
        </div>
      </div>
    </div>
  );
};

export default DetailOverlay;
