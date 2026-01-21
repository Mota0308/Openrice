import React, { useState, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import RestaurantList from '../components/RestaurantList';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../config/api';
import '../styles/SearchPage.css';

function SearchPage({ userId }) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);
  const [searchAnalysis, setSearchAnalysis] = useState(null);

  // 獲取用戶位置
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (err) => {
          console.error('Geolocation error:', err);
          // 默認位置（台北）
          setLocation({ lat: 25.0330, lng: 121.5654 });
        }
      );
    } else {
      // 默認位置（台北）
      setLocation({ lat: 25.0330, lng: 121.5654 });
    }
  }, []);

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setError('請輸入搜索內容');
      return;
    }

    if (!location) {
      setError('正在獲取位置信息，請稍候...');
      return;
    }

    setLoading(true);
    setError(null);
    setRestaurants([]);
    setSearchAnalysis(null);

    try {
      const response = await api.post('/api/search', {
        query,
        location
      });

      if (response.data.success) {
        setRestaurants(response.data.restaurants);
        setSearchAnalysis(response.data.analysis);
      } else {
        setError('搜索失敗，請稍後再試');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err.response?.data?.error || '搜索失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="search-page">
      <div className="search-container">
        <h2>尋找您的美食餐廳</h2>
        <p className="subtitle">使用自然語言搜索，例如：「附近的日式餐廳」、「適合約會的火鍋店」</p>
        
        <SearchBar onSearch={handleSearch} disabled={loading || !location} />
        
        {!location && (
          <div className="location-status">正在獲取您的位置...</div>
        )}

        {error && (
          <div className="error-message">{error}</div>
        )}

        {searchAnalysis && (
          <div className="search-analysis">
            <h3>AI 分析結果：</h3>
            <div className="analysis-tags">
              {searchAnalysis.cuisine && (
                <span className="tag">菜系：{searchAnalysis.cuisine}</span>
              )}
              {searchAnalysis.atmosphere && (
                <span className="tag">氛圍：{searchAnalysis.atmosphere}</span>
              )}
              {searchAnalysis.priceRange && (
                <span className="tag">價格：{searchAnalysis.priceRange}</span>
              )}
            </div>
          </div>
        )}

        {loading && <LoadingSpinner />}

        {!loading && restaurants.length > 0 && (
          <div className="results-header">
            <h3>找到 {restaurants.length} 間餐廳</h3>
          </div>
        )}

        {!loading && restaurants.length > 0 && (
          <RestaurantList restaurants={restaurants} userId={userId} />
        )}

        {!loading && restaurants.length === 0 && !error && location && (
          <div className="empty-state">
            <p>輸入搜索內容開始尋找餐廳</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default SearchPage;

