import { useState, useEffect, useRef } from 'react';
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

const BlogList = () => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(8);
    const [isLoading, setIsLoading] = useState(true);
  // Ref for the loader element to observe for lazy loading
  const loaderRef = useRef(null);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
      // Fetch posts metadata
      const metaResponse = await fetch('/posts/meta.json');
      const allPosts = await metaResponse.json();

      // Sort posts by date (newest first)
      allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Set initial posts and filtered posts
      setPosts(allPosts);
      setFilteredPosts(allPosts);
    } catch (error) {
        console.error('Error fetching post:', error);
      } finally {
        setIsLoading(false);
      }
    };  
    fetchPosts();
  }, []);

  // Lazy loading: observe loaderRef and load more when visible
  useEffect(() => {
    if (searchQuery) return; // Don't lazy load when searching
    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 1, filteredPosts.length));
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

    useEffect(() => {
  if (posts.length > 0) {
    posts.forEach(post => {
      if (post.filename) {
        fetch(`/posts/${post.filename}`);
      }
    });
  }
}, [posts]);

const handlePostLinkHover = (filename) => {
  fetch(`/posts/${filename}`);
};

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

     // Show loading state
  if (isLoading) {
    return (
      <div>
        <div>
            <h1>Loading...</h1>
          </div>
      </div>
    );
  }

  return (
    <div className={styles.blogContainer}>
      <div className={styles.blogList}>
        <div className={styles.blogHeader}>
          <h1 className={styles.blogTitle}>Code & Beyond</h1>
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
              <Link to={`/blog/${post.filename}`} className={styles.blogPostLink} onMouseEnter={() => handlePostLinkHover(post.filename)}>
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
