import React, { useState, useContext } from 'react';
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import styles from './ResumeOverlay.module.css';
import { ThemeContext } from '../../Utils/ThemeSwitcher/ThemeContext';

export default function ResumeOverlay({ open, onClose }) {
  const currentTheme = document.body.getAttribute('data-theme');
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const modalRef = React.useRef();
  const [pdfTheme, setPdfTheme] = useState(darkMode ? 'dark' : 'light');

  React.useEffect(() => {
    if (open) {
      const currentTheme = darkMode ? 'dark' : 'light';
      setPdfTheme(currentTheme);
    }
  }, [open, darkMode, currentTheme]);

  const renderToolbar = (Toolbar) => (
    <Toolbar>
      {(slots) => {
        const {
          CurrentScale,
          ZoomIn,
          ZoomOut,
        } = slots;
        return (
          <div className={styles.customToolbar}>
            <ZoomOut>
              {(props) => (<button className={styles.headerBtn} onClick={props.onClick}>-</button>)}
            </ZoomOut>
            <CurrentScale>
              {(props) => <span className={styles.headerBtn}>{`${Math.round(props.scale * 100)}%`}</span>}
            </CurrentScale>
            <ZoomIn>
              {(props) => (<button className={styles.headerBtn} onClick={props.onClick}>+</button>)}
            </ZoomIn>
          </div>
        );
      }}
    </Toolbar>
  );

  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    renderToolbar,
    sidebarTabs: (defaultTabs) => defaultTabs.filter(tab => tab.content === 'thumbnails' || tab.content === 'attachments'),
    theme: pdfTheme,
  });

  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      setPdfTheme(pdfTheme);
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, [pdfTheme]);

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
      <div
        className={`${styles.resumeOverlayModal} ${currentTheme === 'dark' ? ' pdfViewerDark' : ''}`}
        ref={modalRef}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.postHeader}>
          <div className={styles.headerButtons}>
            <div className={styles.closeButton} onClick={onClose}></div>
            <div className={styles.minimizeButton} onClick={onClose}></div>
            <div className={styles.maximizeButton}></div>
          </div>
          <div className={styles.postTitle}>
            Vivek's Resume
          </div>
          <div className={styles.headerButtons} onClick={e => { e.stopPropagation(); togglePdfTheme(); }}>
            <span className={styles.headerBtn}>switch({pdfTheme === 'light' ? 'Dark' : 'Light'})</span>
          </div>
        </div>
        <div className={styles.resumeOverlayViewer}>
          <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
            <Viewer
              theme={pdfTheme}
              plugins={[defaultLayoutPluginInstance]}
              fileUrl={pdfTheme === 'dark' ? 'https://cdn.ujjwalvivek.com/docs/resume-dark.pdf' : 'https://cdn.ujjwalvivek.com/docs/resume-light.pdf'}
              defaultScale={SpecialZoomLevel.PageWidth}
            />
          </Worker>
        </div>
      </div>
    </div>
  );
}
