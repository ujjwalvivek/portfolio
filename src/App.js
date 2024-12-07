import React, { useState, useEffect } from "react";
import { ReactComponent as Logo } from './logo.svg';
import { CgDarkMode as ThemeLogo} from "react-icons/cg";
import styles from './App.module.css';

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem("darkMode");
    return savedMode ? JSON.parse(savedMode) : false; // Default to light mode
  });

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add(styles.dark);
    } else {
      document.body.classList.remove(styles.dark);
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prevmode => !prevmode);
  };

  return (
    <div className={`${styles.App} ${darkMode ? styles.dark : ''}`}>
      <header className={styles.AppHeader}>
        <button className={`${styles.ToggleButton} ${darkMode ? styles.dark : ''}`} onClick={toggleDarkMode}>
        {darkMode ? (
            <ThemeLogo className={`${styles.AppLogo} ${styles.invert}`} alt="light logo" />
          ) : (
            <ThemeLogo className={styles.AppLogo} alt="dark logo" />
          )}
        </button>
        <p>powered by <span style={{ color: '#61DAFB', fontWeight: 'bold' }}>React</span></p>
        <br></br>
        <Logo className={`${styles.AppLogo} ${darkMode ? styles.dark : ''}`} alt="logo"/>
      </header>
      <main className={styles.AppMain}>
        <h1>Work In Progress</h1>
        <p style={{ textTransform: 'none' }}>Something cool coming before the New Year!</p>
        <p>Be on the lookout</p>
      </main>
      <footer>
        <p>© 2024 Ujjwal Vivek. Fuelled by sleepless nights, almost ready to shine!</p>
      </footer>
    </div>
  );
}

export default App;