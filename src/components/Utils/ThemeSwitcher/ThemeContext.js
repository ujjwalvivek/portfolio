/**
 * ████████╗██╗  ██╗███████╗███╗   ███╗███████╗                 
 * ╚══██╔══╝██║  ██║██╔════╝████╗ ████║██╔════╝                 
 *    ██║   ███████║█████╗  ██╔████╔██║█████╗                   
 *    ██║   ██╔══██║██╔══╝  ██║╚██╔╝██║██╔══╝                   
 *    ██║   ██║  ██║███████╗██║ ╚═╝ ██║███████╗                 
 *    ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝╚══════╝                 
 *                                                              
 * ███████╗██╗    ██╗██╗████████╗ ██████╗██╗  ██╗               
 * ██╔════╝██║    ██║██║╚══██╔══╝██╔════╝██║  ██║               
 * ███████╗██║ █╗ ██║██║   ██║   ██║     ███████║               
 * ╚════██║██║███╗██║██║   ██║   ██║     ██╔══██║               
 * ███████║╚███╔███╔╝██║   ██║   ╚██████╗██║  ██║               
 * ╚══════╝ ╚══╝╚══╝ ╚═╝   ╚═╝    ╚═════╝╚═╝  ╚═╝               
 *                                                              
 *  ██████╗ ██████╗ ███╗   ██╗████████╗███████╗██╗  ██╗████████╗
 * ██╔════╝██╔═══██╗████╗  ██║╚══██╔══╝██╔════╝╚██╗██╔╝╚══██╔══╝
 * ██║     ██║   ██║██╔██╗ ██║   ██║   █████╗   ╚███╔╝    ██║   
 * ██║     ██║   ██║██║╚██╗██║   ██║   ██╔══╝   ██╔██╗    ██║   
 * ╚██████╗╚██████╔╝██║ ╚████║   ██║   ███████╗██╔╝ ██╗   ██║   
 *  ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚═╝  ╚═╝   ╚═╝   
 *                                                              
 */

import { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const savedMode = localStorage.getItem("darkMode");
      return savedMode ? JSON.parse(savedMode) : true;
    } catch (e) {
      console.error("Error accessing localStorage:", e);
      return true; // Fallback
    }
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }

    // Safari dark mode bug: toggling overflow forces a repaint so theme changes apply instantly
    document.documentElement.style.overflow = 'hidden';
    setTimeout(() => { document.documentElement.style.overflow = ''; }, 1);

    try {
      localStorage.setItem("darkMode", JSON.stringify(darkMode));
    } catch (e) {
      console.error("Error saving to localStorage:", e);
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prevmode => !prevmode);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};