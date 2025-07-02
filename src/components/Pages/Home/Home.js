import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import styles from './Home.module.css';
import matter from 'gray-matter';

const Home = () => {
    const [latestPosts, setLatestPosts] = useState([]);
    const [showSocialLinks, setShowSocialLinks] = useState(false);

    useEffect(() => {
        const fetchPosts = async () => {
            const postFiles = ['dark-net.md', 'second-post.md', 'third-post.md', 'fourth-post.md'];
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
                        <a href="https://linkedin.com/in/your-profile" target="_blank" rel="noopener noreferrer" className={styles.cta}>
                            <span className="cta-link-span">fn(</span>LinkedIn<span className="cta-link-span">)</span>
                        </a>
                        <a href="https://x.com/your-handle" target="_blank" rel="noopener noreferrer" className={styles.cta}>
                            <span className="cta-link-span">fn(</span>X<span className="cta-link-span">(Formerly Twitter))</span>
                        </a>
                        <a href="https://github.com/your-username" target="_blank" rel="noopener noreferrer" className={styles.cta}>
                            <span className="cta-link-span">fn(</span>GitHub<span className="cta-link-span">)</span>
                        </a>
                        <button onClick={() => setShowSocialLinks(false)} className={styles.cta}>
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
                        <Link to="/projects" className={styles.cta}>
                            <span className="cta-link-span">fn(</span>Projects<span className="cta-link-span">)</span>
                        </Link>
                        <button onClick={() => setShowSocialLinks(true)} className={styles.cta}>
                            <span className="cta-link-span">fn(</span>Links<span className="cta-link-span">)</span>
                        </button>
                    </>
                )}
            </div>
            <div className={styles.latestLogs}>
                <h3>Unfinished Thoughts <span style={{ color: 'var(--primary-color)' }}>[NEW]</span></h3>
                <ul>
                    {latestPosts.map((post) => (
                        <li key={post.slug}>
                            <Link to={`/blog/${post.filename}`}>
                                <span className={styles.postDate}>
                                    [{new Date(post.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })}]
                                </span>
                                <span className={styles.postTitle}>
                                    {post.title}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Home;