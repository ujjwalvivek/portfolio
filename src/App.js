import React from "react";
import styles from './App.module.css';
import { useContext } from "react";
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider, ThemeContext } from './components/ThemeSwitcher/ThemeContext';
import Header from './components/Header/Header';
import LoadingSpinner from './components/Loader/LoadingSpinner';

function App() {

  const { darkMode } = useContext(ThemeContext);
  const getDarkClass = (baseClass) => `${baseClass} ${darkMode ? styles.dark : ''}`;

  return (
    <LoadingSpinner>
    <div className={getDarkClass(styles.App)}>
      <Header />
      <main className={getDarkClass(styles.AppMain)}>
        <h1>Work In Progress</h1>
        <p style={{ textTransform: 'none' }}>Something cool coming before the New Year!</p>
        <p>Be on the lookout</p>
      </main>
      <footer>
        <p>© 2024 Ujjwal Vivek. Fuelled by sleepless nights, almost ready to shine!</p>
      </footer>
    </div>
    </LoadingSpinner>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </Router>
  );
}