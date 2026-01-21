import React, { useState } from 'react';
import '../styles/SearchBar.css';

function SearchBar({ onSearch, disabled }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() && !disabled) {
      onSearch(query);
    }
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <input
        type="text"
        className="search-input"
        placeholder="例如：附近的日式餐廳、適合約會的火鍋店..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={disabled}
      />
      <button 
        type="submit" 
        className="search-button"
        disabled={disabled || !query.trim()}
      >
        🔍 搜索
      </button>
    </form>
  );
}

export default SearchBar;

