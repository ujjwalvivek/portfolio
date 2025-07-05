import { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import styles from './Home.module.css';

const Home = () => {
    // State for latest posts and toggling social links
    const [latestPosts, setLatestPosts] = useState([]);
    const [showSocialLinks, setShowSocialLinks] = useState(false);

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
        <div className={styles.homeContainer}>
            {/* Main glitchy heading */}
            <h1 className={styles.glitch + ' ' + styles.shadowPulse + ' ' + styles.neonFlicker} data-text="TECH ISN'T THE HARD PART">
                TECH ISN'T THE HARD PART
            </h1>
            {/* Subheading */}
            <h2 className={styles.glitch + ' ' + styles.shadowPulse + ' ' + styles.neonFlicker} data-text="SYSTEMS, BEHAVIOUR, & QUESTIONS ARE">
                SYSTEMS, BEHAVIOUR, & QUESTIONS ARE
            </h2>
            {/* Intro blockquote */}
            <p className={styles.blockquoteIntro}>
                Welcome to my corner where I try to explore & build weird shit and fail at it wonderfully; Till I don't.
            </p>
            {/* CTA buttons */}
            <div className={styles.ctaContainer}>
                {showSocialLinks ? (
                    <>
                        {/* Social links */}
                        <a href="https://linkedin.com/in/ujjwalvivek" target="_blank" rel="noopener noreferrer" className={styles.cta}>
                            <span className="cta-link-span">fn(</span>LinkedIn<span className="cta-link-span">)</span>
                        </a>
                        <a href="https://x.com/ujjwalvivekx" target="_blank" rel="noopener noreferrer" className={styles.cta}>
                            <span className="cta-link-span">fn(</span>X<span className="cta-link-span">)</span>
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
                        {/* Main navigation CTAs */}
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
            {/* Latest blog posts */}
            <div className={styles.latestLogs}>
                <h3>
                    Unfinished Thoughts <span style={{ color: 'var(--primary-color)' }}>[NEW]</span>
                </h3>
                <ul>
                    {latestPosts.map((post) => {
                        const maxLen = 30;
                        // Truncate long titles
                        const shortTitle = post.title.length > maxLen ? post.title.slice(0, maxLen) + '...' : post.title; 
                        return (
                            <li key={post.slug}>
                                <Link to={`/blog/${post.filename}`}>
                                    <span className={styles.postDate}>
                                        [{new Date(post.date).toLocaleDateString('en-GB', { month: '2-digit', day: '2-digit' })}]
                                    </span>
                                    <span className={styles.postTitle}> {shortTitle} </span>
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