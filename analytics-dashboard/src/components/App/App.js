import React, { useState, useEffect } from 'react';
import AnalyticsDashboard from '../Dashboard/AnalyticsDashboard';
import AuthScreen from '../Auth/AuthScreen';
import './App.css';

function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('analytics_api_key') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
        setIsLoading(false);
      })
      .catch(error => {
        console.error('API key test error:', error);
        // Network error - do NOT assume key is valid, clear it
        console.log('Network error during API key test, clearing stored key');
        localStorage.removeItem('analytics_api_key');
        setApiKey('');
        setIsAuthenticated(false);
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [apiKey]);

  const handleLogin = async (inputKey) => {
    console.log('Attempting login with API key...');
    setIsLoading(true);
    
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
        return { success: true };
      } else {
        const errorText = await response.text();
        console.error('Login failed:', response.status, errorText);
        return { success: false, error: `Invalid API key. Access denied. (${response.status})` };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Failed to validate API key. Please check your connection.' };
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('analytics_api_key');
    setApiKey('');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <AuthScreen onLogin={handleLogin} isLoading={isLoading} />;
  }

  return (
    <div className="app">
      <AnalyticsDashboard apiKey={apiKey} onLogout={handleLogout} />
    </div>
  );
}

export default App;
