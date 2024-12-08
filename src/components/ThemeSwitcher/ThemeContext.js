import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const savedMode = localStorage.getItem("darkMode");
      return savedMode ? JSON.parse(savedMode) : false; // Default to light mode
    } catch (e) {
      console.error("Error accessing localStorage:", e);
      return false; // Fallback
    }
  });
  
  useEffect(() => {
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