import React, { useContext, useEffect } from "react";
// import { CgDarkMode as ThemeLogo} from "react-icons/cg";
import { ThemeContext } from './ThemeContext';
import styles from './ThemeSwitcher.module.css';

const ThemeSwitcher = () => {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const getDarkClass = (baseClass) => `${baseClass} ${darkMode ? styles.dark : ''}`;

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add(styles.dark);
    } else {
      document.body.classList.remove(styles.dark);
    }
  }, [darkMode]);

  return (
    <div className={getDarkClass(styles.ThemeSwitcherContainer)} onClick={toggleDarkMode} role="button" tabIndex="0" aria-label={darkMode ? "light logo" : "dark logo"}>
      {/* <ThemeLogo className={styles.ThemeLogo} /> */}
      <p>{`switchTheme(${darkMode ? 'light' : 'dark'});`}</p>
    </div>
  );
};

export default ThemeSwitcher;