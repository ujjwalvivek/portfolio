import React, { useState, useEffect } from 'react';
import * as d3 from 'd3';
import styles from './AnalyticsDashboard.module.css';

// Simple analytics dashboard component
const AnalyticsDashboard = ({ apiKey }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [error, setError] = useState(null);
  const [activeOverlay, setActiveOverlay] = useState(null);

  const fetchAnalyticsData = React.useCallback(async () => {
    try {
      setLoading(true);
      
      // This would call your analytics API with the time range
      const response = await fetch(`https://analytics.ujjwalvivek.com/api?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const analyticsData = await response.json();
      setData(analyticsData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [timeRange, apiKey]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData, timeRange]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          root@analytics:~$ LOADING_DATA...
          <br />
          [████████████████████████████████] 100%
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          ERROR: CONNECTION_FAILED
          <br />
          {error}
        </div>
        <button onClick={fetchAnalyticsData} className={styles.retryButton}>
          [RETRY]
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>
          <span style={{ opacity: 0.6 }}>root@analytics:~$ </span>
          DASHBOARD v2.1.3
        </h1>
        <div className={styles.timeRangeSelector}>
          <button 
            className={timeRange === 'today' ? styles.active : ''}
            onClick={() => setTimeRange('today')}
          >
            [TODAY]
          </button>
          <button 
            className={timeRange === 'yesterday' ? styles.active : ''}
            onClick={() => setTimeRange('yesterday')}
          >
            [YESTERDAY]
          </button>
          <button 
            className={timeRange === '1d' ? styles.active : ''}
            onClick={() => setTimeRange('1d')}
          >
            [24H]
          </button>
          <button 
            className={timeRange === '7d' ? styles.active : ''}
            onClick={() => setTimeRange('7d')}
          >
            [7D]
          </button>
          <button 
            className={timeRange === '30d' ? styles.active : ''}
            onClick={() => setTimeRange('30d')}
          >
            [30D]
          </button>
        </div>
      </header>

      <div className={styles.grid}>
        <MetricCard
          title="TOTAL_VIEWS"
          value={data?.totalViews || 0}
          change={data?.viewsChange || 0}
          icon="[●]"
        />
        <MetricCard
          title="UNIQUE_USERS"
          value={data?.uniqueVisitors || 0}
          change={data?.visitorsChange || 0}
          icon="[◗]"
        />
        <MetricCard
          title="BLOG_VIEWS"
          value={data?.totalBlogViews || 0}
          change={data?.blogReadsChange || 0}
          icon="[◐]"
        />
        <MetricCard
          title="SEARCHES"
          value={data?.totalSearches || 0}
          change={data?.searchChange || 0}
          icon="[◑]"
        />

        <div className={styles.chartContainer}>
          <h3>» PAGE_VIEWS_OVER_TIME</h3>
          <PageViewChart data={data?.pageViewsOverTime || []} />
        </div>

        <div className={styles.chartContainer}>
          <h3>» TOP_PAGES</h3>
          <TopPages 
            data={data?.topPages || []} 
            onShowMore={() => setActiveOverlay('pages')}
          />
        </div>

        <div className={styles.chartContainer}>
          <h3>» BLOG_PERFORMANCE</h3>
          <BlogPerformance 
            data={data?.blogPerformance || []} 
            totalViews={data?.totalBlogViews || 0} 
            totalLikes={data?.totalBlogLikes || 0} 
            totalShares={data?.totalBlogShares || 0}
            onShowMore={() => setActiveOverlay('blog')}
          />
        </div>

        <div className={styles.chartContainer}>
          <h3>» SEARCH_ANALYTICS</h3>
          <SearchAnalytics 
            data={data?.topSearchTerms || []} 
            onShowMore={() => setActiveOverlay('search')}
          />
        </div>

        <div className={styles.chartContainer}>
          <h3>» TRAFFIC_SOURCES</h3>
          <TrafficSources 
            data={data?.trafficSources || []} 
            onShowMore={() => setActiveOverlay('traffic')}
          />
        </div>
      </div>
      
      {/* Overlay for detailed views */}
      {activeOverlay && (
        <DetailOverlay 
          type={activeOverlay}
          data={data}
          onClose={() => setActiveOverlay(null)}
        />
      )}
    </div>
  );
};

// Detail overlay component for showing full data
const DetailOverlay = ({ type, data, onClose }) => {
  const getOverlayContent = () => {
    switch (type) {
      case 'search':
        return {
          title: 'SEARCH_ANALYTICS_DETAILED',
          items: data?.topSearchTerms || [],
          renderItem: (item, index) => (
            <div key={item.term} className={styles.overlayItem}>
              <span className={styles.rank}>[{String(index + 1).padStart(3, '0')}]</span>
              <div className={styles.overlayItemContent}>
                <div className={styles.overlayItemTitle}>"{item.term}"</div>
                <div className={styles.overlayItemMeta}>{item.count} searches</div>
              </div>
            </div>
          )
        };
      
      case 'pages':
        return {
          title: 'TOP_PAGES_DETAILED',
          items: data?.topPages || [],
          renderItem: (item, index) => (
            <div key={item.path} className={styles.overlayItem}>
              <span className={styles.rank}>[{String(index + 1).padStart(3, '0')}]</span>
              <div className={styles.overlayItemContent}>
                <div className={styles.overlayItemTitle}>{item.title}</div>
                <div className={styles.overlayItemMeta}>{item.path} • {item.views} views</div>
              </div>
            </div>
          )
        };
      
      case 'blog':
        return {
          title: 'BLOG_PERFORMANCE_DETAILED',
          items: data?.blogPerformance || [],
          renderItem: (item, index) => (
            <div key={item.id} className={styles.overlayItem}>
              <span className={styles.rank}>[{String(index + 1).padStart(3, '0')}]</span>
              <div className={styles.overlayItemContent}>
                <div className={styles.overlayItemTitle}>{item.title}</div>
                <div className={styles.overlayItemMeta}>
                  [●] {item.views} views • [♥] {item.likes} likes • [↗] {item.shares} shares
                </div>
              </div>
            </div>
          )
        };
      
      case 'traffic':
        return {
          title: 'TRAFFIC_SOURCES_DETAILED',
          items: data?.trafficSources || [],
          renderItem: (item, index) => (
            <div key={item.source} className={styles.overlayItem}>
              <span className={styles.rank}>[{String(index + 1).padStart(3, '0')}]</span>
              <div className={styles.overlayItemContent}>
                <div className={styles.overlayItemTitle}>[{item.source.toUpperCase()}]</div>
                <div className={styles.overlayItemMeta}>{item.percentage}% of traffic</div>
              </div>
            </div>
          )
        };
      
      default:
        return { title: 'UNKNOWN', items: [], renderItem: () => null };
    }
  };

  const content = getOverlayContent();

  return (
    <div className={styles.overlayBackdrop} onClick={onClose}>
      <div className={styles.overlayContainer} onClick={e => e.stopPropagation()}>
        <div className={styles.overlayHeader}>
          <h2>
            <span style={{ opacity: 0.6 }}>root@analytics:~$ </span>
            {content.title}
          </h2>
          <button className={styles.overlayCloseBtn} onClick={onClose}>
            [X] CLOSE
          </button>
        </div>
        
        <div className={styles.overlayContent}>
          <div className={styles.overlayStats}>
            TOTAL_ITEMS: {content.items.length}
          </div>
          
          <div className={styles.overlayItemsList}>
            {content.items.length === 0 ? (
              <div className={styles.noData}>NO_DATA_AVAILABLE</div>
            ) : (
              content.items.map((item, index) => content.renderItem(item, index))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Metric card component
const MetricCard = ({ title, value, change, icon }) => (
  <div className={styles.metricCard}>
    <div className={styles.metricIcon}>{icon}</div>
    <div className={styles.metricContent}>
      <h3>{title}</h3>
      <div className={styles.metricValue}>{value}</div>
      <div className={`${styles.metricChange} ${change >= 0 ? styles.positive : styles.negative}`}>
        {change >= 0 ? '[▲]' : '[▼]'} {Math.abs(change)}%
      </div>
    </div>
  </div>
);

// Page views chart using D3
const PageViewChart = ({ data }) => {
  const svgRef = React.useRef();

  useEffect(() => {
    if (!data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 500 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime()
      .domain(d3.extent(data, d => new Date(d.date)))
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.views)])
      .range([height, 0]);

    const line = d3.line()
      .x(d => x(new Date(d.date)))
      .y(d => y(d.views))
      .curve(d3.curveMonotoneX);

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5));

    g.append('g')
      .call(d3.axisLeft(y));

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#00ff41')
      .attr('stroke-width', 2)
      .attr('d', line)
      .style('filter', 'drop-shadow(0 0 3px #00ff41)');

    // Add dots
    g.selectAll('.dot')
      .data(data)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(new Date(d.date)))
      .attr('cy', d => y(d.views))
      .attr('r', 3)
      .attr('fill', '#00ff41')
      .style('filter', 'drop-shadow(0 0 2px #00ff41)');

  }, [data]);

  return <svg ref={svgRef}></svg>;
};

// Top pages list
const TopPages = ({ data, onShowMore }) => {
  const displayData = data.slice(0, 10); // Show only first 10 items
  
  return (
    <div className={styles.topPagesList}>
      {displayData.map((page, index) => (
        <div key={page.path} className={styles.topPageItem}>
          <span className={styles.rank}>[{String(index + 1).padStart(2, '0')}]</span>
          <div className={styles.pageInfo}>
            <div className={styles.pagePath}>{page.path}</div>
            <div className={styles.pageTitle}>{page.title}</div>
          </div>
          <div className={styles.pageViews}>{page.views}</div>
        </div>
      ))}
      {data.length > 10 && (
        <button className={styles.showMoreBtn} onClick={onShowMore}>
          » SHOW_MORE ({data.length - 10} more)
        </button>
      )}
    </div>
  );
};

// Blog performance component (simplified - removed completion rate and avg read time)
const BlogPerformance = ({ data, totalViews, totalLikes, totalShares, onShowMore }) => {
  const displayData = data.slice(0, 10); // Show only first 10 items
  
  return (
    <div className={styles.blogPerformance}>
      <div className={styles.blogTotals}>
        <div className={styles.totalMetric}>
          <span className={styles.totalLabel}>TOTAL:</span>
          <span className={styles.totalValue}>[●] {totalViews} views</span>
          <span className={styles.totalValue}>[♥] {totalLikes} likes</span>
          <span className={styles.totalValue}>[↗] {totalShares} shares</span>
        </div>
      </div>
      {displayData.length === 0 ? (
        <div className={styles.noData}>NO_BLOG_DATA_FOUND</div>
      ) : (
        <>
          {displayData.map((post) => (
            <div key={post.id} className={styles.blogPost}>
              <h4>» {post.title}</h4>
              <div className={styles.blogMetrics}>
                <span>[●] {post.views} views</span>
                <span>[♥] {post.likes} likes</span>
                <span>[↗] {post.shares} shares</span>
              </div>
            </div>
          ))}
          {data.length > 10 && (
            <button className={styles.showMoreBtn} onClick={onShowMore}>
              » SHOW_MORE ({data.length - 10} more)
            </button>
          )}
        </>
      )}
    </div>
  );
};

// Search analytics component
const SearchAnalytics = ({ data, onShowMore }) => {
  const displayData = data.slice(0, 10); // Show only first 10 items
  
  return (
    <div className={styles.searchAnalytics}>
      {displayData.length === 0 ? (
        <div className={styles.noData}>NO_SEARCH_DATA_FOUND</div>
      ) : (
        <>
          {displayData.map((search, index) => (
            <div key={search.term} className={styles.searchItem}>
              <span className={styles.rank}>[{String(index + 1).padStart(2, '0')}]</span>
              <div className={styles.searchTerm}>"{search.term}"</div>
              <div className={styles.searchCount}>{search.count}</div>
            </div>
          ))}
          {data.length > 10 && (
            <button className={styles.showMoreBtn} onClick={onShowMore}>
              » SHOW_MORE ({data.length - 10} more)
            </button>
          )}
        </>
      )}
    </div>
  );
};

// Traffic sources component
const TrafficSources = ({ data, onShowMore }) => {
  const displayData = data.slice(0, 5); // Show only first 5 items for traffic sources
  
  return (
    <div className={styles.trafficSources}>
      {displayData.map((source) => (
        <div key={source.source} className={styles.sourceItem}>
          <div className={styles.sourceName}>[{source.source.toUpperCase()}]</div>
          <div className={styles.sourceBar}>
            <div 
              className={styles.sourceBarFill}
              style={{ width: `${source.percentage}%` }}
            ></div>
          </div>
          <div className={styles.sourcePercentage}>{source.percentage}%</div>
        </div>
      ))}
      {data.length > 5 && (
        <button className={styles.showMoreBtn} onClick={onShowMore}>
          » SHOW_MORE ({data.length - 5} more)
        </button>
      )}
    </div>
  );
};

// Utility function to format duration
const formatDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default AnalyticsDashboard;
