import React from 'react';
import styles from './SectionHeader.module.css';

const SectionHeader = ({ title }) => {
  return (
    <div className={styles.sectionHeader}>
      <div>┌</div>
      <div className={styles.lineAndLabel}>
        <span className={styles.label}>{title}</span>
      </div>
      <div>┐</div>
    </div>
  );
};

export default SectionHeader;
