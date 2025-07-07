import React, { useState, useEffect } from 'react';
import Loader from './Loader';

const LoadingSpinner = ({ children }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Loader />;
  }

  return children;
};

export default LoadingSpinner;