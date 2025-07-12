import { Link, useLocation } from 'react-router-dom'; // Routing stuff
import ThemeSwitcher from '../ThemeSwitcher/ThemeSwitcher'; // Theme toggle button
import { useBackground } from '../Background/BackgroundContext'; // Custom bg context
import styles from './TopBar.module.css'; // Styles

// TopBar: sticky nav at the top of the site
const TopBar = () => {
  const location = useLocation();
  const { backgroundConfig, toggleBackground } = useBackground();
  const isHomePage = location.pathname === '/';

  // Figure out where the "cd .." button should go
  const getBackLink = () => {
    if (location.pathname.startsWith('/blog/')) return '/blog';
    return '/';
  };

  return (
    <div className={styles.topBar}>
      {/* Left: nav controls */}
      <div className={styles.controls}>
        {/* Only show back button if not on home */}
        {!isHomePage && (
          <Link to={getBackLink()} className={styles.backButton}>
            cd ..
          </Link>
        )}
        {/* Playground/test page */}
        <Link to="/bg-test" className={styles.testButton}>
          bg(playground)
        </Link>
        {/* Theme switcher */}
        <ThemeSwitcher />
      </div>
      {/* Right: logo/brand */}
      <div className={styles.logoSection}>
        <Link to="/" className={styles.logoLink}>U J J W A L V I V E K</Link>
        <span className={styles.bgToggleButtonContainer}>
        {/* Toggle background visuals */}
        <button
          className={`${styles.bgToggleButton} ${backgroundConfig.type !== 'none' ? styles.bgToggleButtonactive : ''}`}
          onClick={toggleBackground}
          title={`Background: ${backgroundConfig.type === 'none' ? 'Off' : backgroundConfig.type}`}
        >
          {backgroundConfig.type === 'none' ? '' : ''}
        </button>
        </span>
      </div>
    </div>
  );
};

export default TopBar;