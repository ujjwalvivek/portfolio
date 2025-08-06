import React, { useState, useEffect } from 'react';
import AnalyticsDashboard from './components/Analytics/AnalyticsDashboard';
import './App.css';

function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('analytics_api_key') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Test stored API key by making a quick API call
    if (apiKey) {
      fetch('https://analytics.ujjwalvivek.com/api?range=1d', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      })
      .then(response => {
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          // Invalid stored key, clear it
          localStorage.removeItem('analytics_api_key');
          setApiKey('');
        }
      })
      .catch(() => {
        // Network error, assume key is valid for now
        setIsAuthenticated(true);
      });
    }
  }, [apiKey]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const inputKey = e.target.apiKey.value;
    
    // Test the API key by making a request to the analytics API
    try {
      const response = await fetch('https://analytics.ujjwalvivek.com/api?range=1d', {
        headers: {
          'Authorization': `Bearer ${inputKey}`,
        },
      });
      
      if (response.ok) {
        localStorage.setItem('analytics_api_key', inputKey);
        setApiKey(inputKey);
        setIsAuthenticated(true);
      } else {
        alert('Invalid API key. Access denied.');
      }
    } catch (error) {
      alert('Failed to validate API key. Please check your connection.');
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
