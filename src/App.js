import React from "react";
import styles from './App.module.css';
import { useContext } from "react";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider, ThemeContext } from './components/ThemeSwitcher/ThemeContext';
import Header from './components/Header/Header';
import LoadingSpinner from './components/Loader/LoadingSpinner';
import Footer from "./components/Footer/Footer";
import Home from "./components/Pages/Home/Home";
import About from "./components/Pages/About/About"; 
import Contact from "./components/Pages/Contact/Contact";
import Projects from "./components/Pages/Projects/Projects";
import Work from "./components/Pages/Work/Work";

function App() {

  const { darkMode } = useContext(ThemeContext);
  const getDarkClass = (baseClass) => `${baseClass} ${darkMode ? styles.dark : ''}`;

  return (
    <LoadingSpinner>
    <div className={getDarkClass(styles.App)}>
      <Header />
      <main className={getDarkClass(styles.AppMain)}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/work" element={<Work />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
      <Footer />
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