import React, { useState, useEffect } from 'react';
import AnalyticsDashboard from './components/Analytics/AnalyticsDashboard';
import './App.css';

function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('analytics_api_key') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Simple authentication check
    if (apiKey && apiKey.length > 10) {
      setIsAuthenticated(true);
    }
  }, [apiKey]);

  const handleLogin = (e) => {
    e.preventDefault();
    const inputKey = e.target.apiKey.value;
    
    // Simple validation - in production, validate against your API
    if (inputKey && inputKey.length > 10) {
      localStorage.setItem('analytics_api_key', inputKey);
      setApiKey(inputKey);
      setIsAuthenticated(true);
    } else {
      alert('Invalid API key');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('analytics_api_key');
    setApiKey('');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>Analytics Dashboard</h1>
          <p>Enter your API key to access the dashboard</p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              name="apiKey"
              placeholder="API Key"
              required
              className="api-key-input"
            />
            <button type="submit" className="login-button">
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="logout-section">
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
      <AnalyticsDashboard apiKey={apiKey} />
    </div>
  );
}

export default App;
