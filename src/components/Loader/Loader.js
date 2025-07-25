import React from 'react';
import styles from './Loader.module.css';
import { useEffect, useState } from 'react';

const Loader = () => {
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
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode !== null) {
      setDarkMode(JSON.parse(savedMode));
    }
  }, []);

  const getDarkClass = (baseClass) => `${baseClass} ${darkMode ? styles.dark : ''}`;

  return (
    <div className={getDarkClass(styles.Loader)}>
      <div className={getDarkClass(styles.Spinner)}></div>
    </div>
  );
};

export default Loader;