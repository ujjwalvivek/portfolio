import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import styles from './BlogList.module.css';
import SearchBar, { searchPost } from '../../Modules/SearchBar/SearchBar';
import { useBackground } from '../../Background/BackgroundContext';
import { FaCalendarAlt, FaExpand } from "react-icons/fa";
import { MdTimer } from "react-icons/md";
import { IoMdPricetag } from "react-icons/io";
import { TbFaceIdError } from "react-icons/tb";
import { RiMarkdownFill } from "react-icons/ri";

const BlogList = () => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(8); // Start with 8 posts visible
  const [isLoading, setIsLoading] = useState(true);
  const loaderRef = useRef(null);
  const handlePostLinkHover = (filename) => fetch(`/posts/${filename}`);
  const handleSearch = (query) => setSearchQuery(query);
  const handleClearSearch = () => setSearchQuery('');
  const visiblePosts = filteredPosts.filter(p => p.filename && p.filename.trim());
  const { backgroundConfig } = useBackground();
  const noAnim = backgroundConfig.type !== 'none' ? '' : styles.noanimated;

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const metaResponse = await fetch('/posts/meta.json');
        const allPosts = await metaResponse.json();
        allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
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

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPosts(posts);
      setVisibleCount(8); // Reset to original default
    } else {
      const searchResults = posts
        .map(post => {
          const result = searchPost(searchQuery.trim(), post);
          return { ...post, searchScore: result.score, hasMatch: result.match };
        })
        .filter(post => post.hasMatch && post.searchScore > 0) // Only include actual matches
        .sort((a, b) => b.searchScore - a.searchScore); // Sort by relevance

      setFilteredPosts(searchResults);
      setVisibleCount(searchResults.length); // Show all search results
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

  useEffect(() => {
    if (searchQuery) return; // Don't lazy load when searching
    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 1, visiblePosts.length));
        }
      },
      { threshold: 1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [visiblePosts.length, searchQuery]);

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
        <div className={styles.heroSection}>
          <div className={styles.heroHeader}>
            <div className={styles.headerIcon}>
              <RiMarkdownFill size={'2.5rem'} />
            </div>
            <div className={styles.headerText}>
              <h1 className={styles.heroTitle}>Logs Directory</h1>
              <p className={styles.heroSubtitle}>experiments . thoughts . explorations</p>
            </div>
            <span className={styles.border}></span>
            <span className={styles.borderFull}></span>
          </div>
        </div>
        <SearchBar
          value={searchQuery}
          onSearch={handleSearch}
          placeholder="Search posts, tags, or content..."
          onOpenCommandPalette={() => {
            document.dispatchEvent(new KeyboardEvent('keydown', {
              key: 'k',
              ctrlKey: true,
              altKey: true,
              bubbles: true
            }));
          }}
        />
        {visiblePosts.length === 0 && searchQuery.trim() ? (
          <div className={styles.noResults}>
            <TbFaceIdError />
            <p>No matches found for <span className={styles.highlight}>{searchQuery}</span></p>
            <p>Try a different search term or browse all Logs below.</p>
            <button onClick={() => handleClearSearch()} className={styles.readMoreButtonButton}>Browse All Logs</button>
          </div>
        ) : null}
        <ul>
          {visiblePosts.slice(0, visibleCount).map((post, index) => (
            <li key={post.id + '-' + index} className={styles.blogPostItem}>
              <Link to={`/blog/${post.filename}`} className={styles.blogPostLink} onMouseEnter={() => handlePostLinkHover(post.filename)}>
                <div className={styles.postCardContent}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitle}>
                      <span className={styles.postIndex}>{String(index + 1).padStart(2, '0')}.{String(post.id).padStart(2, '0')}</span>
                      {post.title}
                    </div>
                    <div className={styles.cardStatus}>
                      <span className={styles.readMoreButton} to={`/blog/${post.filename}`}>view <FaExpand /></span>
                    </div>
                  </div>
                  <div className={styles.cardContent}>
                    <div className={`${styles.postThumbnailWrapper} ${styles.movingBorder} ${noAnim}`}>
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
                    <div className={styles.postDescription}>
                      <div className={styles.meta}>
                        <span className={styles.metaItem}>
                          <span className={styles.metaIcon}><FaCalendarAlt /></span>
                          <span className={styles.metaText}>{String(new Date(post.date).toLocaleDateString('en-GB', { year: '2-digit', month: 'numeric', day: 'numeric' }))}</span>
                        </span>
                        <span className={styles.metaItem}>
                          <span className={styles.metaIcon}><MdTimer /></span>
                          <span className={styles.metaText}>{String(post.readingTime)}</span>
                        </span>
                      </div>
                      <div className={styles.descriptionText}>{post.description}</div>
                    </div>

                  </div>
                  <div className={styles.cardTags}>
                    {post.tags.map((tag, tagIndex) => (
                      <span
                        key={tag}
                        className={`${styles.tag} ${styles[`tag-${tagIndex % 6}`]}`}
                        title={`Filter by ${tag}`}
                      >
                        <span className={styles.tagIcon}><IoMdPricetag /></span>
                        <span className={styles.tagText}>{tag}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        {/* Loader for lazy loading */}
        {!searchQuery.trim() && visibleCount < visiblePosts.length ? (
          <div ref={loaderRef} className={styles.loadingState}>
            <p>Loading more posts...</p>
          </div>
        ) : (
          <div className={styles.stats} style={{ width: '100%' }}>
            <div className={styles.tableEnd}
              data-count={posts.length}></div>
          </div>
        )}
      </div>
    </div >
  );
};

export default BlogList;
