import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '../ThemeSwitcher/ThemeContext';
import { BackgroundProvider, useBackground } from '../Background/BackgroundContext';
import GlobalBackground from '../Background/GlobalBackground';
import styles from './App.module.css';
import Home from '../Pages/Home/Home';
import About from '../Pages/About/About';
import Projects from '../Pages/Projects/Projects';
import Blog from '../Pages/Blog/Blog';
import Footer from '../Footer/Footer';
import TopBar from '../TopBar/TopBar';
import LoadingSpinner from '../Loader/LoadingSpinner';
import BackgroundTest from '../Pages/BackgroundTest/BackgroundTest'; // Updated import path

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
          <Route path="/blog/*" element={<Blog />} />
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