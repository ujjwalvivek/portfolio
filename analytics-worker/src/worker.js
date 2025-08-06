// Cloudflare Worker for privacy-focused analytics collection
// Deploy this to analytics-api.yourdomain.com

// CORS headers for your domain
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://analytics.ujjwalvivek.com',
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
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const apiKey = authHeader.substring(7); // Remove "Bearer " prefix
  
  // Use environment variable for API key (set in Cloudflare dashboard)
  const validApiKey = env.ANALYTICS_API_KEY;
  
  return apiKey === validApiKey;
}

// Store event in R2 bucket (organized by date)
async function storeEvent(event, env) {
  const date = new Date(event.timestamp);
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const hour = date.getUTCHours().toString().padStart(2, '0');
  
  // Store in R2 with date-based partitioning
  const key = `analytics/${dateStr}/${hour}/${event.sessionId}-${Date.now()}.json`;
  
  await env.analytics_data.put(key, JSON.stringify(event), {
    httpMetadata: {
      contentType: 'application/json',
    },
    customMetadata: {
      eventType: event.type,
      date: dateStr,
    },
  });
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
  if (count >= 30) { // Max 30 events per minute per IP
    return true;
  }
  
  await env.ANALYTICS_KV.put(key, (count + 1).toString(), { expirationTtl: 60 });
  return false;
}

async function handleDashboardData(request, env) {
  try {
    // Validate API key for dashboard access
    if (!validateApiKey(request, env)) {
      return new Response('Unauthorized', { 
        status: 401,
        headers: corsHeaders 
      });
    }

    // Get query parameters
    const url = new URL(request.url);
    const range = url.searchParams.get('range') || '7d';
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    switch (range) {
      case '1d':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }

    // Get analytics data from R2
    const analyticsData = await getAnalyticsFromR2(env, startDate, endDate);
    
    return new Response(JSON.stringify(analyticsData), {
      headers: {
        ...corsHeaders,
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
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}

async function getAnalyticsFromR2(env, startDate, endDate) {
  console.log('Getting analytics data from R2...');
  // For now, return minimal real data structure
  // You can expand this to actually read from R2 later
  const events = [];
  
  // Try to get some recent data from R2
  try {
    const today = new Date().toISOString().split('T')[0];
    const prefix = `analytics/${today}/`;
    console.log('Listing R2 objects with prefix:', prefix);
    
    const list = await env.analytics_data.list({ prefix, limit: 100 });
    console.log('Found objects:', list.objects.length);
    
    for (const object of list.objects) {
      try {
        const eventData = await env.analytics_data.get(object.key);
        if (eventData) {
          const eventText = await eventData.text();
          const event = JSON.parse(eventText);
          events.push(event);
        }
      } catch (e) {
        console.error('Error parsing event:', e);
        // Skip invalid events
        continue;
      }
    }
  } catch (error) {
    console.error('Error reading from R2:', error);
  }

  // Process events into dashboard data
  const pageViews = events.filter(e => e.type === 'pageview');
  const blogEvents = events.filter(e => e.type === 'blog_engagement');
  
  // Calculate metrics
  const totalViews = pageViews.length;
  const uniqueVisitors = new Set(pageViews.map(e => e.hashedIP)).size;
  const avgSessionDuration = 45; // Calculate from time_spent events
  const blogReads = blogEvents.filter(e => e.action === 'read_start').length;

  // Group page views by path
  const pageViewsByPath = {};
  pageViews.forEach(event => {
    const path = event.path || '/';
    pageViewsByPath[path] = (pageViewsByPath[path] || 0) + 1;
  });

  // Get top pages
  const topPages = Object.entries(pageViewsByPath)
    .map(([path, views]) => ({
      path,
      title: path === '/' ? 'Home' : path.replace('/blog/', '').replace('/', ''),
      views
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  // Generate page views over time (last 7 days)
  const pageViewsOverTime = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
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
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);

  return {
    totalViews,
    uniqueVisitors,
    avgSessionDuration,
    blogReads,
    viewsChange: 0, // Calculate from previous period
    visitorsChange: 0,
    sessionChange: 0,
    blogReadsChange: 0,
    pageViewsOverTime,
    topPages,
    blogPerformance: [], // Calculate from blog events
    trafficSources
  };
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Route handling for analytics.ujjwalvivek.com/api
    if (url.pathname === '/api' && request.method === 'POST') {
      // Analytics data collection endpoint
      return handleAnalyticsCollection(request, env);
    } else if (url.pathname === '/api' && request.method === 'GET') {
      // Dashboard data endpoint
      return handleDashboardData(request, env);
    } else if (url.pathname === '/api/dashboard' && request.method === 'GET') {
      // Dashboard data endpoint (future feature)
      return new Response('Dashboard API endpoint', { headers: corsHeaders });
    } else {
      return new Response('Not found', { 
        status: 404,
        headers: corsHeaders 
      });
    }
  }
};

async function handleAnalyticsCollection(request, env) {
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
        headers: corsHeaders 
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
      headers: corsHeaders 
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    return new Response('Internal error', { 
      status: 500,
      headers: corsHeaders 
    });
  }
};

export default worker;