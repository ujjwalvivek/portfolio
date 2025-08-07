import React, { useState, useEffect } from 'react';
import AnalyticsDashboard from './components/Analytics/AnalyticsDashboard';
import './App.css';

function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('analytics_api_key') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Test stored API key by making a quick API call
    if (apiKey) {
      console.log('Testing stored API key...');
      fetch('https://analytics.ujjwalvivek.com/api?range=1d', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      })
      .then(response => {
        console.log('API key test response:', response.status);
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          // Invalid stored key, clear it
          console.log('Stored API key invalid, clearing...');
          localStorage.removeItem('analytics_api_key');
          setApiKey('');
          setIsAuthenticated(false);
        }
      })
      .catch(error => {
        console.error('API key test error:', error);
        // Network error - do NOT assume key is valid, clear it
        console.log('Network error during API key test, clearing stored key');
        localStorage.removeItem('analytics_api_key');
        setApiKey('');
        setIsAuthenticated(false);
      });
    }
  }, [apiKey]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const inputKey = e.target.apiKey.value;
    
    console.log('Attempting login with API key...');
    
    // Test the API key by making a request to the analytics API
    try {
      const response = await fetch('https://analytics.ujjwalvivek.com/api?range=1d', {
        headers: {
          'Authorization': `Bearer ${inputKey}`,
        },
      });
      
      console.log('Login response status:', response.status);
      
      if (response.ok) {
        console.log('Login successful, storing API key');
        localStorage.setItem('analytics_api_key', inputKey);
        setApiKey(inputKey);
        setIsAuthenticated(true);
      } else {
        const errorText = await response.text();
        console.error('Login failed:', response.status, errorText);
        alert(`Invalid API key. Access denied. (${response.status})`);
      }
    } catch (error) {
      console.error('Login error:', error);
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
