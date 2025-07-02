import React, { useContext, useEffect } from "react";
import { ThemeContext } from './ThemeContext';
import styles from './ThemeSwitcher.module.css';

const ThemeSwitcher = () => {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  return (
    <div className={styles.ThemeSwitcherContainer} onClick={toggleDarkMode} role="button" tabIndex="0" aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
      <p>{`switchTheme(${darkMode ? 'light' : 'dark'});`}</p>
    </div>
  );
};

export default ThemeSwitcher;