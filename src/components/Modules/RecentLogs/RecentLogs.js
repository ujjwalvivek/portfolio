import { useState, useEffect } from "react";
import styles from './RecentLogs.module.css';
import { Link } from 'react-router-dom';

let latestPostsCache = null;

const RecentLogs = ({ posts }) => {
    const [latestPosts, setLatestPosts] = useState(() => {
        if (posts && posts.length) {
            return posts.slice(0, 4);
        }
        return latestPostsCache || [];
    });

    useEffect(() => {
        //? honour incoming prop updates
        if (posts && posts.length) {
            setLatestPosts(posts.slice(0, 4));
            return;
        }

        if (latestPostsCache) {
            setLatestPosts(latestPostsCache);
            return;
        }

        const fetchPosts = async () => {
            const response = await fetch('/posts/meta.json');
            const postsData = await response.json();
            postsData.sort((a, b) => new Date(b.date) - new Date(a.date));
            const slice = postsData.slice(0, 4);
            latestPostsCache = slice;
            setLatestPosts(slice);
        };

        fetchPosts();
    }, [posts]);

    return (
        <div className={styles.latestLogs}>
            <div className={styles.logsContent}>

                <ul>
                    {latestPosts.slice(0, 2).map((post, idx) => {
                        const maxLen = 50;
                        const shortTitle = post.title.length > maxLen ? post.title.slice(0, maxLen) + '...' : post.title;
                        return (
                            <li key={post.slug || post.filename || idx}>
                                <span className={styles.border_2}></span>
                                <span className={styles.border_1}></span>
                                <span className={styles.border}></span>
                                <Link to={`/blog/${post.filename}`}>
                                    <div className={styles.postHeader}>
                                        <span className={styles.postDate}>
                                            {new Date(post.date).toLocaleDateString('en-GB', { month: '2-digit', day: '2-digit', year: '2-digit' })}
                                        </span>
                                        <span className={styles.postTitle}> {shortTitle} </span>
                                    </div>

                                    {post.tags && post.tags.length > 0 && (
                                        <div className={styles.postTags}>
                                            {post.tags.map((tag, tagIndex) => (
                                                <span key={tagIndex} className={styles.tag}>
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {post.description && (
                                        <div className={styles.postDescription}>
                                            {post.description}
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