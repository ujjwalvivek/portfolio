/**
 * ████████╗ ██████╗ ██████╗     ██████╗  █████╗ ██████╗ 
 * ╚══██╔══╝██╔═══██╗██╔══██╗    ██╔══██╗██╔══██╗██╔══██╗
 *    ██║   ██║   ██║██████╔╝    ██████╔╝███████║██████╔╝
 *    ██║   ██║   ██║██╔═══╝     ██╔══██╗██╔══██║██╔══██╗
 *    ██║   ╚██████╔╝██║         ██████╔╝██║  ██║██║  ██║
 *    ╚═╝    ╚═════╝ ╚═╝         ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝
 *                                                       
 */

import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useBackground } from '../../Background/BackgroundContext'; // Custom bg context
import styles from './TopBar.module.css'; // Styles
import { RxTriangleRight } from "react-icons/rx";

const TopBar = () => {
  const location = useLocation();
  const { backgroundConfig, toggleBackground } = useBackground();
  const isHomePage = location.pathname === '/';
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /**============================================
   *   Shorten labels on small screens
   *=============================================**/
  const maxLen = viewportWidth <= 300 ? 4 : 11;

  return (
    <div className={styles.topBar}>
      <div className={styles.controls}>
        <span className={styles.bgToggleButtonContainer}>
          <button
            className={`${styles.bgToggleButton} ${backgroundConfig.type !== 'none' ? styles.bgToggleButtonactive : ''}`}
            onClick={toggleBackground}
            title={`Background: ${backgroundConfig.type === 'none' ? 'Off' : backgroundConfig.type}`}
          >
            {backgroundConfig.type === 'none' ? '' : ''}
          </button>
        </span>
        {/* Breadcrumb Navigation */}
        {!isHomePage && (
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link to="/" className={styles.breadcrumbLink} title="Home">Home</Link>
            {/* Dynamic Breadcrumbs */}
            {location.pathname
              .split('/')
              .filter(Boolean)
              .map((segment, i, arr) => {
                const path = '/' + arr.slice(0, i + 1).join('/');
                const label = decodeURIComponent(segment).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                const shortLabel = label.length > maxLen ? label.slice(0, maxLen - 3) + '…' : label;
                const isLast = i === arr.length - 1;
                return (
                  <span key={path} className={styles.breadcrumbItem}>
                    <span className={styles.breadcrumbSep}><RxTriangleRight /></span>
                    {isLast ? (
                      <span className={styles.breadcrumbCurrent} title={label}>{shortLabel}</span>
                    ) : (
                      <Link to={path} className={styles.breadcrumbLink} title={label}>{shortLabel}</Link>
                    )}
                  </span>
                );
              })}
          </nav>
        )}
      </div>
      {/* Logo Section */}
      <div className={styles.logoSection}>
        <Link to="/" className={styles.logoLink} title="Ujjwal Vivek">
          {viewportWidth <= 480 ? (
            <span aria-hidden="true">U V</span>
          ) : (
            <span aria-hidden="true">U J J W A L V I V E K</span>
          )}
        </Link>
      </div>
    </div>
  );
};

export default TopBar;