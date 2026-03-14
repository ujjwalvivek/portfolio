import { Link } from 'react-router-dom';
import styles from './HomeNav.module.css';

const HomeNav = () => {

    return (
        <div className={styles.ctaContainer}>
            <Link to="/blog" className={styles.cta}>
                <span className={styles.linkSpan}>&lt;</span>ReadLogs<span className={styles.linkSpan}>/&gt;</span>
            </Link>
            <Link to="/about" className={styles.cta}>
                <span className={styles.linkSpan}>&lt;</span>About<span className={styles.linkSpan}>/&gt;</span>
            </Link>
            <Link to="/projects" className={styles.cta}>
                <span className={styles.linkSpan}>&lt;</span>Projects<span className={styles.linkSpan}>/&gt;</span>
            </Link>
        </div>
    );
};

export default HomeNav;