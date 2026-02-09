import { useState, useEffect } from "react";
import styles from './RecentLogs.module.css';
import { Link } from 'react-router-dom';

const RecentLogs = () => {
    // State for latest posts and toggling social links
    const [latestPosts, setLatestPosts] = useState([]);

    // Fetch posts on mount
    useEffect(() => {
        const fetchPosts = async () => {
            const response = await fetch('/posts/meta.json');
            const postsData = await response.json();
            // Sort posts by date, newest first
            postsData.sort((a, b) => new Date(b.date) - new Date(a.date));
            setLatestPosts(postsData.slice(0, 4)); // Only show 4 latest
        };

        fetchPosts();
    }, []);

    return (
        <div className={styles.latestLogs}>
            <div className={styles.logsContent}>
                <ul>
                    {latestPosts.slice(0, 2).map((post, idx) => {
                        const maxLen = 50;
                        // Truncate long titles
                        const shortTitle = post.title.length > maxLen ? post.title.slice(0, maxLen) + '...' : post.title;
                        return (
                            <li key={post.slug || post.filename || idx}>
                                <Link to={`/blog/${post.filename}`}>
                                    <div className={styles.postHeader}>
                                        <span className={styles.postDate}>
                                            {new Date(post.date).toLocaleDateString('en-GB', { month: '2-digit', day: '2-digit', year: '2-digit' })}
                                        </span>
                                        <span className={styles.postTitle}> {shortTitle} </span>
                                    </div>
                                    {post.description && (
                                        <div className={styles.postDescription}>
                                            {post.description}
                                        </div>
                                    )}

                                    {post.tags && post.tags.length > 0 && (
                                        <div className={styles.postTags}>
                                            {post.tags.map((tag, tagIndex) => (
                                                <span key={tagIndex} className={styles.tag}>
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
};

export default RecentLogs;