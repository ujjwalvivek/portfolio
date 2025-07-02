import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeSwitcher/ThemeContext';
import { BackgroundProvider, useBackground } from './components/Background/BackgroundContext';
import GlobalBackground from './components/Background/GlobalBackground';
import styles from './App.module.css';
import Home from './components/Pages/Home/Home';
import About from './components/Pages/About/About';
import Projects from './components/Pages/Projects/Projects';
import Contact from './components/Pages/Contact/Contact';
import Blog from './components/Pages/Blog/Blog';
import Footer from './components/Footer/Footer';
import TopBar from './components/TopBar/TopBar';
import LoadingSpinner from './components/Loader/LoadingSpinner';
import Links from './components/Pages/Links/Links';
import BackgroundTest from './components/Pages/BackgroundTest/BackgroundTest'; // Updated import path

function AppContent() {
  const { backgroundConfig } = useBackground();
  
  return (
    <div 
      className={styles.App}
      style={{
        backgroundColor: backgroundConfig.type === 'none' ? 'var(--background-color)' : 'transparent'
      }}
    >
      <GlobalBackground />
      <TopBar />
      <main id="main-content" className={styles.mainContent}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/blog/*" element={<Blog />} />
          <Route path="/links" element={<Links />} />
          <Route path="/bg-test" element={<BackgroundTest />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BackgroundProvider>
        <Router>
          <LoadingSpinner>
            <AppContent />
          </LoadingSpinner>
        </Router>
      </BackgroundProvider>
    </ThemeProvider>
  );
}

export default App;