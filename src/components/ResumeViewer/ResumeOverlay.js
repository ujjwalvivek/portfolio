import React, { useState, useContext } from 'react';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import styles from './ResumeOverlay.module.css';
import { ThemeContext } from '../ThemeSwitcher/ThemeContext';

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
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              gap: '0.5rem',
              padding: '0rem 0.5rem',
            }}
          >
            <div style={{ padding: '0px 2px' }}>
              <ZoomOut>
                {(props) => (
                  <button
                    style={{
                      backdropFilter: 'blur(16px) Saturate(180%)',
                      border: '2px solid var(--primary-color)',
                      borderRadius: '2px',
                      color: 'var(--text-color)',
                      cursor: 'pointer',
                      padding: '5px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: '400',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '30px',
                      background: 'none',
                    }}
                    onClick={props.onClick}
                  >
                    Zoom Out
                  </button>
                )}
              </ZoomOut>
            </div>
            <div
              style={{
                padding: '0px 2px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--background-color)',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '50px',
                height: '30px',
                backgroundColor: 'var(--primary-color)',
                borderRadius: '2px',
                backdropFilter: 'blur(8px)',
                border: '2px solid var(--text-color)',
                margin: '0 2px',
                textAlign: 'center',
                fontWeight: '500',
              }}>
              <CurrentScale>{(props) => <span>{`${Math.round(props.scale * 100)}%`}</span>}</CurrentScale>
            </div>
            <div style={{ padding: '0px 2px' }}>
              <ZoomIn>
                {(props) => (
                  <button
                    style={{
                      backdropFilter: 'blur(16px) Saturate(180%)',
                      border: '2px solid var(--primary-color)',
                      borderRadius: '2px',
                      color: 'var(--text-color)',
                      cursor: 'pointer',
                      padding: '5px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: '400',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '30px',
                      background: 'none',
                    }}
                    onClick={props.onClick}
                  >
                    Zoom In
                  </button>
                )}
              </ZoomIn>
            </div>
          </div>
        );
      }}
    </Toolbar>
  );

  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    renderToolbar,
    sidebarTabs: (defaultTabs) => [],
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
        className={`${styles.resumeOverlayModal} ${currentTheme === 'dark' ? ' pdfViewerDark' : ''}`}
        ref={modalRef}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.resumeOverlayViewer}>
          <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
            <Viewer
              theme={pdfTheme}
              plugins={[defaultLayoutPluginInstance]}
              fileUrl={pdfTheme === 'dark' ? 'https://cdn.ujjwalvivek.com/docs/resume-dark.pdf' : 'https://cdn.ujjwalvivek.com/docs/resume-light.pdf'}
              defaultScale={1.2}
            />
          </Worker>
        </div>
      </div>
    </div>
  );
}
