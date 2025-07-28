import { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../ThemeSwitcher/ThemeContext';  

export const useCommandPalette = (setShowShortcuts) => {
  const [isOpen, setIsOpen] = useState(false);
  const chainState = useRef(null);
  const chainTimeout = useRef(null);
  const navigate = useNavigate();
  const { toggleDarkMode } = useContext(ThemeContext);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Shift+P or Cmd+Shift+P to open
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }

      // Example: Ctrl+K starts a chain
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        chainState.current = 'ctrl+k';
        // Wait for next key within 1.5s
        clearTimeout(chainTimeout.current);
        chainTimeout.current = setTimeout(() => {
          chainState.current = null;
        }, 1500);
        return;
      }

      // Handle chained commands
      if (chainState.current === 'ctrl+k') {
        if (e.key.toLowerCase() === 'p') {
          e.preventDefault();
          // Ctrl+K, P (palette)
          setIsOpen(prev => !prev);
        } else if (e.key.toLowerCase() === 'z') {
          e.preventDefault();
          // Ctrl+K, Z (zen mode / fullscreen)
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            document.documentElement.requestFullscreen();
          }
        }
        else if (e.key.toLowerCase() === 't') {
           toggleDarkMode();
        }
        else if (e.key.toLowerCase() === '1') {
          navigate('/');
        }
        else if (e.key.toLowerCase() === '2') {
          navigate('/about');
        }
        else if (e.key.toLowerCase() === '3') {
          navigate('/blog');
        }
        else if (e.key.toLowerCase() === '4') {
          navigate('/projects');
        }
        else if (e.key.toLowerCase() === '/') {
            setShowShortcuts(prev => !prev);
        }
        chainState.current = null;
        clearTimeout(chainTimeout.current);
        return;
      }

      if ((e.altKey) && e.key.toLowerCase() === '1') {
        navigate('/');
      }

      if ((e.altKey) && e.key.toLowerCase() === '2') {
        navigate('/about');
      }

      if ((e.altKey) && e.key.toLowerCase() === '3') {
        navigate('/blog');
      }

      if ((e.altKey) && e.key.toLowerCase() === '4') {
        navigate('/projects');
      }

    };

    const handleContextMenu = (e) => {
      if (e.shiftKey) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      clearTimeout(chainTimeout.current);
    };
  }, [navigate, toggleDarkMode, setShowShortcuts]);

  return { isOpen, setIsOpen };
};
