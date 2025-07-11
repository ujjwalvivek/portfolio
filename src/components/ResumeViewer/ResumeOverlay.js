import React, { useState, useContext } from 'react';
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import styles from './ResumeOverlay.module.css'; 
import { ThemeContext } from '../ThemeSwitcher/ThemeContext';

export default function ResumeOverlay({ open, onClose }) {
  const currentTheme = document.body.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  const [pdfTheme, setPdfTheme] = useState('light'); // 'light' | 'dark' | 'auto'


  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    setInitialTab: 0,
    theme: currentTheme, // ⬅️ sync to site
  });

  const [theme, setTheme] = React.useState(document.body.getAttribute('data-theme') || 'light');
  const modalRef = React.useRef();

  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.body.getAttribute('data-theme') || 'light');
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const handleOverlayClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

 const togglePdfTheme = () => {
  setPdfTheme(prev => {
    const nextTheme = prev === 'light' ? 'dark' : 'light';
    // Reverse: if switching to 'dark' PDF, set site to 'light', and vice versa
    if ((nextTheme === 'dark' && !darkMode) || (nextTheme === 'light' && darkMode)) {
      toggleDarkMode();
    }
    return nextTheme;
  });
};


  if (!open) return null;

  return (
    <div className={styles.resumeOverlayRoot} onClick={handleOverlayClick}>
      <div className={styles.resumeOverlayTopRightButtons}>
        <button
          onClick={e => { e.stopPropagation(); togglePdfTheme(); }}
          className={styles.resumeOverlayThemeSwitch}
          aria-label="Switch PDF viewer theme"
        >
          switchTheme({pdfTheme === 'light' ? 'Dark' : 'Light'})
        </button>
        <button
          className={styles.resumeOverlayTopRightClose}
          onClick={onClose}
          aria-label="Close resume overlay"
        >
          close(resume)
        </button>
      </div>

      <div
        className={`${styles.resumeOverlayModal} ${theme === 'dark' ? ' pdfViewerDark' : ''}`}
        ref={modalRef}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.resumeOverlayViewer}>
          <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
            <Viewer
              theme={pdfTheme}
              plugins={[defaultLayoutPluginInstance]}
              fileUrl={pdfTheme === 'dark' ? '/resume-dark.pdf' : '/resume-light.pdf'}
              defaultScale={SpecialZoomLevel.PageWidth}
            />
          </Worker>
        </div>
      </div>
    </div>
  );
}
