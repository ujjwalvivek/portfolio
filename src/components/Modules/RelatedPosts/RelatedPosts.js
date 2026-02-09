import React from 'react';
import { Link } from 'react-router-dom';
import styles from './RelatedPosts.module.css';

const RelatedPosts = ({ posts }) => {
  if (!posts || posts.length === 0) {
    return null;
  }

  // Only show up to 2 posts
  const limitedPosts = posts.slice(0, 2);

  return (
    <>
      <h3 className={styles.relatedPostsTitle}>You might also like these</h3>
      <div className={styles.relatedPostsContainer}>
        {limitedPosts.map(post => (
          <Link to={`/blog/${post.filename}`} key={post.id} className={styles.relatedPostCard}>
            <h4>{post.title}</h4>
            <p>{post.description}</p>
          </Link>
        ))}
      </div>
    </>
  );
};

export default RelatedPosts;
