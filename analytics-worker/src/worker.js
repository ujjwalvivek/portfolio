// Cloudflare Worker for privacy-focused analytics collection
// Deploy this to analytics-api.yourdomain.com

// CORS headers - dynamic based on request origin
function getCorsHeaders(request) {
  const origin = request.headers.get('Origin');
  console.log('Request origin:', origin);
  
  const allowedOrigins = [
    'https://ujjwalvivek.com',
    'https://www.ujjwalvivek.com',
    'https://cdn.ujjwalvivek.com',
    'https://analytics.ujjwalvivek.com',
    'http://localhost:3000',
    'http://localhost:3001',
  ];
  
  // If origin is in allowed list, use it; otherwise allow all for now
  const allowOrigin = allowedOrigins.includes(origin) ? origin : '*';
  console.log('Allowing origin:', allowOrigin);
  
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false',
  };
}

// Default CORS headers for backwards compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow all origins for analytics collection
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  'Access-Control-Max-Age': '86400',
};

// Hash IP address for privacy (one-way hash)
async function hashIP(ip) {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + 'your-secret-salt-here');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

// Validate and clean event data
function validateEvent(event) {
  const allowedTypes = ['pageview', 'blog_engagement', 'search', 'error', 'time_spent'];
  
  if (!event.type || !allowedTypes.includes(event.type)) {
    throw new Error('Invalid event type');
  }

  if (!event.timestamp || isNaN(event.timestamp)) {
    throw new Error('Invalid timestamp');
  }

  // Sanitize string fields
  if (event.path) event.path = event.path.substring(0, 200);
  if (event.title) event.title = event.title.substring(0, 200);
  if (event.referrer) event.referrer = event.referrer.substring(0, 100);
  if (event.query) event.query = event.query.substring(0, 100);
  
  return event;
}

// Validate API key for dashboard access
function validateApiKey(request, env) {
  const authHeader = request.headers.get('Authorization');
  console.log('Auth header received:', authHeader ? 'Present' : 'Missing');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Invalid auth header format');
    return false;
  }
  
  const apiKey = authHeader.substring(7); // Remove "Bearer " prefix
  console.log('API key received:', apiKey ? `${apiKey.substring(0, 8)}...` : 'Empty');
  
  // Use the secret API key from Cloudflare Workers environment
  const validApiKey = env.ANALYTICS_API_KEY;
  console.log('Valid API key configured:', validApiKey ? 'Yes' : 'No');
  
  const isValid = apiKey === validApiKey;
  console.log('API key validation result:', isValid);
  
  return isValid;
}

// Store event in R2 bucket (organized by date)
async function storeEvent(event, env) {
  const now = new Date();
  //const eventDate = new Date(event.timestamp);
  
  console.log('=== DATE DEBUG ===');
  console.log('Current server time (UTC):', now.toISOString());
  
  // Convert UTC to IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
  const istTime = new Date(now.getTime() + istOffset);
  
  console.log('IST time:', istTime.toISOString());
  console.log('IST date for folder:', istTime.toISOString().split('T')[0]);
  
  // Use IST date for partitioning
  const dateStr = istTime.toISOString().split('T')[0]; // YYYY-MM-DD in IST
  const hour = istTime.getUTCHours().toString().padStart(2, '0'); // IST hour
  
  console.log('FINAL date folder:', dateStr, 'hour:', hour);
  console.log('Expected folder: analytics/' + dateStr + '/' + hour + '/');
  
  // Store in R2 with IST-based date partitioning
  const key = `analytics/${dateStr}/${hour}/${event.sessionId}-${Date.now()}.json`;
  
  console.log('Storing event:', event.type, 'with key:', key);
  
  await env.analytics_data.put(key, JSON.stringify(event), {
    httpMetadata: {
      contentType: 'application/json',
    },
    customMetadata: {
      eventType: event.type,
      date: dateStr,
    },
  });
  
  console.log('Event stored successfully:', key);
}

// Rate limiting using Durable Objects or KV
async function isRateLimited(hashedIP, env) {
  const key = `rate_limit:${hashedIP}`;
  const current = await env.ANALYTICS_KV.get(key);
  
  if (!current) {
    // First request, allow and set counter
    await env.ANALYTICS_KV.put(key, '1', { expirationTtl: 60 }); // 1 minute window
    return false;
  }
  
  const count = parseInt(current);
  if (count >= 60) { // Increased from 30 to 60 events per minute per IP to handle search better
    return true;
  }
  
  await env.ANALYTICS_KV.put(key, (count + 1).toString(), { expirationTtl: 60 });
  return false;
}

async function handleDashboardData(request, env, dynamicCorsHeaders = corsHeaders) {
  try {
    // Validate API key for dashboard access
    if (!validateApiKey(request, env)) {
      return new Response('Unauthorized', { 
        status: 401,
        headers: dynamicCorsHeaders 
      });
    }

    // Get query parameters
    const url = new URL(request.url);
    const range = url.searchParams.get('range') || '7d';
    
    // Calculate date range
    // Convert UTC to IST (UTC+5:30) for date calculations
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(new Date().getTime() + istOffset);
    
    const now = new Date();
    const endDate = new Date();
    const startDate = new Date();
    
    console.log('Request range:', range);
    console.log('Current UTC time:', now.toISOString());
    console.log('Current IST time:', istNow.toISOString());
    
    switch (range) {
      case 'today':
        // Today in IST
        const todayStartIST = new Date(istNow);
        todayStartIST.setUTCHours(0, 0, 0, 0);
        const todayEndIST = new Date(istNow);
        todayEndIST.setUTCHours(23, 59, 59, 999);
        
        startDate.setTime(todayStartIST.getTime() - istOffset);
        endDate.setTime(todayEndIST.getTime() - istOffset);
        break;
      case 'yesterday':
        // Yesterday in IST
        const yesterdayIST = new Date(istNow);
        yesterdayIST.setUTCDate(yesterdayIST.getUTCDate() - 1);
        
        const yesterdayStartIST = new Date(yesterdayIST);
        yesterdayStartIST.setUTCHours(0, 0, 0, 0);
        const yesterdayEndIST = new Date(yesterdayIST);
        yesterdayEndIST.setUTCHours(23, 59, 59, 999);
        
        startDate.setTime(yesterdayStartIST.getTime() - istOffset);
        endDate.setTime(yesterdayEndIST.getTime() - istOffset);
        break;
      case '1d':
        // Last 24 hours from IST time
        startDate.setTime(istNow.getTime() - 24 * 60 * 60 * 1000 - istOffset);
        endDate.setTime(istNow.getTime() - istOffset);
        break;
      case '7d':
        // Last 7 days from IST time (including today, so start from 6 days ago)
        const sevenDaysAgoIST = new Date(istNow);
        sevenDaysAgoIST.setUTCDate(sevenDaysAgoIST.getUTCDate() - 6);
        sevenDaysAgoIST.setUTCHours(0, 0, 0, 0);
        
        startDate.setTime(sevenDaysAgoIST.getTime() - istOffset);
        endDate.setTime(istNow.getTime() - istOffset);
        break;
      case '30d':
        // Last 30 days from IST time
        const thirtyDaysAgoIST = new Date(istNow);
        thirtyDaysAgoIST.setUTCDate(thirtyDaysAgoIST.getUTCDate() - 30);
        thirtyDaysAgoIST.setUTCHours(0, 0, 0, 0);
        
        startDate.setTime(thirtyDaysAgoIST.getTime() - istOffset);
        endDate.setTime(istNow.getTime() - istOffset);
        break;
      default:
        // Default to last 7 days in IST (including today, so start from 6 days ago)
        const defaultSevenDaysAgoIST = new Date(istNow);
        defaultSevenDaysAgoIST.setUTCDate(defaultSevenDaysAgoIST.getUTCDate() - 6);
        defaultSevenDaysAgoIST.setUTCHours(0, 0, 0, 0);
        
        startDate.setTime(defaultSevenDaysAgoIST.getTime() - istOffset);
        endDate.setTime(istNow.getTime() - istOffset);
    }
    
    console.log('Calculated date range:', startDate.toISOString(), 'to', endDate.toISOString());

    // Get analytics data from R2
    const analyticsData = await getAnalyticsFromR2(env, startDate, endDate);
    
    return new Response(JSON.stringify(analyticsData), {
      headers: {
        ...dynamicCorsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    console.error('Error stack:', error.stack);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch analytics data', 
      details: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: {
        ...dynamicCorsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}

async function getAnalyticsFromR2(env, startDate, endDate) {
  console.log('Getting analytics data from R2...');
  console.log('Date range:', startDate, 'to', endDate);
  
  const events = [];
  let filteredEvents = []; // Declare outside try block
  
  // Try to get data from R2 for the date range
  try {
    // Get data from multiple days to ensure we capture events
    // Convert UTC dates back to IST for folder structure matching
    const istOffset = 5.5 * 60 * 60 * 1000;
    const dates = [];
    const currentDate = new Date(startDate.getTime() + istOffset);
    const endDateIST = new Date(endDate.getTime() + istOffset);
    
    while (currentDate <= endDateIST) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    
    console.log('Searching IST dates:', dates);
    
    for (const dateStr of dates) {
      const prefix = `analytics/${dateStr}/`;
      console.log('Listing R2 objects with prefix:', prefix);
      
      const list = await env.analytics_data.list({ prefix, limit: 1000 });
      console.log(`Found ${list.objects.length} objects for date ${dateStr}`);
      
      for (const object of list.objects) {
        try {
          const eventData = await env.analytics_data.get(object.key);
          if (eventData) {
            const eventText = await eventData.text();
            const event = JSON.parse(eventText);
            events.push(event);
          }
        } catch (e) {
          console.error('Error parsing event:', object.key, e);
          // Skip invalid events
          continue;
        }
      }
    }
    
    console.log('Total events loaded:', events.length);
    console.log('Event types:', events.map(e => e.type));
    
    // Filter events by date range
    filteredEvents = events.filter(event => {
      const eventDate = new Date(event.timestamp);
      const isInRange = eventDate >= startDate && eventDate <= endDate;
      if (!isInRange) {
        console.log(`Event ${event.type} at ${eventDate.toISOString()} outside range ${startDate.toISOString()} - ${endDate.toISOString()}`);
      }
      return isInRange;
    });
    
    console.log('Filtered events by date range:', filteredEvents.length);
    console.log('Date range filter:', startDate.toISOString(), 'to', endDate.toISOString());
    
  } catch (error) {
    console.error('Error reading from R2:', error);
  }

  // Process events into dashboard data (use filtered events)
  const pageViews = filteredEvents.filter(e => e.type === 'pageview');
  const blogEvents = filteredEvents.filter(e => e.type === 'blog_engagement');
  const timeSpentEvents = filteredEvents.filter(e => e.type === 'time_spent');
  const searchEvents = filteredEvents.filter(e => e.type === 'search');  // Calculate metrics
  const totalViews = pageViews.length;
  const uniqueVisitors = new Set(pageViews.map(e => e.hashedIP || e.sessionId)).size;
  
  console.log('Debug - Page views:', totalViews);
  console.log('Debug - Unique IPs found:', pageViews.map(e => e.hashedIP || e.sessionId));
  console.log('Debug - Time spent events:', timeSpentEvents.length);
  console.log('Debug - Blog events:', blogEvents.length);
  console.log('Debug - Search events:', searchEvents.length);
  
  // Calculate average session duration from time_spent events
  let avgSessionDuration = 0; // Start with 0, not 45
  if (timeSpentEvents.length > 0) {
    const totalDuration = timeSpentEvents.reduce((sum, event) => {
      const duration = parseInt(event.timeSpent) || 0; // Fix: use timeSpent instead of duration
      console.log('Debug - Event timeSpent:', duration);
      return sum + duration;
    }, 0);
    avgSessionDuration = Math.round(totalDuration / timeSpentEvents.length);
    console.log('Debug - Calculated avg session:', avgSessionDuration);
  }
  
  const blogReads = blogEvents.filter(e => e.action === 'read_start').length;
  const totalSearches = searchEvents.length;

  // Process search analytics
  const searchTermCounts = {};
  searchEvents.forEach(event => {
    const query = event.query || '';
    if (query.length > 0) {
      searchTermCounts[query] = (searchTermCounts[query] || 0) + 1;
    }
  });

  const topSearchTerms = Object.entries(searchTermCounts)
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count);
    // Removed .slice(0, 10) to let frontend handle pagination

  // Group page views by path
  const pageViewsByPath = {};
  pageViews.forEach(event => {
    const path = event.path || '/';
    pageViewsByPath[path] = (pageViewsByPath[path] || 0) + 1;
  });

  // Get top pages with better title mapping
  const getPageTitle = (path) => {
    if (path === '/') return 'Home';
    if (path === '/about') return 'About';
    if (path === '/projects') return 'Projects';
    if (path === '/blog') return 'Blog List';
    if (path === '/chat') return 'Chat';
    if (path.startsWith('/blog/')) {
      // Extract blog post title or use filename
      const filename = path.replace('/blog/', '');
      return filename.replace('.md', '').replace(/_/g, ' ');
    }
    // Default: clean up the path
    return path.replace('/', '').replace(/-/g, ' ').replace(/_/g, ' ') || 'Unknown Page';
  };

  const topPages = Object.entries(pageViewsByPath)
    .map(([path, views]) => ({
      path,
      title: getPageTitle(path),
      views
    }))
    .sort((a, b) => b.views - a.views);
    // Removed .slice(0, 10) to let frontend handle pagination

  // Generate page views over time based on the selected range
  const pageViewsOverTime = [];
  const rangeDays = Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000));
  const daysToShow = Math.min(rangeDays, 30); // Cap at 30 days for chart readability
  
  for (let i = daysToShow - 1; i >= 0; i--) {
    const date = new Date(endDate);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayViews = pageViews.filter(e => 
      new Date(e.timestamp).toISOString().split('T')[0] === dateStr
    ).length;
    pageViewsOverTime.push({
      date: dateStr,
      views: dayViews
    });
  }

  // Traffic sources
  const referrerCounts = {};
  pageViews.forEach(event => {
    const referrer = event.referrer || 'direct';
    referrerCounts[referrer] = (referrerCounts[referrer] || 0) + 1;
  });

  const totalReferrers = Object.values(referrerCounts).reduce((a, b) => a + b, 0);
  const trafficSources = Object.entries(referrerCounts)
    .map(([source, count]) => ({
      source,
      percentage: totalReferrers > 0 ? Math.round((count / totalReferrers) * 100) : 0
    }))
    .sort((a, b) => b.percentage - a.percentage);
    // Removed .slice(0, 5) to let frontend handle pagination

  // Calculate blog performance (remove completion rate and avg read time)
  const blogPerformance = [];
  const blogPostStats = {};
  
  // Group blog events by post ID
  blogEvents.forEach(event => {
    const postId = event.postId;
    if (!blogPostStats[postId]) {
      blogPostStats[postId] = {
        id: postId,
        title: event.data?.title || postId,
        views: 0, // Count read_start as views
        likes: 0,
        shares: 0
      };
    }
    
    const stats = blogPostStats[postId];
    switch (event.action) {
      case 'read_start':
        stats.views++; // Changed from reads to views for clarity
        break;
      case 'like':
        stats.likes++;
        break;
      case 'share':
        stats.shares++;
        break;
      default:
        // Handle unknown action types
        break;
    }
  });
  
  // Convert to array and sort by views
  Object.values(blogPostStats).forEach(stats => {
    blogPerformance.push(stats);
  });
  
  blogPerformance.sort((a, b) => b.views - a.views);

  // Calculate period-over-period changes (use filtered events)
  const calculatePeriodChanges = (currentEvents, startDate, endDate) => {
    const currentPeriodMs = endDate.getTime() - startDate.getTime();
    const previousPeriodEnd = new Date(startDate.getTime());
    const previousPeriodStart = new Date(startDate.getTime() - currentPeriodMs);
    
    console.log('Period comparison:', {
      current: `${startDate.toISOString()} - ${endDate.toISOString()}`,
      previous: `${previousPeriodStart.toISOString()} - ${previousPeriodEnd.toISOString()}`
    });
    
    const previousEvents = currentEvents.filter(e => {
      const eventTime = new Date(e.timestamp).getTime();
      return eventTime >= previousPeriodStart.getTime() && eventTime < previousPeriodEnd.getTime();
    });
    
    const currentViews = currentEvents.filter(e => e.type === 'pageview').length;
    const previousViews = previousEvents.filter(e => e.type === 'pageview').length;
    
    const currentVisitors = new Set(currentEvents.filter(e => e.type === 'pageview').map(e => e.sessionId)).size;
    const previousVisitors = new Set(previousEvents.filter(e => e.type === 'pageview').map(e => e.sessionId)).size;
    
    const currentBlogReads = currentEvents.filter(e => e.type === 'blog_engagement' && e.action === 'read_start').length;
    const previousBlogReads = previousEvents.filter(e => e.type === 'blog_engagement' && e.action === 'read_start').length;
    
    const currentSearches = currentEvents.filter(e => e.type === 'search').length;
    const previousSearches = previousEvents.filter(e => e.type === 'search').length;
    
    // Calculate time spent for current period
    const currentTimeSpentEvents = currentEvents.filter(e => e.type === 'time_spent');
    const currentAvgSession = currentTimeSpentEvents.length > 0 
      ? currentTimeSpentEvents.reduce((sum, e) => sum + (parseInt(e.timeSpent) || 0), 0) / currentTimeSpentEvents.length 
      : 0;
    
    // Calculate time spent for previous period
    const previousTimeSpentEvents = previousEvents.filter(e => e.type === 'time_spent');
    const previousAvgSession = previousTimeSpentEvents.length > 0 
      ? previousTimeSpentEvents.reduce((sum, e) => sum + (parseInt(e.timeSpent) || 0), 0) / previousTimeSpentEvents.length 
      : 0;
    
    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };
    
    return {
      viewsChange: calculateChange(currentViews, previousViews),
      visitorsChange: calculateChange(currentVisitors, previousVisitors),
      sessionChange: calculateChange(currentAvgSession, previousAvgSession),
      blogReadsChange: calculateChange(currentBlogReads, previousBlogReads),
      searchChange: calculateChange(currentSearches, previousSearches)
    };
  };

  const changes = calculatePeriodChanges(filteredEvents, startDate, endDate);

  // Calculate total blog engagement metrics
  const totalBlogViews = blogPerformance.reduce((sum, post) => sum + post.views, 0);
  const totalBlogLikes = blogPerformance.reduce((sum, post) => sum + post.likes, 0);
  const totalBlogShares = blogPerformance.reduce((sum, post) => sum + post.shares, 0);

  console.log('Debug - Total blog views:', totalBlogViews);
  console.log('Debug - Total blog likes:', totalBlogLikes);
  console.log('Debug - Total blog shares:', totalBlogShares);
  console.log('Debug - Blog performance array:', blogPerformance);

  return {
    totalViews,
    uniqueVisitors,
    avgSessionDuration,
    blogReads,
    totalSearches,
    totalBlogViews,
    totalBlogLikes, 
    totalBlogShares,
    viewsChange: changes.viewsChange,
    visitorsChange: changes.visitorsChange,
    sessionChange: changes.sessionChange,
    blogReadsChange: changes.blogReadsChange,
    searchChange: changes.searchChange,
    pageViewsOverTime,
    topPages,
    blogPerformance,
    trafficSources,
    topSearchTerms
  };
}

// Handle blog like count requests
async function handleBlogLikeCount(request, env, dynamicCorsHeaders = corsHeaders) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    
    // Extract post ID from /api/blog/{postId}/likes
    if (pathParts.length !== 5 || pathParts[1] !== 'api' || pathParts[2] !== 'blog' || pathParts[4] !== 'likes') {
      return new Response('Invalid blog likes endpoint format', { 
        status: 400,
        headers: dynamicCorsHeaders 
      });
    }
    
    const postId = decodeURIComponent(pathParts[3]);
    console.log('Fetching like count for post:', postId);
    
    // Query R2 for blog engagement events for this post
    const bucket = env.ANALYTICS_BUCKET;
    if (!bucket) {
      console.error('R2 bucket not configured');
      return new Response(JSON.stringify({ likes: 0, error: 'Storage not configured' }), { 
        headers: { 
          'Content-Type': 'application/json',
          ...dynamicCorsHeaders 
        } 
      });
    }
    
    // List all analytics files to find blog engagement events
    let likeCount = 0;
    try {
      const objects = await bucket.list({ prefix: 'analytics/' });
      
      for (const obj of objects.objects) {
        try {
          const eventFile = await bucket.get(obj.key);
          if (eventFile) {
            const eventText = await eventFile.text();
            const events = eventText.split('\n').filter(line => line.trim());
            
            for (const eventLine of events) {
              try {
                const event = JSON.parse(eventLine);
                
                // Count 'like' events for this specific post
                if (event.type === 'blog_engagement' && 
                    event.action === 'like' && 
                    event.postId === postId) {
                  likeCount++;
                }
              } catch (parseError) {
                // Skip invalid JSON lines
                continue;
              }
            }
          }
        } catch (fileError) {
          // Skip files we can't read
          console.log('Could not read file:', obj.key, fileError.message);
          continue;
        }
      }
    } catch (listError) {
      console.error('Error querying R2 for like count:', listError);
      // Return 0 likes if we can't query the storage
    }
    
    console.log(`Found ${likeCount} likes for post: ${postId}`);
    
    return new Response(JSON.stringify({ 
      likes: likeCount,
      postId: postId 
    }), { 
      headers: { 
        'Content-Type': 'application/json',
        ...dynamicCorsHeaders 
      } 
    });
    
  } catch (error) {
    console.error('Blog like count error:', error);
    return new Response(JSON.stringify({ 
      likes: 0, 
      error: 'Internal server error' 
    }), { 
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...dynamicCorsHeaders 
      } 
    });
  }
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const dynamicCorsHeaders = getCorsHeaders(request);
    
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: dynamicCorsHeaders });
    }

    // Route handling for analytics.ujjwalvivek.com/api
    if (url.pathname === '/api' && request.method === 'POST') {
      // Analytics data collection endpoint
      return handleAnalyticsCollection(request, env, dynamicCorsHeaders);
    } else if (url.pathname === '/api' && request.method === 'GET') {
      // Dashboard data endpoint - requires authentication
      console.log('Dashboard GET request received');
      return handleDashboardData(request, env, dynamicCorsHeaders);
    } else if (url.pathname === '/api/dashboard' && request.method === 'GET') {
      // Dashboard data endpoint (future feature)
      return new Response('Dashboard API endpoint', { headers: dynamicCorsHeaders });
    } else if (url.pathname.startsWith('/api/blog/') && url.pathname.endsWith('/likes') && request.method === 'GET') {
      // Blog like count endpoint
      return handleBlogLikeCount(request, env, dynamicCorsHeaders);
    } else {
      return new Response('Not found', { 
        status: 404,
        headers: dynamicCorsHeaders 
      });
    }
  }
};

async function handleAnalyticsCollection(request, env, dynamicCorsHeaders = corsHeaders) {
  try {
    // Get client IP for rate limiting
    const clientIP = request.headers.get('CF-Connecting-IP') || 
                    request.headers.get('X-Forwarded-For') || 
                    'unknown';
    
    const hashedIP = await hashIP(clientIP);
    
    // Check rate limit
    if (await isRateLimited(hashedIP, env)) {
      return new Response('Rate limited', { 
        status: 429,
        headers: dynamicCorsHeaders 
      });
    }

    // Parse and validate event
    const rawEvent = await request.json();
    const event = validateEvent(rawEvent);
    
    // Add server-side metadata
    event.hashedIP = hashedIP;
    event.serverTimestamp = Date.now();
    event.userAgent = request.headers.get('User-Agent')?.substring(0, 200) || 'unknown';
    event.country = request.cf?.country || 'unknown';
    
    // Store in R2
    await storeEvent(event, env);
    
    return new Response('OK', { 
      status: 200,
      headers: dynamicCorsHeaders 
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    return new Response('Internal error', { 
      status: 500,
      headers: dynamicCorsHeaders 
    });
  }
};

export default worker;