import React, { useState, useEffect } from 'react';
import * as d3 from 'd3';
import styles from './AnalyticsDashboard.module.css';

// Simple analytics dashboard component
const AnalyticsDashboard = ({ apiKey }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [error, setError] = useState(null);

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
  }, [fetchAnalyticsData]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Error: {error}</div>
        <button onClick={fetchAnalyticsData} className={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Analytics Dashboard</h1>
        <div className={styles.timeRangeSelector}>
          <button 
            className={timeRange === '1d' ? styles.active : ''}
            onClick={() => setTimeRange('1d')}
          >
            24H
          </button>
          <button 
            className={timeRange === '7d' ? styles.active : ''}
            onClick={() => setTimeRange('7d')}
          >
            7D
          </button>
          <button 
            className={timeRange === '30d' ? styles.active : ''}
            onClick={() => setTimeRange('30d')}
          >
            30D
          </button>
        </div>
      </header>

      <div className={styles.grid}>
        <MetricCard
          title="Total Views"
          value={data?.totalViews || 0}
          change={data?.viewsChange || 0}
          icon="👁️"
        />
        <MetricCard
          title="Unique Visitors"
          value={data?.uniqueVisitors || 0}
          change={data?.visitorsChange || 0}
          icon="👤"
        />
        <MetricCard
          title="Avg. Session"
          value={formatDuration(data?.avgSessionDuration || 0)}
          change={data?.sessionChange || 0}
          icon="⏱️"
        />
        <MetricCard
          title="Blog Reads"
          value={data?.blogReads || 0}
          change={data?.blogReadsChange || 0}
          icon="📖"
        />

        <div className={styles.chartContainer}>
          <h3>Page Views Over Time</h3>
          <PageViewChart data={data?.pageViewsOverTime || []} />
        </div>

        <div className={styles.chartContainer}>
          <h3>Top Pages</h3>
          <TopPages data={data?.topPages || []} />
        </div>

        <div className={styles.chartContainer}>
          <h3>Blog Post Performance</h3>
          <BlogPerformance data={data?.blogPerformance || []} />
        </div>

        <div className={styles.chartContainer}>
          <h3>Traffic Sources</h3>
          <TrafficSources data={data?.trafficSources || []} />
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
        {change >= 0 ? '↗' : '↘'} {Math.abs(change)}%
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
      .attr('stroke', '#00d2ff')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add dots
    g.selectAll('.dot')
      .data(data)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(new Date(d.date)))
      .attr('cy', d => y(d.views))
      .attr('r', 3)
      .attr('fill', '#00d2ff');

  }, [data]);

  return <svg ref={svgRef}></svg>;
};

// Top pages list
const TopPages = ({ data }) => (
  <div className={styles.topPagesList}>
    {data.map((page, index) => (
      <div key={page.path} className={styles.topPageItem}>
        <span className={styles.rank}>#{index + 1}</span>
        <div className={styles.pageInfo}>
          <div className={styles.pagePath}>{page.path}</div>
          <div className={styles.pageTitle}>{page.title}</div>
        </div>
        <div className={styles.pageViews}>{page.views}</div>
      </div>
    ))}
  </div>
);

// Blog performance component
const BlogPerformance = ({ data }) => (
  <div className={styles.blogPerformance}>
    {data.map((post) => (
      <div key={post.id} className={styles.blogPost}>
        <h4>{post.title}</h4>
        <div className={styles.blogMetrics}>
          <span>👁️ {post.views}</span>
          <span>📖 {post.completionRate}% completion</span>
          <span>❤️ {post.likes}</span>
          <span>⏱️ {formatDuration(post.avgReadTime)}</span>
        </div>
      </div>
    ))}
  </div>
);

// Traffic sources component
const TrafficSources = ({ data }) => (
  <div className={styles.trafficSources}>
    {data.map((source) => (
      <div key={source.source} className={styles.sourceItem}>
        <div className={styles.sourceName}>{source.source}</div>
        <div className={styles.sourceBar}>
          <div 
            className={styles.sourceBarFill}
            style={{ width: `${source.percentage}%` }}
          ></div>
        </div>
        <div className={styles.sourcePercentage}>{source.percentage}%</div>
      </div>
    ))}
  </div>
);

// Utility function to format duration
const formatDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default AnalyticsDashboard;
