# Privacy-First Analytics System

A lightweight, privacy-focused analytics solution built for your portfolio website. No cookies, no personal data collection, no tracking - just essential insights to improve your content.

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Your Website  │───▶│  Analytics API   │───▶│  Cloudflare R2  │
│  (React Client) │    │ (Cloudflare CF)  │    │   (Data Store)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │ Analytics Dashboard│
                       │ analytics.domain.com│
                       └──────────────────┘
```

## 🔒 Privacy Features

- **No Personal Data**: No cookies, no localStorage, no user identification
- **IP Hashing**: One-way hash of IP addresses for rate limiting only
- **Data Minimization**: Only collect essential metrics
- **Automatic Expiry**: Data auto-expires after 90 days
- **GDPR Compliant**: No consent banners needed
- **Local First**: Works offline, fails gracefully

## 📊 What We Track

### Page Analytics
- Page views and unique sessions
- Time spent on pages
- Navigation patterns
- Error rates

### Blog Analytics
- Reading progress (25%, 50%, 75%, 90%)
- Time to read completion
- Anonymous likes/reactions
- Search queries (for content improvement)

### Technical Metrics
- Load times and performance
- Device type (mobile/tablet/desktop) - generalized
- Browser compatibility issues

## 🚀 Setup Instructions

### 1. Cloudflare Worker Setup

1. Install Wrangler CLI:
```bash
npm install -g wrangler
```

2. Authenticate with Cloudflare:
```bash
wrangler login
```

3. Create R2 bucket:
```bash
wrangler r2 bucket create analytics-data
```

4. Create KV namespace:
```bash
wrangler kv:namespace create "ANALYTICS_KV"
wrangler kv:namespace create "ANALYTICS_KV" --preview
```

5. Update `wrangler.toml` with your KV namespace IDs

6. Deploy the worker:
```bash
cd analytics-worker
wrangler deploy
```

### 2. Main Website Integration

1. Add environment variables to `.env`:
```env
REACT_APP_ANALYTICS_API=https://analytics-api.yourdomain.com/collect
REACT_APP_ANALYTICS_ENABLED=true
```

2. The analytics are already integrated into your App.js component

3. For blog posts, add to your blog post component:
```javascript
import { useBlogAnalytics } from '../../hooks/useAnalytics';

function BlogPost({ postId, title }) {
  const { trackLike, trackShare } = useBlogAnalytics(postId, title);
  
  // Use trackLike() and trackShare() in your UI
}
```

### 3. Analytics Dashboard Setup

1. Deploy dashboard to a subdomain:
```bash
cd analytics-dashboard
npm install
npm run build
```

2. Deploy build folder to `analytics.yourdomain.com`

3. Create API key for dashboard access (store securely)

## 🔧 Configuration

### Environment Variables

**Main Website (.env)**
```env
REACT_APP_ANALYTICS_API=https://analytics-api.yourdomain.com/collect
REACT_APP_ANALYTICS_ENABLED=true
```

**Cloudflare Worker**
- Configure domain routing in `wrangler.toml`
- Set up R2 bucket and KV namespace bindings
- Add rate limiting and security settings

### Privacy Settings

The system is configured with privacy-first defaults:
- 30 requests per minute rate limit per IP
- No cross-site tracking
- Minimal data collection
- Automatic data expiration

## 📈 Dashboard Features

### Real-time Metrics
- Live visitor count
- Page views and unique visitors
- Session duration
- Top performing content

### Blog Analytics
- Reading completion rates
- Time spent reading
- Popular posts
- Search queries

### Privacy-Safe Insights
- Geographic data (country level only)
- Device types (generalized)
- Traffic sources (cleaned referrers)
- Performance metrics

## 🛡️ Security Considerations

1. **API Key Management**: Store dashboard API keys securely
2. **Rate Limiting**: Prevents abuse and spam
3. **Data Validation**: All inputs are sanitized
4. **CORS Protection**: Only your domain can send data
5. **No PII Storage**: Zero personally identifiable information

## 📊 Data Retention

- **Hot Storage**: 30 days in R2 for dashboard queries
- **Cold Storage**: Archive older data or delete automatically
- **Rate Limit Data**: 1 minute TTL in KV store
- **Session Data**: Ephemeral, resets on page reload

## 🔄 Data Processing Pipeline

```
User Action → Analytics Client → Cloudflare Worker → Data Validation → R2 Storage
                    ↓
            Rate Limiting Check
                    ↓
            IP Hash Generation
                    ↓
            Event Processing
```

## 🚦 Monitoring & Alerts

Set up Cloudflare Worker alerts for:
- High error rates
- Unusual traffic spikes
- Storage quota warnings
- API performance issues

## 🎨 Customization

### Adding New Events
1. Extend the analytics client with new event types
2. Update worker validation for new events
3. Add dashboard visualization

### Custom Metrics
Define custom events for your specific needs:
```javascript
analytics.trackCustomEvent('project_demo_view', {
  projectId: 'rust-game-engine',
  section: 'video_demo',
  timestamp: Date.now()
});
```

## 📄 Legal Compliance

This system is designed to be:
- **GDPR Compliant**: No personal data collection
- **CCPA Compliant**: No sale of personal information
- **Cookie Law Compliant**: No cookies used
- **Privacy-First**: Transparent data practices

## 🛠️ Development

### Local Testing
```bash
# Test analytics client
npm start

# Test worker locally
cd analytics-worker
wrangler dev

# Test dashboard
cd analytics-dashboard
npm start
```

### Debugging
- Check browser network tab for analytics requests
- Monitor Cloudflare Worker logs
- Verify R2 bucket data structure

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review Cloudflare Worker logs
3. Verify environment configuration
4. Test with browser developer tools

## 🎯 Roadmap

### Phase 1 (Current)
- [x] Basic page view tracking
- [x] Blog engagement metrics
- [x] Privacy-safe data collection
- [x] Real-time dashboard

### Phase 2 (Future)
- [ ] A/B testing framework
- [ ] Heatmap visualization
- [ ] Advanced search analytics
- [ ] Performance monitoring

### Phase 3 (Advanced)
- [ ] ML-powered insights
- [ ] Predictive analytics
- [ ] Content recommendations
- [ ] Advanced privacy features
