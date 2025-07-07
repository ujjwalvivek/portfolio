import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const savedMode = localStorage.getItem("darkMode");
      return savedMode ? JSON.parse(savedMode) : true; // Default to dark mode
    } catch (e) {
      console.error("Error accessing localStorage:", e);
      return true; // Fallback
    }
  });
  
  useEffect(() => {
    // Add or remove the dark mode class from the body
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }

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