import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import styles from './Home.module.css';
import matter from 'gray-matter';

const Home = () => {
    const [latestPosts, setLatestPosts] = useState([]);
    const [showSocialLinks, setShowSocialLinks] = useState(false);

    useEffect(() => {
        const fetchPosts = async () => {
            const postFiles = ['dark-net.md', 'fourth-post.md', 'third-post.md', 'comprehensive-test-post.md' ];
            const postsData = await Promise.all(
                postFiles.map(async (file) => {
                    const response = await fetch(`/posts/${file}`);
                    const text = await response.text();
                    const { data } = matter(text);
                    return {
                        slug: data.slug,
                        title: data.title,
                        date: data.date,
                        filename: file,
                    };
                })
            );
            // Sort posts by date, newest first
            postsData.sort((a, b) => new Date(b.date) - new Date(a.date));
            setLatestPosts(postsData.slice(0, 3));
        };

        fetchPosts();
    }, []);

    return (
        <div className={styles.homeContainer}>
            <h1>TECH ISN'T THE HARD PART</h1>
            <h2>Systems, Behavior, & Questions are</h2>
            <p>Welcome to my corner where I try to explore 'n build weird shit and fail at it wonderfully; Till I don't.</p>

            <div className={styles.ctaContainer}>
                {showSocialLinks ? (
                    <>
                        <a href="https://linkedin.com/in/ujjwalvivek" target="_blank" rel="noopener noreferrer" className={styles.cta}>
                            <span className="cta-link-span">fn(</span>LinkedIn<span className="cta-link-span">)</span>
                        </a>
                        <a href="https://x.com/ujjwalvivekx" target="_blank" rel="noopener noreferrer" className={styles.cta}>
                            <span className="cta-link-span">fn(</span>X<span className="cta-link-span">(Formerly Twitter))</span>
                        </a>
                        <a href="https://github.com/ujjwalvivek" target="_blank" rel="noopener noreferrer" className={styles.cta}>
                            <span className="cta-link-span">fn(</span>GitHub<span className="cta-link-span">)</span>
                        </a>
                        <button className={styles.cta} onClick={() => setShowSocialLinks(false)}>
                            <span className="cta-link-span">fn(</span>Close<span className="cta-link-span">)</span>
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/blog" className={styles.cta}>
                            <span className="cta-link-span">fn(</span>ReadLogs<span className="cta-link-span">)</span>
                        </Link>
                        <Link to="/about" className={styles.cta}>
                            <span className="cta-link-span">fn(</span>About<span className="cta-link-span">)</span>
                        </Link>
                        <Link to="/" className={styles.cta}>
                            <span className="cta-link-span">fn(</span>Projects<span className="cta-link-span">)</span>
                        </Link>
                        <button className={styles.cta} onClick={() => setShowSocialLinks(true)}>
                            <span className="cta-link-span">fn(</span>Links<span className="cta-link-span">)</span>
                        </button>
                    </>
                )}
            </div>
            <div className={styles.latestLogs}>
    <h3>Unfinished Thoughts <span style={{ color: 'var(--primary-color)' }}>[NEW]</span></h3>
    <ul>
        {latestPosts.map((post) => {
            const maxLen = 24; // Change this number to your preferred cutoff
            const shortTitle = post.title.length > maxLen
                ? post.title.slice(0, maxLen) + '...'
                : post.title;
            return (
                <li key={post.slug}>
                    <Link to={`/blog/${post.filename}`}>
                        <span className={styles.postDate}>
                            [{new Date(post.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })}]
                        </span>
                        <span className={styles.postTitle}>
                            {shortTitle}
                        </span>
                    </Link>
                </li>
            );
        })}
    </ul>
</div>
        </div>
    );
};

export default Home;