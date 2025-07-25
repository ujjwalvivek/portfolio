import React, { useState } from 'react';
import styles from './SearchBar.module.css';

const SearchBar = ({ onSearch, placeholder = "Search posts..." }) => {
  const [query, setQuery] = useState('');

  const handleInputChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    onSearch(newQuery);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className={styles.searchContainer}>
      <div className={styles.searchWrapper}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
        />
        {query && (
          <button
            className={styles.clearButton}
            onClick={handleClear}
            aria-label="Clear search"
          >
            clr
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
