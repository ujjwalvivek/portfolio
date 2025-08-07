import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import analytics from '../utils/analytics';

// Hook for tracking blog post reading behavior
export const useBlogAnalytics = (postId, postTitle) => {
  const [hasLiked, setHasLiked] = useState(false);
  const [hasShared, setHasShared] = useState(false);
  
  const hasStartedReadingRef = useRef(false);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (!postId || postTitle === 'Loading...') return;
    
    console.log('Blog analytics hook initialized for:', postId, postTitle);

    // Reset states when post changes
    hasStartedReadingRef.current = false;

    // Trigger read_start immediately when the post loads (simple page view)
    const triggerReadStart = () => {
      if (hasStartedReadingRef.current) return; // Prevent duplicate
      
      console.log('Triggering blog read event');
      hasStartedReadingRef.current = true;
      startTimeRef.current = Date.now();
      analytics.trackBlogEngagement(postId, 'read_start', {
        title: postTitle
      });
    };

    // Trigger read start after a brief delay to ensure page is loaded
    const initialTimer = setTimeout(triggerReadStart, 500);
    
    // Track time spent when user leaves the page
    const handleBeforeUnload = () => {
      if (startTimeRef.current) {
        const timeSpent = Date.now() - startTimeRef.current;
        console.log('Sending time spent event:', timeSpent);
        analytics.trackTimeSpent(window.location.pathname, timeSpent);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (initialTimer) clearTimeout(initialTimer);
    };
  }, [postId, postTitle]); // Only depend on postId and postTitle

  // Function to track likes (can be called from like button)
  const trackLike = () => {
    if (hasLiked) return; // Prevent multiple likes
    setHasLiked(true);
    analytics.trackBlogEngagement(postId, 'like', {
      title: postTitle,
      timeSpent: startTimeRef.current ? Date.now() - startTimeRef.current : 0
    });
  };

  // Function to track shares
  const trackShare = (platform = 'unknown') => {
    if (hasShared) {
      // Allow sharing again after 5 seconds
      return;
    }
    setHasShared(true);
    analytics.trackBlogEngagement(postId, 'share', {
      title: postTitle,
      platform: platform
    });
    // Reset share state after 5 seconds
    setTimeout(() => setHasShared(false), 5000);
  };

  return {
    hasStartedReading: hasStartedReadingRef.current,
    hasLiked,
    hasShared,
    trackLike,
    trackShare
  };
};

// Hook for tracking page views
export const usePageAnalytics = () => {
  const location = useLocation();
  
  useEffect(() => {
    const path = location.pathname;
    const title = document.title;
    
    console.log('Tracking page view:', path, title);
    
    // Small delay to ensure page has loaded
    const timer = setTimeout(() => {
      analytics.trackPageView(path, title);
    }, 100);

    return () => clearTimeout(timer);
  }, [location.pathname]); // Track changes to the current route
};

// Hook for tracking search analytics
export const useSearchAnalytics = () => {
  const trackSearch = (query, resultsCount) => {
    analytics.trackSearch(query, resultsCount);
  };

  return { trackSearch };
};
