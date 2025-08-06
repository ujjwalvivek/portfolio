// Privacy-focused analytics utility
// No cookies, no personal data, no tracking

class PrivacyAnalytics {
  constructor() {
    this.apiEndpoint = process.env.REACT_APP_ANALYTICS_API;
    this.enabled = process.env.NODE_ENV === 'production' && this.apiEndpoint;
    this.sessionId = this.generateSessionId();
    this.visitStartTime = Date.now();
  }

  // Generate ephemeral session ID (resets on page reload)
  generateSessionId() {
    return Math.random().toString(36).substring(2, 15);
  }

  // Get generalized device info (no fingerprinting)
  getDeviceInfo() {
    const width = window.screen.width;
    const height = window.screen.height;
    
    // Generalize screen sizes to prevent fingerprinting
    let deviceType = 'desktop';
    if (width <= 768) deviceType = 'mobile';
    else if (width <= 1024) deviceType = 'tablet';

    return {
      deviceType,
      viewport: `${Math.round(width/100)*100}x${Math.round(height/100)*100}`, // Rounded to nearest 100
      userAgent: navigator.userAgent.substring(0, 50), // Truncated for privacy
    };
  }

  // Clean referrer to remove personal info
  cleanReferrer(referrer) {
    if (!referrer) return 'direct';
    
    try {
      const url = new URL(referrer);
      const domain = url.hostname;
      
      // Remove query parameters and paths that might contain personal data
      if (domain.includes('google.com')) return 'google-search';
      if (domain.includes('github.com')) return 'github';
      if (domain.includes('twitter.com') || domain.includes('x.com')) return 'twitter';
      
      return domain;
    } catch {
      return 'unknown';
    }
  }

  // Track page view
  async trackPageView(path, title) {
    if (!this.enabled) return;

    const event = {
      type: 'pageview',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      path: path,
      title: title,
      referrer: this.cleanReferrer(document.referrer),
      ...this.getDeviceInfo()
    };

    this.sendEvent(event);
  }

  // Track blog post engagement
  async trackBlogEngagement(postId, action, data = {}) {
    if (!this.enabled) return;

    const event = {
      type: 'blog_engagement',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      postId: postId,
      action: action, // 'read_start', 'read_progress', 'read_complete', 'like'
      data: data
    };

    this.sendEvent(event);
  }

  // Track search queries (for improving content)
  async trackSearch(query, resultsCount) {
    if (!this.enabled) return;

    const event = {
      type: 'search',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      query: query.toLowerCase().trim().substring(0, 100), // Limit length
      resultsCount: resultsCount
    };

    this.sendEvent(event);
  }

  // Track errors (for debugging)
  async trackError(error, context) {
    if (!this.enabled) return;

    const event = {
      type: 'error',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      error: error.message.substring(0, 200),
      context: context,
      url: window.location.pathname
    };

    this.sendEvent(event);
  }

  // Send event to analytics API
  async sendEvent(event) {
    try {
      await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      // Silently fail - don't break the user experience
      console.debug('Analytics event failed:', error);
    }
  }

  // Track time spent on page (called on page unload)
  trackTimeSpent() {
    if (!this.enabled) return;

    const timeSpent = Date.now() - this.visitStartTime;
    
    const event = {
      type: 'time_spent',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      path: window.location.pathname,
      timeSpent: Math.round(timeSpent / 1000) // in seconds
    };

    // Use sendBeacon for reliable delivery on page unload
    if (navigator.sendBeacon) {
      navigator.sendBeacon(this.apiEndpoint, JSON.stringify(event));
    }
  }
}

// Create singleton instance
const analytics = new PrivacyAnalytics();

// Set up page unload tracking
window.addEventListener('beforeunload', () => {
  analytics.trackTimeSpent();
});

// Set up error tracking
window.addEventListener('error', (event) => {
  analytics.trackError(event.error, 'global_error');
});

export default analytics;
