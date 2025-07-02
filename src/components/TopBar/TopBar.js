import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import ThemeSwitcher from '../ThemeSwitcher/ThemeSwitcher';
import { useBackground } from '../Background/BackgroundContext';
import styles from './TopBar.module.css';

const TopBar = () => {
  const location = useLocation();
  const { backgroundConfig, toggleBackground } = useBackground();
  const isHomePage = location.pathname === '/';
  
  const getBackLink = () => {
    if (location.pathname.startsWith('/blog/')) {
      return '/blog';
    }
    return '/';
  };

  return (
    <div className={styles.topBar}>
      <div className={styles.controls}>
        {!isHomePage && (
          <Link to={getBackLink()} className={styles.backButton}>
            cd ..
          </Link>
        )}
        <button 
          className={styles.bgToggleButton}
          onClick={toggleBackground}
          title={`Background: ${backgroundConfig.type === 'none' ? 'Off' : backgroundConfig.type}`}
        >
          {backgroundConfig.type === 'none' ? '◇' : '◆'}
        </button>
        <ThemeSwitcher />
        <Link to="/bg-test" className={styles.testButton}>
          playground
        </Link>
      </div>
      <div className={styles.logoSection}>
        <Link to="/" className={styles.logoLink}>U J J W A L . V I V E K</Link>
      </div>
    </div>
  );
};

export default TopBar;
