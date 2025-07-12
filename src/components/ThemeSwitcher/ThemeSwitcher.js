import React, { useContext, useEffect } from "react";
import { ThemeContext } from './ThemeContext';
import styles from './ThemeSwitcher.module.css';

const ThemeSwitcher = () => {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      document.body.classList.add('dark-mode');
      html.classList.add('dark-mode');

    } else {
      document.body.classList.remove('dark-mode');
      html.classList.remove('dark-mode');
    }
    // Safari dark mode bug: toggling overflow forces a repaint so theme changes apply instantly
    html.style.overflow = 'hidden';
    setTimeout(() => { html.style.overflow = ''; }, 1);
  }, [darkMode]);

  return (
    <div className={styles.ThemeSwitcherContainer} onClick={toggleDarkMode} role="button" tabIndex="0" title={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
      <p>{`switchTheme(${darkMode ? 'light' : 'dark'})`}</p>
    </div>
  );
};

export default ThemeSwitcher;