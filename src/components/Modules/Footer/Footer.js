import { useContext, useState, useEffect, useMemo } from 'react';
import styles from './Footer.module.css';
import { TiFlowSwitch } from "react-icons/ti";
import { FaCode } from "react-icons/fa6";
import { CgDarkMode } from "react-icons/cg";
import { ThemeContext } from '../../Utils/ThemeSwitcher/ThemeContext';
import { RiStackFill } from "react-icons/ri";
import BackgroundTest from '../../Utils/BackgroundTest/BackgroundTest';
import { TfiLinkedin } from "react-icons/tfi";
import { FaYCombinator } from "react-icons/fa";
import { TbBrandGithubFilled } from "react-icons/tb";
import { FaMarkdown, FaConfluence, FaJira, FaGit, FaUnity, FaNodeJs, FaCss3Alt, FaFileExcel } from 'react-icons/fa';
import { SiRust, SiWgpu, SiMixpanel, SiUnrealengine, SiLinear } from 'react-icons/si';
import { LuFigma } from 'react-icons/lu';
import { IoLogoFirebase } from 'react-icons/io5';
import { TbSql } from 'react-icons/tb';
import { IoLogoJavascript } from "react-icons/io";
import { HiDotsHorizontal } from "react-icons/hi";

const Footer = ({ showOverlay, setShowOverlay }) => {
    const { darkMode, toggleDarkMode } = useContext(ThemeContext);
    const [showTechStack, setShowTechStack] = useState(false);

    const icons = [
        { title: "Rust", icon: <SiRust size={36} opacity={0.8} /> },
        { title: "wGPU", icon: <SiWgpu size={36} opacity={0.8} /> },
        { title: "Markdown", icon: <FaMarkdown size={36} opacity={0.8} /> },
        { title: "Confluence", icon: <FaConfluence size={36} opacity={0.8} /> },
        { title: "Jira", icon: <FaJira size={36} opacity={0.8} /> },
        { title: "Mixpanel", icon: <SiMixpanel size={36} opacity={0.8} /> },
        { title: "Git", icon: <FaGit size={36} opacity={0.8} /> },
        { title: "Unity", icon: <FaUnity size={36} opacity={0.8} /> },
        { title: "Unreal Engine", icon: <SiUnrealengine size={36} opacity={0.8} /> },
        { title: "Linear", icon: <SiLinear size={36} opacity={0.8} /> },
        { title: "JavaScript", icon: <IoLogoJavascript size={36} opacity={0.8} /> },
        { title: "Figma", icon: <LuFigma size={36} opacity={0.8} /> },
        { title: "Firebase", icon: <IoLogoFirebase size={36} opacity={0.8} /> },
        { title: "SQL", icon: <TbSql size={36} opacity={0.8} /> },
        { title: "NodeJs", icon: <FaNodeJs size={36} opacity={0.8} /> },
        { title: "CSS", icon: <FaCss3Alt size={36} opacity={0.8} /> },
        { title: "Excel", icon: <FaFileExcel size={36} opacity={0.8} /> },
        { title: "Still Learning More", icon: <HiDotsHorizontal size={36} opacity={0.8} /> },
    ];

    const isMobile = useMemo(() => {
        if (typeof navigator === "undefined" || typeof window === "undefined") return false;
        const ua = navigator.userAgent;
        // iPadOS 13+ masquerades as Mac, but has touch events and a small screen
        const isIpad = (
            /iPad/.test(ua) ||
            (ua.includes("Macintosh") && ('ontouchstart' in window || navigator.maxTouchPoints > 1))
        );
        const isIphoneOrAndroid = /iPhone|iPod|Android/i.test(ua);
        return isIphoneOrAndroid || isIpad;
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setShowOverlay(false);
                setShowTechStack(false);
            }
        };
        if (showOverlay || showTechStack) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [showOverlay, showTechStack, setShowOverlay]);

    return (
        <>
            <footer className={styles.Footer}>
                {/* Left section - Source control and errors */}
                <div className={styles.statusBarLeft}>
                    <div className={`${styles.statusBarItem} ${styles.vibeIndicator}`} title={"Switch Wallpaper"} onClick={() => setShowOverlay(true)}>
                        <div className={styles.statusBarIcon}><TiFlowSwitch /></div>
                        <div className={styles.statusBarText}>vibeSwitch</div>
                    </div>
                    <div className={`${styles.statusBarItem} ${styles.vibeIndicatorVariant}`} title={darkMode ? "Switch to light mode" : "Switch to dark mode"} onClick={toggleDarkMode}>
                        <div className={styles.statusBarIcon}><CgDarkMode /></div>
                        <div className={styles.statusBarText}>
                            {!darkMode ? "darkMode⁺" : "lightMode⁺"}
                        </div>
                    </div>
                </div>
                {/* Right section - Language, encoding, position */}
                <div className={styles.statusBarRight}>
                    <div className={styles.statusBarSeparator}></div>
                    <div className={`${styles.statusBarItem} ${styles.vibeIndicator}`} onClick={() => setShowTechStack(true)} title="Tech Stack">
                        <div className={`${styles.statusBarStats} ${styles.languageMode}`}>
                            <div className={styles.statusBarIcon}><RiStackFill /></div>
                            <div className={styles.statusBarText} style={{ transform: "translateY(1px)" }}>Rust</div>
                        </div>
                    </div>
                    <div className={styles.statusBarSeparator}></div>
                    <div className={`${styles.statusBarItem} ${styles.vibeIndicatorVariant}`}>
                        <div className={styles.statusBarIcon} onClick={() => window.open("https://linkedin.com/in/ujjwalvivek", "_blank")} target="_blank" rel="noopener noreferrer">
                            <TfiLinkedin />
                        </div>
                    </div>
                    <div className={`${styles.statusBarItem} ${styles.vibeIndicatorVariant}`}>
                        <div className={styles.statusBarIcon} onClick={() => window.open("https://news.ycombinator.com/threads?id=ujjwalvivek", "_blank")} target="_blank" rel="noopener noreferrer">
                            <FaYCombinator />
                        </div>
                    </div>
                    <div className={`${styles.statusBarItem} ${styles.vibeIndicatorVariant}`}>
                        <div className={styles.statusBarIcon} onClick={() => window.open("https://github.com/ujjwalvivek", "_blank")} target="_blank" rel="noopener noreferrer">
                            <TbBrandGithubFilled />
                        </div>
                    </div>
                </div>
            </footer>
            {showOverlay && (
                <div className={styles.overlay} onClick={() => isMobile ? setShowOverlay(false) : null}>
                    <div className={styles.container} onClick={e => e.stopPropagation()}>
                        <BackgroundTest
                            onClose={() => { setShowOverlay(false); }}
                        />
                    </div>
                </div>
            )}
            {showTechStack && (
                <div className={styles.overlay} onClick={() => isMobile ? setShowTechStack(false) : null}>
                    <div className={styles.overlayContainer} onClick={e => e.stopPropagation()}>
                        <div className={styles.header}>
                            <div className={styles.searchIcon}><FaCode /></div>
                            <div className={styles.title}>Tech Stack I Don't Suck At!</div>
                            <div className={styles.shortcut} onClick={() => setShowTechStack(false)} >ESC</div>
                        </div>
                        <div className={`${styles.skillsGridIcons} ${styles.controlGroup}`}>
                            {icons.map(({ title, icon }) => (
                                <div className={styles.skillItem} title={title} key={title}>
                                    {icon}
                                </div>
                            ))}
                        </div>
                        <div className={styles.overlayFooter}>
                            <div className={styles.shortcut} onClick={() => window.open("https://github.com/ujjwalvivek", "_blank")} target="_blank" rel="noopener noreferrer">
                                GITHUB
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Footer;