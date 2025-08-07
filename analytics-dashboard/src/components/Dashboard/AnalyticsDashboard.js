import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../Analytics/Sidebar';
import MetricCard from '../Analytics/MetricCard';
import PageViewChart from '../Analytics/PageViewChart';
import TopPages from '../Analytics/TopPages';
import BlogPerformance from '../Analytics/BlogPerformance';
import SearchAnalytics from '../Analytics/SearchAnalytics';
import TrafficSources from '../Analytics/TrafficSources';
import DetailOverlay from '../Analytics/DetailOverlay';
import styles from './AnalyticsDashboard.module.css';
import { MdOutlineRefresh } from "react-icons/md";
import { IoIosEye } from "react-icons/io";
import { FaUsers, FaSearch, FaExpand } from "react-icons/fa";
import { HiDocumentChartBar } from "react-icons/hi2";


const AnalyticsDashboard = ({ apiKey, onLogout }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [activeOverlay, setActiveOverlay] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const fetchAnalyticsData = useCallback(async () => {
    if (!apiKey) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`https://analytics.ujjwalvivek.com/api?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [timeRange, apiKey]);

  useEffect(() => {
    fetchAnalyticsData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchAnalyticsData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAnalyticsData]);

  const handleTimeRangeChange = (newRange) => {
    setTimeRange(newRange);
  };

  const handleOverlayOpen = (type) => {
    setActiveOverlay(type);
  };

  const handleOverlayClose = () => {
    setActiveOverlay(null);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  if (loading && !data) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <h2>Error Loading Data</h2>
          <p>{error}</p>
          <button onClick={fetchAnalyticsData} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <Sidebar 
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        onLogout={onLogout}
      />
      
      <main className={`${styles.mainContent} ${sidebarCollapsed ? styles.collapsed : ''}`}>
        <header className={styles.dashboardHeader}>
          <div className={styles.headerTitle}>
            <div>
              <h1>Analytics Dashboard</h1>
            </div>
          </div>
          
          <div className={styles.headerControls}>
            <div className={styles.timeRangeSelector}>
              {['today', 'yesterday', '1d', '7d', '30d'].map((range) => (
                <button
                  key={range}
                  className={`${styles.rangeButton} ${timeRange === range ? styles.active : ''}`}
                  onClick={() => handleTimeRangeChange(range)}
                >
                  {range.toUpperCase()}
                </button>
              ))}
            </div>
            
            <button 
              className={styles.refreshButton}
              onClick={fetchAnalyticsData}
              disabled={loading}
              title="Refresh data"
            >
              <span className={`${styles.refreshIcon} ${loading ? styles.spinning : ''}`}>
                <MdOutlineRefresh />
              </span>
            </button>
          </div>
        </header>

        <div className={styles.dashboardContent}>
          {/* Key Metrics */}
          <section className={styles.metricsGrid}>
            <MetricCard
              title="Total Views"
              value={data?.totalViews || 0}
              change={data?.viewsChange || 0}
              icon={<IoIosEye />}
              format="number"
            />
            <MetricCard
              title="Unique Visitors"
              value={data?.uniqueVisitors || 0}
              change={data?.visitorsChange || 0}
              icon={<FaUsers />}
              format="number"
            />
            <MetricCard
              title="Blog Views"
              value={data?.totalBlogViews || 0}
              change={data?.blogReadsChange || 0}
              icon={<HiDocumentChartBar />}
              format="number"
            />
            <MetricCard
              title="Search Queries"
              value={data?.totalSearches || 0}
              change={data?.searchChange || 0}
              icon={<FaSearch />}
              format="number"
            />
          </section>

          {/* Hero Chart Section */}
          <section className={styles.heroChart}>
            <div className={styles.heroChartContainer}>
              <PageViewChart data={data?.pageViewsOverTime || []} sidebarCollapsed={sidebarCollapsed} />
            </div>
          </section>

          {/* Charts Grid */}
          <section className={styles.chartsGrid}>
            <div className={styles.chartCard}>
              <div className={styles.cardHeader}>
                <h3>Top Pages</h3>
                <button 
                  className={styles.expandButton}
                  onClick={() => handleOverlayOpen('pages')}
                  title="View all pages"
                >
                  <FaExpand />
                </button>
              </div>
              <div className={styles.cardContent}>
                <TopPages 
                  data={data?.topPages || []} 
                  onShowMore={() => handleOverlayOpen('pages')}
                />
              </div>
            </div>

            <div className={styles.chartCard}>
              <div className={styles.cardHeader}>
                <h3>Blog Performance</h3>
                <button 
                  className={styles.expandButton}
                  onClick={() => handleOverlayOpen('blog')}
                  title="View all blog posts"
                >
                  <FaExpand />
                </button>
              </div>
              <div className={styles.cardContent}>
                <BlogPerformance 
                  data={data?.blogPerformance || []} 
                  totalViews={data?.totalBlogViews || 0} 
                  totalLikes={data?.totalBlogLikes || 0} 
                  totalShares={data?.totalBlogShares || 0}
                  onShowMore={() => handleOverlayOpen('blog')}
                />
              </div>
            </div>

            <div className={styles.chartCard}>
              <div className={styles.cardHeader}>
                <h3>Search Analytics</h3>
                <button 
                  className={styles.expandButton}
                  onClick={() => handleOverlayOpen('search')}
                  title="View all search terms"
                >
                  <FaExpand />
                </button>
              </div>
              <div className={styles.cardContent}>
                <SearchAnalytics 
                  data={data?.topSearchTerms || []} 
                  onShowMore={() => handleOverlayOpen('search')}
                />
              </div>
            </div>

            <div className={styles.chartCard}>
              <div className={styles.cardHeader}>
                <h3>Traffic Sources</h3>
                <button 
                  className={styles.expandButton}
                  onClick={() => handleOverlayOpen('traffic')}
                  title="View all traffic sources"
                >
                  <FaExpand />
                </button>
              </div>
              <div className={styles.cardContent}>
                <TrafficSources 
                  data={data?.trafficSources || []} 
                  onShowMore={() => handleOverlayOpen('traffic')}
                />
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Detail Overlay */}
      {activeOverlay && (
        <DetailOverlay 
          type={activeOverlay}
          data={data}
          onClose={handleOverlayClose}
        />
      )}
    </div>
  );
};

export default AnalyticsDashboard;
