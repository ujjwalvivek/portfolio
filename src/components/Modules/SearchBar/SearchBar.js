import { useState, useEffect } from 'react';
import styles from './SearchBar.module.css';
import { MdKeyboardCommandKey } from "react-icons/md";
import { FiSearch } from "react-icons/fi";
import { VscClearAll } from "react-icons/vsc";

const searchPost = (query, post) => {
  if (!query || !query.trim()) return { match: false, score: 0 };

  const queryLower = query.toLowerCase().trim();

  const title = (post.title || '').toLowerCase();
  const description = (post.description || '').toLowerCase();
  const tags = (post.tags || []).join(' ').toLowerCase();

  let score = 0;
  let hasMatch = false;

  // Exact phrase match (highest priority)
  if (title.includes(queryLower)) {
    score += 100;
    hasMatch = true;
  }
  if (description.includes(queryLower)) {
    score += 50;
    hasMatch = true;
  }
  if (tags.includes(queryLower)) {
    score += 75;
    hasMatch = true;
  }

  // Word boundary matches - only if we haven't found exact matches
  if (!hasMatch) {
    // Common stopwords that shouldn't be searched individually
    const stopwords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'as', 'is', 'are', 'was', 'were', 'be', 'been',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these',
      'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him',
      'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their'
    ]);

    const words = queryLower.split(/\s+/)
      .filter(word => word.length > 0)
      .filter(word => {
        // Keep meaningful short words and programming terms
        if (['c#', 'go', 'js', 'ai', 'ml', 'ui', 'ux', 'db'].includes(word)) return true;
        // Filter out stopwords and very short words
        if (word.length < 2 || stopwords.has(word)) return false;
        return true;
      });

    // If after filtering stopwords, no meaningful words remain, treat as no match
    if (words.length === 0) {
      return { match: false, score: 0 };
    }

    words.forEach(word => {
      const titleWords = title.split(/\s+/).filter(w => w.length > 0);
      const descWords = description.split(/\s+/).filter(w => w.length > 0);
      const tagWords = tags.split(/\s+/).filter(w => w.length > 0);

      // Exact word matches (higher score)
      if (titleWords.some(w => w === word)) {
        score += 40;
        hasMatch = true;
      } else if (titleWords.some(w => w.startsWith(word))) {
        score += 30;
        hasMatch = true;
      }

      if (descWords.some(w => w === word)) {
        score += 20;
        hasMatch = true;
      } else if (descWords.some(w => w.startsWith(word))) {
        score += 15;
        hasMatch = true;
      }

      if (tagWords.some(w => w === word)) {
        score += 30;
        hasMatch = true;
      } else if (tagWords.some(w => w.startsWith(word))) {
        score += 20;
        hasMatch = true;
      }
    });
  }

  // More strict fuzzy matching - only for single meaningful words 3+ characters
  if (!hasMatch && queryLower.length >= 3) {
    // Common stopwords that shouldn't be searched individually
    const stopwords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'as', 'is', 'are', 'was', 'were', 'be', 'been',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these',
      'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him',
      'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their'
    ]);

    // Only apply fuzzy matching to single meaningful words (no spaces, no stopwords)
    const words = queryLower.split(/\s+/)
      .filter(word => word.length > 0)
      .filter(word => {
        // Keep meaningful short words and programming terms
        if (['c#', 'go', 'js', 'ai', 'ml', 'ui', 'ux', 'db'].includes(word)) return true;
        // Filter out stopwords and very short words
        if (word.length < 3 || stopwords.has(word)) return false;
        return true;
      });

    // Only do fuzzy matching if there's exactly one meaningful word
    if (words.length === 1) {
      const searchTerm = words[0];
      const allText = `${title} ${description} ${tags}`;

      // Only match if at least 80% of characters are found in close proximity
      const threshold = Math.ceil(searchTerm.length * 0.8);
      let matchedChars = 0;
      let lastMatchIndex = -1;

      for (let i = 0; i < searchTerm.length; i++) {
        const char = searchTerm[i];
        const foundIndex = allText.indexOf(char, lastMatchIndex + 1);

        if (foundIndex !== -1 && (foundIndex - lastMatchIndex) <= 3) {
          matchedChars++;
          lastMatchIndex = foundIndex;
        }
      }

      if (matchedChars >= threshold) {
        score += 5;
        hasMatch = true;
      }
    }
  }

  return { match: hasMatch, score };
};

export { searchPost };

const SearchBar = ({ value = '', onSearch, placeholder = "Search posts..." }) => {
  const [query, setQuery] = useState(value ? value : '');

  useEffect(() => {
    setQuery(value ?? '');
  }, [value]);

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
      <span className={styles.searchIcon} aria-hidden="true">
        <FiSearch />
      </span>
      <input
        type="text"
        className={styles.searchInput}
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
      />
      {query ? (
        <button
          className={styles.clearButton}
          onClick={handleClear}
          title="Clear search"
        >
          <VscClearAll />
        </button>
      ) : (
        <button
          className={styles.kbdButton}
          title="Open command palette (Ctrl/⌘ + K, then P)"
        >
          <span className={styles.kbdKey}><MdKeyboardCommandKey size={14} /></span>
          <span className={styles.kbdPlus}>+</span>
          <span className={styles.kbdKey}>K</span>
          <span className={styles.kbdKey}>P</span>
        </button>

      )}
    </div>
  );
};

export default SearchBar;
