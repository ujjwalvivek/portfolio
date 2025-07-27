import React, { useState, useEffect, useRef } from 'react';
import styles from './DevTools.module.css';

const DevTools = ({ isOpen, onClose }) => {
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [systemInfo, setSystemInfo] = useState({});
  const [networkRequests, setNetworkRequests] = useState([]);
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [storageData, setStorageData] = useState({ localStorage: {}, sessionStorage: {}, cookies: {} });
  const [errorLogs, setErrorLogs] = useState([]);
  const [eventListeners, setEventListeners] = useState([]);
  const [lighthouseMetrics, setLighthouseMetrics] = useState({});
  const [colorPalette, setColorPalette] = useState([]);
  const [fontData, setFontData] = useState([]);
  const [seoData, setSeoData] = useState({});
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [memoryUsage, setMemoryUsage] = useState([]);

  // Refs
  const updateInterval = useRef(null);
  const originalConsole = useRef({});
  const originalFetch = useRef(null);
  //const originalXHR = useRef({});

  // Initialize system info
  useEffect(() => {
    if (isOpen) {
      updateSystemInfo();
      initializeMonitoring();
      startRealTimeUpdates();
      analyzePage();
    } else {
      stopMonitoring();
    }

    return () => {
      stopMonitoring();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const updateSystemInfo = () => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    setSystemInfo({
      screen: `${window.innerWidth}x${window.innerHeight}`,
      viewport: `${document.documentElement.clientWidth}x${document.documentElement.clientHeight}`,
      devicePixelRatio: window.devicePixelRatio,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      languages: navigator.languages.join(', '),
      cookieEnabled: navigator.cookieEnabled,
      onlineStatus: navigator.onLine ? 'Online' : 'Offline',
      connection: connection ? {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink + 'Mbps',
        rtt: connection.rtt + 'ms'
      } : 'Not available',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      colorDepth: window.screen.colorDepth,
      pixelDepth: window.screen.pixelDepth
    });
  };

  const initializeMonitoring = () => {
    if (isMonitoring) return;

    // Console monitoring
    originalConsole.current = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info
    };

    const createConsoleInterceptor = (type) => (...args) => {
      originalConsole.current[type].apply(console, args);
      setConsoleLogs(prev => [...prev.slice(-99), {
        id: Date.now() + Math.random(),
        type,
        message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '),
        timestamp: new Date().toLocaleTimeString(),
        stack: type === 'error' ? new Error().stack : null
      }]);
    };

    console.log = createConsoleInterceptor('log');
    console.warn = createConsoleInterceptor('warn');
    console.error = createConsoleInterceptor('error');
    console.info = createConsoleInterceptor('info');

    // Error monitoring
    window.addEventListener('error', (event) => {
      setErrorLogs(prev => [...prev.slice(-49), {
        id: Date.now() + Math.random(),
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toLocaleTimeString()
      }]);
    });

    // Unhandled promise rejection monitoring
    window.addEventListener('unhandledrejection', (event) => {
      setErrorLogs(prev => [...prev.slice(-49), {
        id: Date.now() + Math.random(),
        message: `Unhandled Promise Rejection: ${event.reason}`,
        filename: 'Promise',
        lineno: 0,
        colno: 0,
        stack: event.reason?.stack || 'No stack trace available',
        timestamp: new Date().toLocaleTimeString()
      }]);
    });

    // Network monitoring
    originalFetch.current = window.fetch;

    window.fetch = async function(...args) {
      const startTime = performance.now();
      const url = args[0];
      const options = args[1] || {};
      
      try {
        const response = await originalFetch.current.apply(this, args);
        const endTime = performance.now();
        
        setNetworkRequests(prev => [...prev.slice(-49), {
          id: Date.now() + Math.random(),
          method: options.method || 'GET',
          url: url,
          status: response.status,
          statusText: response.statusText,
          duration: Math.round(endTime - startTime),
          size: response.headers.get('content-length') || 'Unknown',
          timestamp: new Date().toLocaleTimeString(),
          type: 'fetch'
        }]);
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        setNetworkRequests(prev => [...prev.slice(-49), {
          id: Date.now() + Math.random(),
          method: options.method || 'GET',
          url: url,
          status: 'ERROR',
          statusText: error.message,
          duration: Math.round(endTime - startTime),
          size: 0,
          timestamp: new Date().toLocaleTimeString(),
          type: 'fetch'
        }]);
        throw error;
      }
    };

    setIsMonitoring(true);
  };

  const stopMonitoring = () => {
    if (!isMonitoring) return;

    // Restore original console methods
    Object.keys(originalConsole.current).forEach(method => {
      console[method] = originalConsole.current[method];
    });

    // Restore original fetch
    if (originalFetch.current) {
      window.fetch = originalFetch.current;
    }

    if (updateInterval.current) {
      clearInterval(updateInterval.current);
    }

    setIsMonitoring(false);
  };

  const startRealTimeUpdates = () => {
    updateInterval.current = setInterval(() => {
      updateSystemInfo();
      updatePerformanceMetrics();
      updateStorageData();
      updateMemoryUsage();
      analyzePage();
    }, 2000);
  };

  const updatePerformanceMetrics = () => {
    if (performance.memory) {
      setPerformanceMetrics({
        usedJSHeapSize: (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2),
        totalJSHeapSize: (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2),
        jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)
      });
    }

    // Navigation timing
    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation) {
      setPerformanceMetrics(prev => ({
        ...prev,
        domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
        loadComplete: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
        pageLoad: Math.round(navigation.loadEventEnd - navigation.fetchStart),
        firstPaint: Math.round(navigation.loadEventEnd - navigation.fetchStart),
        ttfb: Math.round(navigation.responseStart - navigation.requestStart)
      }));
    }

    // Calculate Lighthouse-like metrics
    setLighthouseMetrics({
      performanceScore: Math.floor(Math.random() * 40) + 60, // Simulated
      accessibilityScore: Math.floor(Math.random() * 30) + 70,
      bestPracticesScore: Math.floor(Math.random() * 25) + 75,
      seoScore: Math.floor(Math.random() * 20) + 80,
      pwaScore: Math.floor(Math.random() * 50) + 50
    });
  };

  const updateStorageData = () => {
    const localStorage = {};
    const sessionStorage = {};
    const cookies = {};

    // Local Storage
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      localStorage[key] = window.localStorage.getItem(key);
    }

    // Session Storage
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const key = window.sessionStorage.key(i);
      sessionStorage[key] = window.sessionStorage.getItem(key);
    }

    // Cookies
    document.cookie.split(';').forEach(cookie => {
      const [key, value] = cookie.trim().split('=');
      if (key) cookies[key] = value || '';
    });

    setStorageData({ localStorage, sessionStorage, cookies });
  };

  const updateMemoryUsage = () => {
    if (performance.memory) {
      const usage = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
      setMemoryUsage(prev => [...prev.slice(-59), {
        time: new Date().toLocaleTimeString(),
        usage: parseFloat(usage)
      }]);
    }
  };

  const analyzePage = () => {
    // Extract color palette
    const elements = document.querySelectorAll('*');
    const colors = new Set();
    
    elements.forEach(el => {
      const styles = window.getComputedStyle(el);
      [styles.color, styles.backgroundColor, styles.borderColor].forEach(color => {
        if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
          colors.add(color);
        }
      });
    });
    
    setColorPalette([...colors].slice(0, 20));

    // Extract fonts
    const fonts = new Set();
    elements.forEach(el => {
      const fontFamily = window.getComputedStyle(el).fontFamily;
      if (fontFamily) {
        fontFamily.split(',').forEach(font => {
          fonts.add(font.trim().replace(/['"]/g, ''));
        });
      }
    });
    
    setFontData([...fonts].slice(0, 15));

    // SEO Analysis
    setSeoData({
      title: document.title || 'No title',
      description: document.querySelector('meta[name="description"]')?.content || 'No description',
      keywords: document.querySelector('meta[name="keywords"]')?.content || 'No keywords',
      headings: {
        h1: document.querySelectorAll('h1').length,
        h2: document.querySelectorAll('h2').length,
        h3: document.querySelectorAll('h3').length,
        h4: document.querySelectorAll('h4').length,
        h5: document.querySelectorAll('h5').length,
        h6: document.querySelectorAll('h6').length
      },
      images: document.querySelectorAll('img').length,
      imagesWithoutAlt: document.querySelectorAll('img:not([alt])').length,
      links: document.querySelectorAll('a').length,
      externalLinks: document.querySelectorAll('a[href^="http"]:not([href*="' + window.location.hostname + '"])').length
    });

    // Event listeners analysis
    const eventTypes = ['click', 'scroll', 'resize', 'load', 'mouseenter', 'mouseleave'];
    const listeners = [];
    
    eventTypes.forEach(type => {
      const elements = document.querySelectorAll(`[on${type}]`);
      if (elements.length > 0) {
        listeners.push({
          event: type,
          count: elements.length,
          elements: [...elements].slice(0, 5).map(el => el.tagName.toLowerCase())
        });
      }
    });
    
    setEventListeners(listeners);
  };

  const clearLogs = (type) => {
    switch (type) {
      case 'console':
        setConsoleLogs([]);
        break;
      case 'network':
        setNetworkRequests([]);
        break;
      case 'errors':
        setErrorLogs([]);
        break;
      default:
        // Optionally handle unknown types
        break;
    }
  };

  const exportData = (type) => {
    let data = {};
    let filename = '';

    switch (type) {
      case 'system':
        data = systemInfo;
        filename = `system-info-${Date.now()}.json`;
        break;
      case 'console':
        data = consoleLogs;
        filename = `console-logs-${Date.now()}.json`;
        break;
      case 'network':
        data = networkRequests;
        filename = `network-requests-${Date.now()}.json`;
        break;
      case 'storage':
        data = storageData;
        filename = `storage-data-${Date.now()}.json`;
        break;
      case 'errors':
        data = errorLogs;
        filename = `error-logs-${Date.now()}.json`;
        break;
      case 'seo':
        data = seoData;
        filename = `seo-analysis-${Date.now()}.json`;
        break;
      default:
        data = {};
        filename = `export-${Date.now()}.json`;
        break;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // All the existing tab components (OverviewTab, ConsoleTab, NetworkTab, StorageTab)
  // ... (keeping the existing ones)

  const OverviewTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.overviewGrid}>
        <div className={styles.metricCard}>
          <h3>🖥️ System</h3>
          <div className={styles.metricList}>
            <div>Screen: <span>{systemInfo.screen}</span></div>
            <div>Viewport: <span>{systemInfo.viewport}</span></div>
            <div>DPR: <span>{systemInfo.devicePixelRatio}</span></div>
            <div>Platform: <span>{systemInfo.platform}</span></div>
            <div>Status: <span>{systemInfo.onlineStatus}</span></div>
          </div>
        </div>

        <div className={styles.metricCard}>
          <h3>⚡ Performance</h3>
          <div className={styles.metricList}>
            <div>Memory: <span>{performanceMetrics.usedJSHeapSize}MB</span></div>
            <div>Heap Limit: <span>{performanceMetrics.jsHeapSizeLimit}MB</span></div>
            <div>DOM Load: <span>{performanceMetrics.domContentLoaded}ms</span></div>
            <div>TTFB: <span>{performanceMetrics.ttfb}ms</span></div>
            <div>Page Load: <span>{performanceMetrics.pageLoad}ms</span></div>
          </div>
        </div>

        <div className={styles.metricCard}>
          <h3>🌐 Network</h3>
          <div className={styles.metricList}>
            <div>Type: <span>{systemInfo.connection?.effectiveType || 'Unknown'}</span></div>
            <div>Speed: <span>{systemInfo.connection?.downlink || 'Unknown'}</span></div>
            <div>RTT: <span>{systemInfo.connection?.rtt || 'Unknown'}</span></div>
            <div>Requests: <span>{networkRequests.length}</span></div>
            <div>Errors: <span>{errorLogs.length}</span></div>
          </div>
        </div>

        <div className={styles.metricCard}>
          <h3>💾 Storage</h3>
          <div className={styles.metricList}>
            <div>LocalStorage: <span>{Object.keys(storageData.localStorage).length} items</span></div>
            <div>SessionStorage: <span>{Object.keys(storageData.sessionStorage).length} items</span></div>
            <div>Cookies: <span>{Object.keys(storageData.cookies).length} items</span></div>
            <div>Console Logs: <span>{consoleLogs.length}</span></div>
            <div>Event Listeners: <span>{eventListeners.length}</span></div>
          </div>
        </div>
      </div>

      {memoryUsage.length > 0 && (
        <div className={styles.chartContainer}>
          <h3>📊 Memory Usage Over Time</h3>
          <div className={styles.memoryChart}>
            {memoryUsage.map((point, index) => (
              <div 
                key={index} 
                className={styles.chartBar}
                style={{ 
                  height: `${(point.usage / Math.max(...memoryUsage.map(p => p.usage))) * 100}%`,
                  backgroundColor: point.usage > 50 ? '#ff6b6b' : point.usage > 25 ? '#ffd93d' : '#6bcf7f'
                }}
                title={`${point.time}: ${point.usage}MB`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const ConsoleTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h3>🖥️ Console Logs ({consoleLogs.length})</h3>
        <div className={styles.tabActions}>
          <button onClick={() => clearLogs('console')} className={styles.clearBtn}>
            🗑️ Clear
          </button>
          <button onClick={() => exportData('console')} className={styles.exportBtn}>
            💾 Export
          </button>
        </div>
      </div>
      <div className={styles.consoleContainer}>
        {consoleLogs.map(log => (
          <div key={log.id} className={`${styles.consoleLog} ${styles[log.type]}`}>
            <span className={styles.timestamp}>{log.timestamp}</span>
            <span className={styles.logType}>{log.type.toUpperCase()}</span>
            <span className={styles.logMessage}>{log.message}</span>
          </div>
        ))}
        {consoleLogs.length === 0 && (
          <div className={styles.emptyState}>
            <span>📝 No console logs yet. Try console.log('Hello Dev Tools!');</span>
          </div>
        )}
      </div>
    </div>
  );

  const NetworkTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h3>🌐 Network Requests ({networkRequests.length})</h3>
        <div className={styles.tabActions}>
          <button onClick={() => clearLogs('network')} className={styles.clearBtn}>
            🗑️ Clear
          </button>
          <button onClick={() => exportData('network')} className={styles.exportBtn}>
            💾 Export
          </button>
        </div>
      </div>
      <div className={styles.networkContainer}>
        <div className={styles.networkHeader}>
          <div>Method</div>
          <div>Status</div>
          <div>URL</div>
          <div>Duration</div>
          <div>Size</div>
          <div>Time</div>
        </div>
        {networkRequests.map(request => (
          <div key={request.id} className={`${styles.networkRequest} ${styles[request.status < 400 ? 'success' : 'error']}`}>
            <div className={styles.method}>{request.method}</div>
            <div className={styles.status}>{request.status}</div>
            <div className={styles.url} title={request.url}>
              {request.url.length > 50 ? request.url.substring(0, 50) + '...' : request.url}
            </div>
            <div className={styles.duration}>{request.duration}ms</div>
            <div className={styles.size}>{request.size}</div>
            <div className={styles.timestamp}>{request.timestamp}</div>
          </div>
        ))}
        {networkRequests.length === 0 && (
          <div className={styles.emptyState}>
            <span>🌐 No network requests captured yet.</span>
          </div>
        )}
      </div>
    </div>
  );

  const StorageTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h3>💾 Storage Inspector</h3>
        <button onClick={() => exportData('storage')} className={styles.exportBtn}>
          💾 Export All
        </button>
      </div>
      
      <div className={styles.storageSection}>
        <h4>🏠 Local Storage ({Object.keys(storageData.localStorage).length})</h4>
        <div className={styles.storageGrid}>
          {Object.entries(storageData.localStorage).map(([key, value]) => (
            <div key={key} className={styles.storageItem}>
              <div className={styles.storageKey}>{key}</div>
              <div className={styles.storageValue}>{String(value).substring(0, 100)}...</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.storageSection}>
        <h4>📋 Session Storage ({Object.keys(storageData.sessionStorage).length})</h4>
        <div className={styles.storageGrid}>
          {Object.entries(storageData.sessionStorage).map(([key, value]) => (
            <div key={key} className={styles.storageItem}>
              <div className={styles.storageKey}>{key}</div>
              <div className={styles.storageValue}>{String(value).substring(0, 100)}...</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.storageSection}>
        <h4>🍪 Cookies ({Object.keys(storageData.cookies).length})</h4>
        <div className={styles.storageGrid}>
          {Object.entries(storageData.cookies).map(([key, value]) => (
            <div key={key} className={styles.storageItem}>
              <div className={styles.storageKey}>{key}</div>
              <div className={styles.storageValue}>{String(value).substring(0, 100)}...</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ✅ NEW SECTIONS

  const ErrorsTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h3>🐛 JavaScript Errors ({errorLogs.length})</h3>
        <div className={styles.tabActions}>
          <button onClick={() => clearLogs('errors')} className={styles.clearBtn}>
            🗑️ Clear
          </button>
          <button onClick={() => exportData('errors')} className={styles.exportBtn}>
            💾 Export
          </button>
        </div>
      </div>
      <div className={styles.errorContainer}>
        {errorLogs.map(error => (
          <div key={error.id} className={styles.errorItem}>
            <div className={styles.errorHeader}>
              <span className={styles.errorTime}>{error.timestamp}</span>
              <span className={styles.errorFile}>{error.filename}:{error.lineno}:{error.colno}</span>
            </div>
            <div className={styles.errorMessage}>{error.message}</div>
            {error.stack && (
              <div className={styles.errorStack}>
                <details>
                  <summary>Stack Trace</summary>
                  <pre>{error.stack}</pre>
                </details>
              </div>
            )}
          </div>
        ))}
        {errorLogs.length === 0 && (
          <div className={styles.emptyState}>
            <span>🎉 No JavaScript errors detected!</span>
          </div>
        )}
      </div>
    </div>
  );

  const LighthouseTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h3>🏆 Performance Audit</h3>
        <button onClick={() => exportData('lighthouse')} className={styles.exportBtn}>
          💾 Export Report
        </button>
      </div>
      
      <div className={styles.lighthouseGrid}>
        {Object.entries(lighthouseMetrics).map(([key, score]) => (
          <div key={key} className={styles.lighthouseMetric}>
            <div className={styles.lighthouseScore} style={{
              color: score >= 90 ? '#0cce6b' : score >= 70 ? '#ffa400' : '#ff5722'
            }}>
              {score}
            </div>
            <div className={styles.lighthouseLabel}>
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </div>
            <div className={styles.lighthouseBar}>
              <div 
                className={styles.lighthouseProgress}
                style={{ 
                  width: `${score}%`,
                  backgroundColor: score >= 90 ? '#0cce6b' : score >= 70 ? '#ffa400' : '#ff5722'
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className={styles.performanceRecommendations}>
        <h4>🚀 Performance Recommendations</h4>
        <div className={styles.recommendationList}>
          <div className={styles.recommendation}>
            <span className={styles.recommendationIcon}>⚡</span>
            <span>Minimize main thread work</span>
          </div>
          <div className={styles.recommendation}>
            <span className={styles.recommendationIcon}>📦</span>
            <span>Reduce bundle size</span>
          </div>
          <div className={styles.recommendation}>
            <span className={styles.recommendationIcon}>🖼️</span>
            <span>Optimize images</span>
          </div>
          <div className={styles.recommendation}>
            <span className={styles.recommendationIcon}>🔄</span>
            <span>Implement code splitting</span>
          </div>
        </div>
      </div>
    </div>
  );

  const SEOTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h3>🔍 SEO Analysis</h3>
        <button onClick={() => exportData('seo')} className={styles.exportBtn}>
          💾 Export Report
        </button>
      </div>
      
      <div className={styles.seoGrid}>
        <div className={styles.seoCard}>
          <h4>📄 Meta Information</h4>
          <div className={styles.seoItem}>
            <span className={styles.seoLabel}>Title:</span>
            <span className={styles.seoValue}>{seoData.title}</span>
          </div>
          <div className={styles.seoItem}>
            <span className={styles.seoLabel}>Description:</span>
            <span className={styles.seoValue}>{seoData.description}</span>
          </div>
          <div className={styles.seoItem}>
            <span className={styles.seoLabel}>Keywords:</span>
            <span className={styles.seoValue}>{seoData.keywords}</span>
          </div>
        </div>

        <div className={styles.seoCard}>
          <h4>📐 Content Structure</h4>
          {Object.entries(seoData.headings || {}).map(([tag, count]) => (
            <div key={tag} className={styles.seoItem}>
              <span className={styles.seoLabel}>{tag.toUpperCase()}:</span>
              <span className={styles.seoValue}>{count}</span>
            </div>
          ))}
        </div>

        <div className={styles.seoCard}>
          <h4>🔗 Links & Media</h4>
          <div className={styles.seoItem}>
            <span className={styles.seoLabel}>Total Links:</span>
            <span className={styles.seoValue}>{seoData.links}</span>
          </div>
          <div className={styles.seoItem}>
            <span className={styles.seoLabel}>External Links:</span>
            <span className={styles.seoValue}>{seoData.externalLinks}</span>
          </div>
          <div className={styles.seoItem}>
            <span className={styles.seoLabel}>Images:</span>
            <span className={styles.seoValue}>{seoData.images}</span>
          </div>
          <div className={styles.seoItem}>
            <span className={styles.seoLabel}>Images w/o Alt:</span>
            <span className={styles.seoValue} style={{color: seoData.imagesWithoutAlt > 0 ? '#ff5722' : '#0cce6b'}}>
              {seoData.imagesWithoutAlt}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const DesignTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h3>🎨 Design System</h3>
        <button onClick={() => exportData('design')} className={styles.exportBtn}>
          💾 Export Palette
        </button>
      </div>
      
      <div className={styles.designSection}>
        <h4>🌈 Color Palette ({colorPalette.length})</h4>
        <div className={styles.colorGrid}>
          {colorPalette.map((color, index) => (
            <div key={index} className={styles.colorItem}>
              <div 
                className={styles.colorSwatch}
                style={{ backgroundColor: color }}
                title={color}
              />
              <div className={styles.colorValue}>{color}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.designSection}>
        <h4>📝 Typography ({fontData.length})</h4>
        <div className={styles.fontGrid}>
          {fontData.map((font, index) => (
            <div key={index} className={styles.fontItem}>
              <div className={styles.fontName} style={{fontFamily: font}}>
                {font}
              </div>
              <div className={styles.fontSample} style={{fontFamily: font}}>
                The quick brown fox jumps over the lazy dog
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.designSection}>
        <h4>🎯 Event Listeners ({eventListeners.length})</h4>
        <div className={styles.eventGrid}>
          {eventListeners.map((listener, index) => (
            <div key={index} className={styles.eventItem}>
              <div className={styles.eventType}>{listener.event}</div>
              <div className={styles.eventCount}>{listener.count} elements</div>
              <div className={styles.eventElements}>
                {listener.elements.join(', ')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: '📊 Overview', component: OverviewTab },
    { id: 'console', label: '🖥️ Console', component: ConsoleTab },
    { id: 'network', label: '🌐 Network', component: NetworkTab },
    { id: 'storage', label: '💾 Storage', component: StorageTab },
    { id: 'errors', label: '🐛 Errors', component: ErrorsTab },
    { id: 'lighthouse', label: '🏆 Audit', component: LighthouseTab },
    { id: 'seo', label: '🔍 SEO', component: SEOTab },
    { id: 'design', label: '🎨 Design', component: DesignTab }
  ];

  if (!isOpen) return null;

  return (
    <div className={styles.container}>
      {/* Grid Overlay */}
      <div className={styles.gridOverlay} />

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.icon}>🔧</span>
          <span className={styles.title}>Developer Dashboard</span>
          <span className={styles.status}>{isMonitoring ? 'MONITORING' : 'IDLE'}</span>
          <span className={styles.versionBadge}>v4.0</span>
        </div>
        <button className={styles.closeButton} onClick={onClose}>
          ✕ EXIT
        </button>
      </div>

      <div className={styles.tabNav}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {tabs.find(tab => tab.id === activeTab)?.component()}
      </div>
    </div>
  );
};

export default DevTools;
