import React from 'react';
import { Link } from 'react-router-dom';
import styles from './RelatedPosts.module.css';

const RelatedPosts = ({ posts }) => {
  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <div className={styles.relatedPostsContainer}>
      <h3 className={styles.relatedPostsTitle}>You might also like...</h3>
      <div className={styles.relatedPostsGrid}>
        {posts.map(post => (
          <Link to={`/blog/${post.filename}`} key={post.id} className={styles.relatedPostCard}>
            <h4>{post.title}</h4>
            <p>{post.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RelatedPosts;
