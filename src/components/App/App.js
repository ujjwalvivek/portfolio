/**
 * ███╗   ███╗ █████╗ ██╗███╗   ██╗     █████╗ ██████╗ ██████╗ 
 * ████╗ ████║██╔══██╗██║████╗  ██║    ██╔══██╗██╔══██╗██╔══██╗
 * ██╔████╔██║███████║██║██╔██╗ ██║    ███████║██████╔╝██████╔╝
 * ██║╚██╔╝██║██╔══██║██║██║╚██╗██║    ██╔══██║██╔═══╝ ██╔═══╝ 
 * ██║ ╚═╝ ██║██║  ██║██║██║ ╚████║    ██║  ██║██║     ██║     
 * ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝    ╚═╝  ╚═╝╚═╝     ╚═╝     
 *                                                             
 */

/**========================================================================
 *                           React Imports
 *========================================================================**/
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

/**========================================================================
 *                           Context Hooks
 *========================================================================**/
import { ThemeProvider } from '../Utils/ThemeSwitcher/ThemeContext';
import { BackgroundProvider, useBackground } from '../Background/BackgroundContext';
import { useCommandPalette } from '../Utils/Command Palette/useCommandPalette';
import { RealTimeColorChange } from '../Background/ColorUtils';

/**========================================================================
 *                           CSS Styles
 *========================================================================**/
import styles from './App.module.css';

/**========================================================================
 *                           Components
 *========================================================================**/
import Home from '../Pages/Home/Home';
import About from '../Pages/About/About';
import Projects from '../Pages/Projects/Projects';
import Blog from '../Pages/Blog/Blog';
import Footer from '../Modules/Footer/Footer';
import TopBar from '../Modules/TopBar/TopBar';
import BackgroundTest from '../Utils/BackgroundTest/BackgroundTest';
import GlobalBackground from '../Background/GlobalBackground';
import CommandPalette from '../Utils/Command Palette/CommandPalette';
import LandingPage from '../Pages/Landing/LandingPage';
import GithubNavigator from '../Modules/Github Navigator/GithubNavigator';
import CommandHint from '../Modules/Tip/CommandHint';

/**========================================================================
 *                           App Wrapper
 *========================================================================**/
function AppContent() {
  const { backgroundConfig } = useBackground();
  const { isOpen, setIsOpen } = useCommandPalette();
  const [isGithubOpen, setIsGithubOpen] = useState(false);
  const [showBackgroundTest, setShowBackgroundTest] = useState(false);

  /**======================
   *    Live CSS Updates
   *========================**/
  RealTimeColorChange();

  return (
    <div
      className={styles.App}
      style={{ backgroundColor: backgroundConfig.type === 'none' ? 'var(--background-color)' : 'transparent' }}
    >
      {/* Global background is applied here, it will cover the entire app. */}
      <GlobalBackground />

      {/* This is the main content area, where all pages will be rendered. */}
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
      <Footer
        showOverlay={showBackgroundTest}
        setShowOverlay={setShowBackgroundTest}
      />

      {/* Command Shortcuts Overlay */}
      <CommandHint />

      {/* Command Palette and GitHub Navigator */}
      <CommandPalette
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onOpenGithub={() => {
          setIsGithubOpen(true);
          setIsOpen(false);
        }}
        onOpenBackgroundTest={() => {
          setShowBackgroundTest(true);
          setIsOpen(false);
        }}
      />
      <GithubNavigator
        isOpen={isGithubOpen}
        onClose={() => setIsGithubOpen(false)}
      />

    </div>
  );
}

/**========================================================================
 *                           Main App Renderer
 *========================================================================**/
function App() {
  const [showLanding, setShowLanding] = useState(() => {
    return localStorage.getItem('hasVisitedLanding') !== 'true';
  });

  // Landing page is set to show on the first load ONLY.
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
          <AppContent />
          {showLanding && <LandingPage onEnter={handleEnter} />}
        </Router>
      </BackgroundProvider>
    </ThemeProvider>
  );
}

export default App;

/**
 * ███████╗ ██████╗ ███████╗
 * ██╔════╝██╔═══██╗██╔════╝
 * █████╗  ██║   ██║█████╗  
 * ██╔══╝  ██║   ██║██╔══╝  
 * ███████╗╚██████╔╝██║     
 * ╚══════╝ ╚═════╝ ╚═╝     
 *                          
 */
