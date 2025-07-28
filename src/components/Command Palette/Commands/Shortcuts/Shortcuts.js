import styles from './Shortcuts.module.css';
import { useEffect, useState } from 'react';
import { FiCommand, FiZap, FiNavigation, FiHome, FiUser, FiFileText } from 'react-icons/fi';
import { FaRegFolderOpen } from "react-icons/fa6";
import { MdKeyboard } from 'react-icons/md';

const shortcuts = [
  { 
    keys: ['Ctrl', 'K', 'P'], 
    desc: 'Open Command Palette',
    icon: <FiCommand />,
    category: 'core'
  },
  { 
    keys: ['Ctrl', 'K', 'Z'], 
    desc: 'Toggle Fullscreen (Zen Mode)',
    icon: <FiZap />,
    category: 'view'
  },
  { 
    keys: ['Ctrl', 'K', 'T'], 
    desc: 'Toggle Theme',
    icon: <MdKeyboard />,
    category: 'view'
  },
  { 
    keys: ['Ctrl', 'K', '1'], 
    desc: 'Go Home',
    icon: <FiHome />,
    category: 'nav'
  },
  { 
    keys: ['Ctrl', 'K', '2'], 
    desc: 'Go About',
    icon: <FiUser />,
    category: 'nav'
  },
  { 
    keys: ['Ctrl', 'K', '3'], 
    desc: 'Go Blog',
    icon: <FiFileText />,
    category: 'nav'
  },
  { 
    keys: ['Ctrl', 'K', '4'], 
    desc: 'Go Projects',
    icon: <FaRegFolderOpen />,
    category: 'nav'
  },
  { 
    keys: ['Alt', '1/2/3/4'], 
    desc: 'Quick Nav',
    icon: <FiNavigation />,
    category: 'nav'
  },
];

const Shortcuts = ({ onClose }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === 'escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) acc[shortcut.category] = [];
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {});

  const categoryTitles = {
    core: 'Core',
    view: 'View',
    nav: 'Navigation'
  };

  return (
    <div className={`${styles.overlay} ${mounted ? styles.mounted : ''}`}>
      <div className={styles.grid}>
        <div className={styles.panel} onClick={e => e.stopPropagation()}>
          <div className={styles.header}>
            <div className={styles.titleGroup}>
              <MdKeyboard className={styles.headerIcon} />
              <h2 className={styles.title}>Keyboard Shortcuts</h2>
            </div>
            <div className={styles.closeHint}>ESC</div>
          </div>

          <div className={styles.content}>
            {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
              <div key={category} className={styles.category}>
                <h3 className={styles.categoryTitle}>
                  {categoryTitles[category]}
                </h3>
                <div className={styles.shortcutList}>
                  {categoryShortcuts.map((shortcut, index) => (
                    <div key={index} className={styles.shortcut}>
                      <div className={styles.shortcutIcon}>
                        {shortcut.icon}
                      </div>
                      <div className={styles.shortcutContent}>
                        <div className={styles.keys}>
                          {shortcut.keys.map((key, keyIndex) => (
                            <kbd key={keyIndex} className={styles.key}>
                              {key}
                            </kbd>
                          ))}
                        </div>
                        <span className={styles.desc}>{shortcut.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shortcuts;
