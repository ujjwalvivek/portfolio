import React from 'react';
import styles from './MetricCard.module.css';

const MetricCard = ({ title, value, change, icon, format = 'number' }) => {
  const formatValue = (val) => {
    if (format === 'number') {
      return new Intl.NumberFormat().format(val);
    }
    if (format === 'percentage') {
      return `${val}%`;
    }
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    }
    return val;
  };

  const formatChange = (changeValue) => {
    if (!changeValue) return null;
    
    const isPositive = changeValue > 0;
    const prefix = isPositive ? '+' : '';
    
    return (
      <div className={`${styles.changeIndicator} ${isPositive ? styles.positive : styles.negative}`}>
        <span className={styles.changeArrow}>
          {isPositive ? '↗' : '↘'}
        </span>
        <span>{prefix}{changeValue}%</span>
      </div>
    );
  };

  return (
    <div className={styles.metricCard} data-silhouette={formatValue(value)}>
      <div className={styles.cardHeader}>
        <div className={styles.metricTitle}>
          <span className={styles.icon}>{icon}</span> {title}
        </div>
      </div>
      <div className={styles.cardContent}>
        {change !== undefined && formatChange(change)}
      </div>
    </div>
  );
};

export default MetricCard;
