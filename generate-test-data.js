// Generate diverse test analytics data
const pages = [
  '/about', '/projects', '/blog', '/contact', '/resume', 
  '/blog/log_0000_boot_sequence', '/blog/log_0001_md_showcase', 
  '/blog/proj_0000_the_reckoning', '/blog/proj_0001_cement_ary_journey',
  '/blog/proj_0002_greedysnek', '/blog/proj_0003_kill_bad_guys',
  '/blog/proj_0004_rust_game_engine', '/blog/proj_0005_the_synclippy',
  '/projects/portfolio', '/projects/terminal-ui', '/projects/analytics'
];

const searchTerms = [
  'portfolio', 'projects', 'rust game engine', 'terminal ui', 
  'greedysnek', 'cement journey', 'synclippy', 'analytics dashboard',
  'react components', 'github pages', 'webgpu', 'terminal', 'blog',
  'about me', 'resume', 'contact', 'javascript', 'typescript'
];

const referrers = [
  'direct', 'google.com', 'github.com', 'linkedin.com', 
  'twitter.com', 'reddit.com', 'dev.to', 'hackernews',
  'duckduckgo.com', 'bing.com'
];

const blogActions = ['view', 'like', 'share'];

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomEvents(count) {
  const events = [];
  const baseTimestamp = Date.now();
  
  for (let i = 0; i < count; i++) {
    const eventType = Math.random() < 0.6 ? 'pageview' : 
                     Math.random() < 0.8 ? 'search' : 'blog_action';
    
    const timestamp = baseTimestamp - Math.random() * 24 * 60 * 60 * 1000; // Within last 24 hours
    const sessionId = 'test-session-' + Math.floor(Math.random() * 100);
    
    let event = {
      type: eventType,
      timestamp,
      sessionId
    };
    
    switch (eventType) {
      case 'pageview':
        const path = getRandomItem(pages);
        event.path = path;
        event.title = path.split('/').pop() || 'Home';
        event.referrer = getRandomItem(referrers);
        break;
        
      case 'search':
        event.query = getRandomItem(searchTerms);
        break;
        
      case 'blog_action':
        event.postId = getRandomItem([
          'log_0000_boot_sequence', 'log_0001_md_showcase', 
          'proj_0000_the_reckoning', 'proj_0001_cement_ary_journey',
          'proj_0002_greedysnek', 'proj_0003_kill_bad_guys',
          'proj_0004_rust_game_engine', 'proj_0005_the_synclippy'
        ]);
        event.action = getRandomItem(blogActions);
        break;
    }
    
    events.push(event);
  }
  
  return events;
}

async function sendEvent(event) {
  try {
    const response = await fetch('https://analytics.ujjwalvivek.com/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      },
      body: JSON.stringify(event)
    });
    
    if (!response.ok) {
      console.error(`Failed to send event: ${response.status}`);
    }
    
    return response.ok;
  } catch (error) {
    console.error('Error sending event:', error);
    return false;
  }
}

async function generateTestData() {
  console.log('Generating 50 diverse test analytics events...');
  
  const events = generateRandomEvents(50);
  let successCount = 0;
  
  for (let i = 0; i < events.length; i++) {
    const success = await sendEvent(events[i]);
    if (success) successCount++;
    
    // Add small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if ((i + 1) % 10 === 0) {
      console.log(`Sent ${i + 1}/${events.length} events (${successCount} successful)`);
    }
  }
  
  console.log(`\nCompleted! Sent ${successCount}/${events.length} events successfully.`);
  console.log('The analytics dashboard should now show more data with "Show More" buttons.');
}

generateTestData().catch(console.error);
