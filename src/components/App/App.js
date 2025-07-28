import { useState } from 'react';
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
import BackgroundTest from '../Pages/BackgroundTest/BackgroundTest';
import LandingPage from '../Pages/Landing/LandingPage';
import CommandPalette from '../Command Palette/CommandPalette';
import { useCommandPalette } from '../Command Palette/useCommandPalette';
import GithubNavigator from '../Command Palette/Commands/Github Navigator/GithubNavigator';
import Shortcuts from '../Command Palette/Commands/Shortcuts/Shortcuts';
import CommandHint from '../Command Palette/Tip/CommandHint';

function AppContent() {
  const { backgroundConfig } = useBackground();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { isOpen, setIsOpen } = useCommandPalette(setShowShortcuts);
  const [isGithubOpen, setIsGithubOpen] = useState(false);

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
      <CommandHint />
      <CommandPalette 
            isOpen={isOpen} 
            onClose={() => setIsOpen(false)} 
            onOpenGithub={() => { 
              setIsGithubOpen(true);
              setIsOpen(false);
            }}  
          />

          <GithubNavigator 
            isOpen={isGithubOpen} 
            onClose={() => setIsGithubOpen(false)} 
          /> 

          {showShortcuts && <Shortcuts 
            onClose={() => setShowShortcuts(false)} 
          />}
    </div>
  );
}

function App() {
  const [showLanding, setShowLanding] = useState(() => {
    return localStorage.getItem('hasVisitedLanding') !== 'true';
  });

  const handleEnter = () => {
    localStorage.setItem('hasVisitedLanding', 'true');
    setShowLanding(false);
  };

  return (
    <ThemeProvider>
      <BackgroundProvider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}>
          <LoadingSpinner>
            {showLanding ? (
              <LandingPage onEnter={handleEnter} />
            ) : (
              <AppContent />
            )}
          </LoadingSpinner>
        </Router>
      </BackgroundProvider>
    </ThemeProvider>
  );
}

export default App;