/**
 *  ██████╗ ██████╗ ███╗   ███╗███╗   ███╗ █████╗ ███╗   ██╗██████╗ 
 * ██╔════╝██╔═══██╗████╗ ████║████╗ ████║██╔══██╗████╗  ██║██╔══██╗
 * ██║     ██║   ██║██╔████╔██║██╔████╔██║███████║██╔██╗ ██║██║  ██║
 * ██║     ██║   ██║██║╚██╔╝██║██║╚██╔╝██║██╔══██║██║╚██╗██║██║  ██║
 * ╚██████╗╚██████╔╝██║ ╚═╝ ██║██║ ╚═╝ ██║██║  ██║██║ ╚████║██████╔╝
 *  ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ 
 *                                                                  
 * ██████╗  █████╗ ██╗     ███████╗████████╗████████╗███████╗       
 * ██╔══██╗██╔══██╗██║     ██╔════╝╚══██╔══╝╚══██╔══╝██╔════╝       
 * ██████╔╝███████║██║     █████╗     ██║      ██║   █████╗         
 * ██╔═══╝ ██╔══██║██║     ██╔══╝     ██║      ██║   ██╔══╝         
 * ██║     ██║  ██║███████╗███████╗   ██║      ██║   ███████╗       
 * ╚═╝     ╚═╝  ╚═╝╚══════╝╚══════╝   ╚═╝      ╚═╝   ╚══════╝       
 *                                                                  
 */

/**========================================================================
 **                  React Dependencies Imports
 *========================================================================**/
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/**========================================================================
 **                  Context Hooks Imports
 *========================================================================**/
import { useBackground } from '../../Background/BackgroundContext';
import { useContext } from 'react';
import { ThemeContext } from '../ThemeSwitcher/ThemeContext';
import { ProjectsData } from '../../Pages/Projects/ProjectsData';

/**========================================================================
 **                   Stylesheet Imports
 *========================================================================**/
import styles from './CommandPalette.module.css';

/**========================================================================
 **                   Overlay Component
 *========================================================================**/
import CrashOverlay from "../../Modules/SystemError/CrashOverlay";

/**========================================================================
 **                  Media Icons Imports
 *========================================================================**/
import { FiCommand } from "react-icons/fi";
import { TbSwitch2, TbError404 } from "react-icons/tb";
import { GiThunderSkull, GiEasterEgg } from "react-icons/gi";
import { MdLightMode, MdDarkMode } from "react-icons/md";
import { RiMailSendFill } from "react-icons/ri";
import { ImTerminal } from "react-icons/im";
import { BsJournalAlbum } from "react-icons/bs";
import { FaRegFolderOpen } from "react-icons/fa6";
import { TbFaceIdError } from "react-icons/tb";

const CommandPalette = ({ isOpen, onClose, onOpenGithub, onOpenBackgroundTest }) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [blogPosts, setBlogPosts] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const inputRef = useRef(null);
    const navigate = useNavigate();
    const { toggleBackground } = useBackground();
    const [crashed, setCrashed] = useState(false);
    const { darkMode, toggleDarkMode } = useContext(ThemeContext);

    /**============================================
     **   Fetch blog metadata on component mount
     *=============================================**/
    useEffect(() => {
        const fetchBlogPosts = async () => {
            try {
                const response = await fetch('/posts/meta.json');
                const posts = await response.json();
                setBlogPosts(posts);
            } catch (error) {
                console.error('Error fetching blog posts:', error);
            }
        };

        fetchBlogPosts();
    }, []);

    // Search function for blogs and projects
    const searchSitewide = (searchQuery) => {
        if (!searchQuery.trim()) return [];

        const query_lower = searchQuery.toLowerCase();
        const results = [];

        // Search blog posts
        blogPosts.forEach(blog => {
            const searchText = `${blog.title} ${blog.description} ${blog.tags?.join(' ') || ''} ${blog.date}`.toLowerCase();
            if (searchText.includes(query_lower)) {
                results.push({
                    type: 'blog',
                    id: `blog-${blog.id}`,
                    title: blog.title,
                    description: blog.description,
                    icon: <BsJournalAlbum />,
                    date: blog.date,
                    tags: blog.tags || [],
                    filename: blog.filename,
                    action: () => {
                        if (blog.filename) {
                            navigate(`/blog/${blog.filename}`);
                        }
                        onClose();
                    }
                });
            }
        });

        // Search projects
        ProjectsData.forEach(project => {
            const contentText = project.content?.join(' ') || '';
            const searchText = `${project.title} ${contentText} ${project.tags?.join(' ') || ''}`.toLowerCase();
            if (searchText.includes(query_lower)) {
                results.push({
                    type: 'project',
                    id: `project-${project.id}`,
                    title: project.title,
                    description: contentText.slice(0, 120) + (contentText.length > 120 ? '...' : ''),
                    icon: <FaRegFolderOpen />,
                    tags: project.tags || [],
                    projectId: project.id,
                    action: () => {
                        navigate('/projects');
                        // Optionally scroll to specific project or open project details
                        setTimeout(() => {
                            const projectElement = document.querySelector(`[data-project-id="${project.id}"]`);
                            if (projectElement) {
                                projectElement.scrollIntoView({ behavior: 'smooth' });
                            }
                        }, 100);
                        onClose();
                    }
                });
            }
        });

        return results.slice(0, 8); // Limit results to prevent overwhelming UI
    };

    // Update search results when query changes
    useEffect(() => {
        if (query.trim()) {
            const results = searchSitewide(query);
            setSearchResults(results);

            // Track command palette searches (debounced to prevent spam)
            if (query.trim().length > 2) {
                // Clear any existing timeout
                if (window.commandPaletteSearchTimeout) {
                    clearTimeout(window.commandPaletteSearchTimeout);
                }

                // Set a new timeout to track after user stops typing
                window.commandPaletteSearchTimeout = setTimeout(() => {
                    // analytics.trackSearch(query.trim(), results.length);
                }, 1500); // Wait 1.5 seconds for command palette
            }
        } else {
            setSearchResults([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, blogPosts]);

    useEffect(() => {
        if (!isOpen) return;

        const handleQuickNav = (e) => {
            if (e.altKey) {
                switch (e.key) {
                    case '1':
                        navigate('/');
                        onClose();
                        break;
                    case '2':
                        navigate('/about');
                        onClose();
                        break;
                    case '3':
                        navigate('/blog');
                        onClose();
                        break;
                    case '4':
                        navigate('/projects');
                        onClose();
                        break;
                    default:
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleQuickNav);
        return () => window.removeEventListener('keydown', handleQuickNav);
    }, [isOpen, navigate, onClose]);

    // Define all available commands
    const commands = [
        {
            id: 'virtual-terminal',
            title: 'GitHub Terminal Explorer',
            description: '',
            icon: <ImTerminal />,
            keywords: ['terminal', 'github', 'vscode', 'editor', 'filesystem'],
            action: () => {
                onOpenGithub();
            }
        },
        {
            id: 'background-vibe',
            title: 'Switch Vibe',
            description: '',
            icon: <TbSwitch2 />,
            keywords: ['psychedelic', 'colorful', 'rainbow', 'wallpaper'],
            action: () => {
                if (onOpenBackgroundTest) {
                    onOpenBackgroundTest();
                }
            }
        },
        {
            id: 'theme-switch',
            title: 'Switch Theme',
            description: '',
            icon: darkMode ? <MdLightMode /> : <MdDarkMode />,
            keywords: ['theme', 'dark', 'light', 'mode', 'switch'],
            action: () => toggleDarkMode()
        },
        {
            id: 'toggle-fun',
            title: 'Maximum Fun ? Minimum Fun',
            description: '',
            icon: <GiThunderSkull />,
            keywords: ['background', 'wallpaper', 'toggle', 'hide', 'show'],
            action: () => toggleBackground()
        },
        {
            id: 'easter-egg',
            title: 'Easter Egg',
            description: '',
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
            description: '',
            icon: <TbError404 />,
            keywords: ['exit', 'crash', 'system', 'error', 'blue', 'screen'],
            action: () => {
                setCrashed(true);
            }
        },
        {
            id: 'send-mail',
            title: 'Send Mail',
            description: '',
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
    ];

    // Filter commands based on query
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const filteredCommands = query.trim()
        ? [...searchResults, ...commands.filter(command => {
            const searchTerms = query.toLowerCase().split(' ');
            return searchTerms.every(term =>
                command.title.toLowerCase().includes(term) ||
                command.description.toLowerCase().includes(term) ||
                command.keywords?.some(keyword => keyword.includes(term))
            );
        })] : commands;



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
                        setTimeout(() => scrollToSelectedItem(newIndex), 0);
                        return newIndex;
                    });
                    break;

                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(prev => {
                        const newIndex = prev > 0 ? prev - 1 : filteredCommands.length - 1;
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
                        placeholder="Search commands, blogs, and projects"
                        className={styles.input}
                    />
                    <div className={styles.shortcut} onClick={onClose}>ESC</div>
                </div>



                <div className={styles.results} ref={resultsRef}>
                    {filteredCommands.length === 0 ? (
                        <div className={styles.noResults}>
                            <div className={styles.noResultsIcon}><TbFaceIdError /></div>
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
                                    <div className={styles.commandTitle}>
                                        {command.title}
                                        {command.type && (
                                            <span className={styles.commandType}>
                                                {command.type === 'blog' ? ' • Blog' : ' • Project'}
                                            </span>
                                        )}
                                        {command.date && (
                                            <span className={styles.commandDate}>
                                                {' • ' + new Date(command.date).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                    <div className={styles.commandDescription}>{command.description}</div>
                                    {command.tags && command.tags.length > 0 && (
                                        <div className={styles.commandTags}>
                                            {command.tags.slice(0, 3).map(tag => (
                                                <span key={tag} className={styles.tag}>{tag}</span>
                                            ))}
                                        </div>
                                    )}
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
                        <span><kbd>Enter</kbd> Execute</span>
                        <span><kbd>ESC</kbd> Close</span>
                        <span><kbd>Ctrl+K+Z</kbd> Zen Mode</span>
                        <span><kbd>Ctrl+K+1</kbd><kbd>Alt+1</kbd> Home</span>
                        <span><kbd>Ctrl+K+2</kbd><kbd>Alt+2</kbd> About Moi</span>
                        <span><kbd>Ctrl+K+3</kbd><kbd>Alt+3</kbd> Blog</span>
                        <span><kbd>Ctrl+K+4</kbd><kbd>Alt+4</kbd> Projects</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
