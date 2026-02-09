import React, { useEffect, useRef } from 'react';
import styles from './ResumeBar.module.css';
import ResumeOverlay from '../../Modules/ResumeViewer/ResumeOverlay';
import ArrowPointer from '../ArrowPointer/ArrowPointer';
import { ThemeContext } from '../../Utils/ThemeSwitcher/ThemeContext';
import { FaFileDownload, FaExpand } from "react-icons/fa";

const ResumeBar = () => {
    const [resumeOpen, setResumeOpen] = React.useState(false);
    const [showArrow, setShowArrow] = React.useState(false);
    const [isHoveringThumbnail, setIsHoveringThumbnail] = React.useState(false);
    const { darkMode } = React.useContext(ThemeContext);
    const pdfTheme = darkMode ? 'dark' : 'light';
    const downloadBtnRef = useRef(null);
    const resumeBarRef = useRef(null);

    // Arrow visibility based on resumeBar hover
    useEffect(() => {
        const resumeBarElement = resumeBarRef.current;
        if (!resumeBarElement) return;

        const handleMouseEnter = () => {
            setShowArrow(true);
        };

        const handleMouseLeave = () => {
            setShowArrow(false);
        };

        resumeBarElement.addEventListener('mouseenter', handleMouseEnter);
        resumeBarElement.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            resumeBarElement.removeEventListener('mouseenter', handleMouseEnter);
            resumeBarElement.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    const downloadResume = async (url, filename = 'UjjwalVivek_Resume.pdf') => {
        try {
            const res = await fetch(url, { mode: 'cors' });
            if (!res.ok) throw new Error('Network response not ok');
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(blobUrl);
        } catch (err) {
            window.open(url, '_blank', 'noopener');
        }
    };

    return (
        <>
            <ResumeOverlay open={resumeOpen} onClose={() => setResumeOpen(false)} />
            <ArrowPointer targetRef={downloadBtnRef} isActive={showArrow && !isHoveringThumbnail} />
            <section ref={resumeBarRef} className={styles.resumeBar}>
                <div
                    className={styles.resumeThumbnail}
                    onClick={() => setResumeOpen(true)}
                    onMouseEnter={() => setIsHoveringThumbnail(true)}
                    onMouseLeave={() => setIsHoveringThumbnail(false)}
                >
                    {darkMode ? (
                        <img src="https://cdn.ujjwalvivek.com/docs/thumbnail-dark.jpg" alt="View Resume" />
                    ) : (
                        <img src="https://cdn.ujjwalvivek.com/docs/thumbnail-light.jpg" alt="View Resume" />
                    )}
                    <div className={styles.thumbOverlay} aria-hidden="true">
                        <FaExpand className={styles.thumbIcon} />
                    </div>
                </div>
                <div className={styles.resumeTitle}>
                    <span className={styles.resumeTextStrong}>View</span>
                    <span className={styles.resumeTextSubtitle}>my Resume</span>
                </div>
                <a
                    ref={downloadBtnRef}
                    href={pdfTheme === 'dark' ? 'https://cdn.ujjwalvivek.com/docs/resume-dark.pdf' : 'https://cdn.ujjwalvivek.com/docs/resume-light.pdf'}
                    onClick={(e) => {
                        e.preventDefault();
                        const url = pdfTheme === 'dark'
                            ? 'https://cdn.ujjwalvivek.com/docs/resume-dark.pdf'
                            : 'https://cdn.ujjwalvivek.com/docs/resume-light.pdf';
                        downloadResume(url);
                    }}
                    className={styles.resumeDownloadBtn}
                    aria-label="Download resume"
                >
                    <FaFileDownload />
                    <span>Download</span>
                </a>
            </section>
        </>
    );
};

export default ResumeBar;
