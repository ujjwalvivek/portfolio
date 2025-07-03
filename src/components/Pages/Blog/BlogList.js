import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import styles from './Blog.module.css';
import SearchBar from '../../SearchBar/SearchBar';
import { format } from 'util';

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
  const [visibleCount, setVisibleCount] = useState(8);
  const loaderRef = useRef(null);

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
            // Extract first image from markdown
            const imageMatch = content.match(/!\[[^\]]*\]\(([^)]+)\)/);
            const firstImage = imageMatch ? imageMatch[1] : null;
            // Use thumbnail if it's a non-empty string, else use first image
            let thumbnail = post.thumbnail && post.thumbnail.trim() !== '' ? post.thumbnail : firstImage;
            return { ...post, readingTime, thumbnail };
          } catch (error) {
            console.error(`Error fetching ${post.filename}:`, error);
            let thumbnail = post.thumbnail && post.thumbnail.trim() !== '' ? post.thumbnail : null;
            return { ...post, readingTime: '1 min read', thumbnail };
          }
        })
      );

      setPosts(postsWithContent);
      setFilteredPosts(postsWithContent);
    };

    fetchPosts();
  }, []);

  // Lazy loading: observe loaderRef and load more when visible
  useEffect(() => {
    if (searchQuery) return; // Don't lazy load when searching
    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 8, filteredPosts.length));
        }
      },
      { threshold: 1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [filteredPosts.length, searchQuery]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPosts(posts);
      setVisibleCount(8);
    } else {
      const filtered = posts.filter(post => {
        const searchText = `${post.title} ${post.description} ${post.tags.join(' ')}`;
        return fuzzySearch(searchQuery, searchText);
      });
      setFilteredPosts(filtered);
      setVisibleCount(filtered.length); // Show all search results at once
    }
  }, [searchQuery, posts]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  return (
    <div className={styles.blogContainer}>
      <div className={styles.blogList}>
        <div className={styles.blogHeader}>
          <h1>Code & Beyond</h1>
          <p className={styles.blogSubtitle}>
            Thoughts, tutorials, and explorations
          </p>
        </div>
        <SearchBar onSearch={handleSearch} placeholder="Search posts, tags, or content..." />

        {filteredPosts.length === 0 && searchQuery ? (
          <div className={styles.noResults}>
            <p>No posts found for "{searchQuery}"</p>
            <p>Try a different search term or browse all posts below.</p>
          </div>
        ) : null}

        <ul>
          {filteredPosts.slice(0, visibleCount).map((post, index) => (
            <li key={post.id + '-' + index} className={styles.blogPostItem}>
              <Link to={`/blog/${post.filename}`} className={styles.blogPostLink}>
                <div className={styles.postCardContent}>
                  <div className={styles.postMain}>
                    <div className={styles.postNumber}>
                      [{String(index + 1).padStart(2, '0')}.{String(post.id).padStart(2, '0')}]
                      [▢ {String(new Date(post.date).toLocaleDateString('en-GB', { year: '2-digit', month: 'numeric', day: 'numeric' }))}]
                      [⏱ {String(post.readingTime)}]
                    </div>
                    <div className={styles.postContent}>
                      <h2>{post.title}</h2>
                      <p className={styles.postDescription}>{post.description}</p>
                    </div>
                    <div className={styles.postTags}>
                      {post.tags.map((tag, tagIndex) => (
                        <span
                          key={tag}
                          className={`${styles.tag} ${styles[`tag-${tagIndex % 6}`]}`}
                          title={`Filter by ${tag}`}
                        >
                          <span className={styles.tagIcon}>◆</span>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className={styles.postThumbnailWrapper}>
                    {post.thumbnail ? (
                      <img
                        src={post.thumbnail}
                        alt={post.title + ' thumbnail'}
                        className={styles.postThumbnail}
                        loading="lazy"
                      />
                    ) : (
                      <div className={styles.postThumbnailPlaceholder} aria-label="No image available" />
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        {/* Loader for lazy loading */}
        {visibleCount < filteredPosts.length && !searchQuery && (
          <div ref={loaderRef} style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'var(--primary-color)', fontFamily: 'var(--font-mono)' }}>Loading more posts…</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogList;
