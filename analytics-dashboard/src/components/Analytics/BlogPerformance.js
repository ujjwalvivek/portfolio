import React from 'react';
import styles from './BlogPerformance.module.css';

const BlogPerformance = ({ data, totalViews, totalLikes, totalShares, onShowMore }) => {
  if (!data || data.length === 0) {
    return (
      <div className={styles.noData}>
        <span className={styles.noDataIcon}>📝</span>
        <p>No blog data available</p>
      </div>
    );
  }

  const displayData = data.slice(0, 3);

  return (
    <div className={styles.container}>
      <div className={styles.blogTotals}>
        <div className={styles.totalMetric}>
          <div className={styles.totalValue}>{totalViews.toLocaleString()}</div>
          <div className={styles.totalLabel}>Views</div>
        </div>
        <div className={styles.totalMetric}>
          <div className={styles.totalValue}>{totalLikes.toLocaleString()}</div>
          <div className={styles.totalLabel}>Likes</div>
        </div>
        <div className={styles.totalMetric}>
          <div className={styles.totalValue}>{totalShares.toLocaleString()}</div>
          <div className={styles.totalLabel}>Shares</div>
        </div>
      </div>

      <div className={styles.blogList}>
        {displayData.map((post, index) => (
          <div key={post.postId || post.title} className={styles.blogPost}>
            <div className={styles.postInfo}>
              <h4 className={styles.postTitle}>{post.title}</h4>
              <div className={styles.postMetrics}>
                <span className={styles.rank}>{post.views} views</span>
                <span className={styles.rank}>{post.likes} likes</span>
                <span className={styles.rank}>{post.shares} shares</span>
              </div>
            </div>
            <div className={styles.postScore}>
              {post.views}
            </div>
          </div>
        ))}
      </div>

      {data.length > 3 && (
        <button className={styles.showMoreButton} onClick={onShowMore}>
          View All {data.length} Posts
        </button>
      )}
    </div>
  );
};

export default BlogPerformance;
