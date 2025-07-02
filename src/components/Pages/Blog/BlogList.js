import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Blog.module.css';
import SearchBar from '../../SearchBar/SearchBar';

// Simple fuzzy search function
const fuzzySearch = (query, text) => {
  if (!query) return true;
  
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  
  // Exact match gets highest priority
  if (textLower.includes(queryLower)) return true;
  
  // Fuzzy match - check if all characters in query appear in order
  let queryIndex = 0;
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++;
    }
  }
  return queryIndex === queryLower.length;
};

const calculateReadingTime = (text) => {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
};

const BlogList = () => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      // Fetch posts metadata
      const metaResponse = await fetch('/posts/meta.json');
      const allPosts = await metaResponse.json();

      // Fetch content for reading time calculation
      const postsWithContent = await Promise.all(
        allPosts.map(async (post) => {
          try {
            const response = await fetch(`/posts/${post.filename}`);
            const content = await response.text();
            const readingTime = calculateReadingTime(content);
            return { ...post, readingTime };
          } catch (error) {
            console.error(`Error fetching ${post.filename}:`, error);
            return { ...post, readingTime: '1 min read' };
          }
        })
      );

      setPosts(postsWithContent);
      setFilteredPosts(postsWithContent);
    };

    fetchPosts();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPosts(posts);
    } else {
      const filtered = posts.filter(post => {
        const searchText = `${post.title} ${post.description} ${post.tags.join(' ')}`;
        return fuzzySearch(searchQuery, searchText);
      });
      setFilteredPosts(filtered);
    }
  }, [searchQuery, posts]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  return (
    <div className={styles.blogContainer}>
      <div className={styles.blogList}>
        <h1>Blog</h1>
        <SearchBar onSearch={handleSearch} placeholder="Search posts, tags, or content..." />
        
        {filteredPosts.length === 0 && searchQuery ? (
          <div className={styles.noResults}>
            <p>No posts found for "{searchQuery}"</p>
            <p>Try a different search term or browse all posts below.</p>
          </div>
        ) : null}
        
        <ul>
          {filteredPosts.map((post, index) => (
            <li key={post.id} className={styles.blogPostItem}>
              <Link to={`/blog/${post.filename}`} className={styles.blogPostLink}>
                <div className={styles.postNumber}>
                  [{String(index + 1).padStart(2, '0')}.{String(post.id).padStart(2, '0')}]
                </div>
                <div className={styles.postContent}>
                  <h2>{post.title}</h2>
                  <p className={styles.postDescription}>{post.description}</p>
                  <div className={styles.postMeta}>
                    <span className={styles.postDate}>
                      {new Date(post.date).toLocaleDateString()}
                    </span>
                    <span className={styles.readingTime}>{post.readingTime}</span>
                    <div className={styles.postTags}>
                      {post.tags.map(tag => (
                        <span key={tag} className={styles.tag}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default BlogList;
