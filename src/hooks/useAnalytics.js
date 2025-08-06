import { useEffect, useRef, useState } from 'react';
import analytics from '../utils/analytics';

// Hook for tracking blog post reading behavior
export const useBlogAnalytics = (postId, postTitle) => {
  const [readingProgress, setReadingProgress] = useState(0);
  const [hasStartedReading, setHasStartedReading] = useState(false);
  const [hasCompletedReading, setHasCompletedReading] = useState(false);
  const startTimeRef = useRef(null);
  const lastProgressRef = useRef(0);

  useEffect(() => {
    if (!postId) return;

    // Track when user starts reading
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(100, Math.max(0, (scrollTop / docHeight) * 100));
      
      setReadingProgress(progress);

      // Mark as started reading when they scroll past 10%
      if (progress > 10 && !hasStartedReading) {
        setHasStartedReading(true);
        startTimeRef.current = Date.now();
        analytics.trackBlogEngagement(postId, 'read_start', {
          title: postTitle,
          progress: progress
        });
      }

      // Track progress milestones (25%, 50%, 75%, 90%)
      const milestones = [25, 50, 75, 90];
      const currentMilestone = milestones.find(m => 
        progress >= m && lastProgressRef.current < m
      );

      if (currentMilestone) {
        analytics.trackBlogEngagement(postId, 'read_progress', {
          title: postTitle,
          progress: currentMilestone,
          timeSpent: startTimeRef.current ? Date.now() - startTimeRef.current : 0
        });
        lastProgressRef.current = currentMilestone;
      }

      // Mark as completed when they reach 90%
      if (progress >= 90 && !hasCompletedReading) {
        setHasCompletedReading(true);
        analytics.trackBlogEngagement(postId, 'read_complete', {
          title: postTitle,
          progress: progress,
          timeSpent: startTimeRef.current ? Date.now() - startTimeRef.current : 0
        });
      }
    };

    // Throttle scroll events
    let throttleTimer;
    const throttledHandleScroll = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        handleScroll();
        throttleTimer = null;
      }, 100);
    };

    window.addEventListener('scroll', throttledHandleScroll);
    
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [postId, postTitle, hasStartedReading, hasCompletedReading]);

  // Function to track likes (can be called from like button)
  const trackLike = () => {
    analytics.trackBlogEngagement(postId, 'like', {
      title: postTitle,
      progress: readingProgress,
      timeSpent: startTimeRef.current ? Date.now() - startTimeRef.current : 0
    });
  };

  // Function to track shares
  const trackShare = (platform) => {
    analytics.trackBlogEngagement(postId, 'share', {
      title: postTitle,
      platform: platform,
      progress: readingProgress
    });
  };

  return {
    readingProgress: Math.round(readingProgress),
    hasStartedReading,
    hasCompletedReading,
    trackLike,
    trackShare
  };
};

// Hook for tracking page views
export const usePageAnalytics = () => {
  useEffect(() => {
    const path = window.location.pathname;
    const title = document.title;
    
    // Small delay to ensure page has loaded
    const timer = setTimeout(() => {
      analytics.trackPageView(path, title);
    }, 100);

    return () => clearTimeout(timer);
  }, []);
};

// Hook for tracking search analytics
export const useSearchAnalytics = () => {
  const trackSearch = (query, resultsCount) => {
    analytics.trackSearch(query, resultsCount);
  };

  return { trackSearch };
};
