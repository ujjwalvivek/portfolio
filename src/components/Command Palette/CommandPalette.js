// src/components/CommandPalette/CommandPalette.js
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBackground } from '../Background/BackgroundContext';
import { useContext } from 'react';
import { ThemeContext } from '../ThemeSwitcher/ThemeContext';  // ✅ Fixed import
import styles from './CommandPalette.module.css';
import CrashOverlay from "../SystemError/CrashOverlay";
import { FiCommand } from "react-icons/fi";
import { TbSwitch2, TbError404 } from "react-icons/tb";
import { GiThunderSkull, GiEasterEgg } from "react-icons/gi";
import { MdLightMode, MdDarkMode, MdQuestionMark, MdTableRows, MdFiberNew  } from "react-icons/md";
import { RiHome3Fill, RiMailSendFill } from "react-icons/ri";
import { IoGameController } from "react-icons/io5";
import { LuBinary, LuPartyPopper } from "react-icons/lu";
import { FaDev } from "react-icons/fa";
import { ImTerminal, ImTextColor } from "react-icons/im";



const CommandPalette = ({ isOpen, onClose, onOpenAscii, onOpenGithub, onOpenDevTools }) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const navigate = useNavigate();
    const { toggleBackground } = useBackground();
    const [crashed, setCrashed] = useState(false);


    // ✅ FIXED: Use useContext instead of calling ThemeProvider as function
    const { darkMode, toggleDarkMode } = useContext(ThemeContext);

    // Define all available commands
    const commands = [
        {
            id: 'background-vibe',
            title: 'Switch Vibe',
            description: 'Set psychedelic wallpaper',
            icon: <TbSwitch2 />,
            keywords: ['psychedelic', 'colorful', 'rainbow', 'wallpaper'],
            action: () => navigate('/bg-test')
        },
        {
            id: 'theme-switch',
            title: 'Switch Theme',
            description: `Switch to ${darkMode ? 'light' : 'dark'} mode`,
            icon: darkMode ? <MdLightMode /> : <MdDarkMode />,
            keywords: ['theme', 'dark', 'light', 'mode', 'switch'],
            action: () => toggleDarkMode()
        },
        {
            id: 'toggle-fun',
            title: 'Maximum Fun ? Minimum Fun',
            description: 'Show/hide background wallpaper',
            icon: <GiThunderSkull />,
            keywords: ['background', 'wallpaper', 'toggle', 'hide', 'show'],
            action: () => toggleBackground()
        },
        {
            id: 'easter-egg',
            title: 'Easter Egg',
            description: 'Navigate to secret terminal',
            icon: <GiEasterEgg />,
            keywords: ['easter', 'egg', 'secret', 'terminal', 'hidden'],
            action: () => {
                navigate('/about');
                setTimeout(() => {
                    const easterElement = document.querySelector('[class*="easterEgg"]');
                    if (easterElement) {
                        easterElement.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 100);
            }
        },
        {
            id: 'system-crash',
            title: 'Run Exit',
            description: 'Trigger system crash overlay',
            icon: <TbError404 />,
            keywords: ['exit', 'crash', 'system', 'error', 'blue', 'screen'],
            action: () => {
                setCrashed(true);
            }
        },
        {
            id: 'go-home',
            title: 'Go Home',
            description: 'Navigate to homepage',
            icon: <RiHome3Fill />,
            keywords: ['home', 'main', 'index', 'landing'],
            action: () => navigate('/')
        },
        {
            id: 'go-about',
            title: 'About Page',
            description: 'Navigate to about page',
            icon: <MdQuestionMark />,
            keywords: ['about', 'profile', 'bio', 'info'],
            action: () => navigate('/about')
        },
        {
            id: 'go-projects',
            title: 'View Projects',
            description: 'Navigate to projects page',
            icon: <MdTableRows />,
            keywords: ['projects', 'work', 'portfolio', 'code'],
            action: () => navigate('/projects')
        },
        {
            id: 'go-posts',
            title: 'Recent Posts',
            description: 'Navigate to blog posts',
            icon: <MdFiberNew />,
            keywords: ['posts', 'blog', 'articles', 'logs'],
            action: () => navigate('/blog')
        },
        {
            id: 'send-mail',
            title: 'Send Mail',
            description: 'Open terminal mail composer',
            icon: <RiMailSendFill />,
            keywords: ['mail', 'email', 'message', 'contact', 'send'],
            action: () => {
                navigate('/');
                setTimeout(() => {
                    const terminalElement = document.querySelector('[class*="terminalMailComponent"]');
                    if (terminalElement) {
                        terminalElement.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 100);
            }
        },
        {
            id: 'konami-code',
            title: 'Konami Code',
            description: 'Activate secret sequence',
            icon: <IoGameController />,
            keywords: ['konami', 'cheat', 'code', 'secret', 'game'],
            action: () => {
                document.body.classList.add('konami-activated');
                setTimeout(() => document.body.classList.remove('konami-activated'), 3000);
            }
        },
        {
            id: 'matrix-rain',
            title: 'Matrix Rain',
            description: 'Activate falling code rain effect',
            icon: <LuBinary />,
            keywords: ['matrix', 'rain', 'code', 'effect', 'green'],
            action: () => {
                createMatrixRain();
            }
        },
        {
            id: 'disco-mode',
            title: 'Disco Mode',
            description: 'Party time with flashing colors!',
            icon: <LuPartyPopper />,
            keywords: ['disco', 'party', 'colors', 'flash', 'dance'],
            action: () => {
                startDiscoMode();
            }
        },
        {
            id: 'dev-mode',
            title: 'Developer Mode',
            description: 'Show debug info and grid overlay',
            icon: <FaDev />,
            keywords: ['dev', 'debug', 'grid', 'developer', 'mode'],
            action: () => {
                onOpenDevTools();
            }
        },
        {
            id: 'virtual-terminal',
            title: 'GitHub Terminal Explorer',
            description: 'Browse GitHub repo and edit files with VS Code.dev integration',
            icon: <ImTerminal />,
            keywords: ['terminal', 'github', 'vscode', 'editor', 'filesystem'],
            action: () => {
                onOpenGithub();
            }
        },
        {
            id: '3d-ascii-art',
            title: '3D ASCII Art Generator',
            description: 'Convert text to stunning 3D ASCII art with animations',
            icon: <ImTextColor />,
            keywords: ['ascii', 'art', '3d', 'text', 'generator', 'animation'],
            action: () => {
                onOpenAscii();
            }
        }
    ];

    // Filter commands based on query
    const filteredCommands = commands.filter(command => {
        if (!query) return true;
        const searchTerms = query.toLowerCase().split(' ');
        return searchTerms.every(term =>
            command.title.toLowerCase().includes(term) ||
            command.description.toLowerCase().includes(term) ||
            command.keywords.some(keyword => keyword.includes(term))
        );
    });

    const startDiscoMode = () => {
        const disco = document.createElement('div');
        disco.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 9998;
    animation: discoColors 0.2s infinite;
  `;

        const style = document.createElement('style');
        style.textContent = `
    @keyframes discoColors {
      0% { background: rgba(255, 0, 0, 0.3); }
      14% { background: rgba(255, 127, 0, 0.3); }
      28% { background: rgba(255, 255, 0, 0.3); }
      42% { background: rgba(0, 255, 0, 0.3); }
      56% { background: rgba(0, 0, 255, 0.3); }
      70% { background: rgba(75, 0, 130, 0.3); }
      84% { background: rgba(148, 0, 211, 0.3); }
      100% { background: rgba(255, 0, 0, 0.3); }
    }
  `;

        document.head.appendChild(style);
        document.body.appendChild(disco);

        setTimeout(() => {
            disco.remove();
            style.remove();
        }, 3000);
    };

    const createMatrixRain = () => {
        const canvas = document.createElement('canvas');
        canvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 9997;
  `;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const ctx = canvas.getContext('2d');
        const matrix = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%+-/~{[|`]}";
        const matrixArray = matrix.split("");

        const font_size = 10;
        const columns = canvas.width / font_size;
        const drops = [];

        for (let x = 0; x < columns; x++) {
            drops[x] = 1;
        }

        document.body.appendChild(canvas);

        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#0F0';
            ctx.font = font_size + 'px arial';

            for (let i = 0; i < drops.length; i++) {
                const text = matrixArray[Math.floor(Math.random() * matrixArray.length)];
                ctx.fillText(text, i * font_size, drops[i] * font_size);

                if (drops[i] * font_size > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };

        const interval = setInterval(draw, 35);

        setTimeout(() => {
            clearInterval(interval);
            canvas.remove();
        }, 5000);
    };

    const resultsRef = useRef(null);
    const scrollToSelectedItem = (index) => {
        if (!resultsRef.current) return;

        const selectedElement = resultsRef.current.children[index];
        if (!selectedElement) return;

        const container = resultsRef.current;
        const containerRect = container.getBoundingClientRect();
        const elementRect = selectedElement.getBoundingClientRect();

        // Check if element is above the visible area
        if (elementRect.top < containerRect.top) {
            selectedElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
                inline: 'nearest'
            });
        }
        // Check if element is below the visible area
        else if (elementRect.bottom > containerRect.bottom) {
            selectedElement.scrollIntoView({
                behavior: 'smooth',
                block: 'end',
                inline: 'nearest'
            });
        }
    };

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(prev => {
                        const newIndex = prev < filteredCommands.length - 1 ? prev + 1 : 0;
                        // ✅ FIXED: Auto-scroll to keep selected item visible
                        setTimeout(() => scrollToSelectedItem(newIndex), 0);
                        return newIndex;
                    });
                    break;

                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(prev => {
                        const newIndex = prev > 0 ? prev - 1 : filteredCommands.length - 1;
                        // ✅ FIXED: Auto-scroll to keep selected item visible
                        setTimeout(() => scrollToSelectedItem(newIndex), 0);
                        return newIndex;
                    });
                    break;

                case 'Enter':
                    e.preventDefault();
                    if (filteredCommands[selectedIndex]) {
                        filteredCommands[selectedIndex].action();
                        onClose();
                    }
                    break;

                case 'Escape':
                    e.preventDefault();
                    onClose();
                    break;
                default:
                    // Do nothing for other keys
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, selectedIndex, filteredCommands, onClose]);

    // Reset state when opened
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Reset selected index when query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    if (crashed) {
        return <CrashOverlay onRestart={() => window.location.reload()} />;
    }

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} >
            <div className={styles.container} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.searchIcon}><FiCommand /></div>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setSelectedIndex(0);
                        }}
                        placeholder="Type a command..."
                        className={styles.input}
                    />
                    <div className={styles.shortcut}>ESC</div>
                </div>

                <div className={styles.results} ref={resultsRef}>
                    {filteredCommands.length === 0 ? (
                        <div className={styles.noResults}>
                            <div className={styles.noResultsIcon}>🔍</div>
                            <div className={styles.noResultsText}>No commands found</div>
                        </div>
                    ) : (
                        filteredCommands.map((command, index) => (
                            <div
                                key={command.id}
                                className={`${styles.command} ${index === selectedIndex ? styles.selected : ''}`}
                                onClick={() => {
                                    command.action();
                                    onClose();
                                }}
                            >
                                <div className={styles.commandIcon}>{command.icon}</div>
                                <div className={styles.commandContent}>
                                    <div className={styles.commandTitle}>{command.title}</div>
                                    <div className={styles.commandDescription}>{command.description}</div>
                                </div>
                                {index === selectedIndex && (
                                    <div className={styles.enterHint}>⏎</div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div className={styles.footer}>
                    <div className={styles.shortcuts}>
                        <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
                        <span><kbd>⏎</kbd> Execute</span>
                        <span><kbd>ESC</kbd> Close</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
