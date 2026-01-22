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
  const [explanation, setExplanation] = useState(null);
  const [locationInfo, setLocationInfo] = useState(null);
  const [slowHint, setSlowHint] = useState(null);

  // 獲取用戶位置
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationInfo('使用您的位置');
        },
        (err) => {
          // 不顯示控制台錯誤，使用默認位置
          // 默認位置（香港）
          setLocation({ lat: 22.3193, lng: 114.1694 });
          setLocationInfo('使用默認位置（香港）');
        },
        {
          timeout: 10000, // 10秒超時
          enableHighAccuracy: false // 不需要高精度，加快獲取速度
        }
      );
    } else {
      // 默認位置（香港）
      setLocation({ lat: 22.3193, lng: 114.1694 });
      setLocationInfo('使用默認位置（香港）');
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
    setSlowHint(null);
    setRestaurants([]);
    setSearchAnalysis(null);
    setExplanation(null);

    try {
      console.log('Sending search request:', { query, location });
      // If Ollama is cold-starting, the first request can be slow.
      const slowTimer = setTimeout(() => {
        setSlowHint('AI 正在載入模型與整理證據，第一次可能需要 1–2 分鐘，請稍候…');
      }, 8000);

      const response = await api.post('/api/search', {
        query,
        location,
        explain: true
      });
      clearTimeout(slowTimer);

      console.log('Search response:', response.data);

      if (response.data.success) {
        setRestaurants(response.data.restaurants || []);
        setSearchAnalysis(response.data.analysis);
        setExplanation(response.data.explanation || null);
        
        if (!response.data.restaurants || response.data.restaurants.length === 0) {
          setError('未找到符合條件的餐廳，請嘗試其他搜索關鍵詞');
        }
      } else {
        setError(response.data.error || '搜索失敗，請稍後再試');
      }
    } catch (err) {
      console.error('Search error:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      const isTimeout = err?.code === 'ECONNABORTED' || /timeout/i.test(String(err?.message || ''));
      const errorMessage = isTimeout
        ? '搜尋超時：AI 服務可能正在啟動/下載模型。請稍後再試（或再按一次搜尋）。'
        : (err.response?.data?.error || err.message || '搜索失敗，請稍後再試');
      setError(errorMessage);
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

        {location && locationInfo && (
          <div className="location-info">
            <span>📍 {locationInfo}</span>
          </div>
        )}

        {error && (
          <div className="error-message">{error}</div>
        )}
        
        {slowHint && !error && (
          <div className="location-status">{slowHint}</div>
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
              {Array.isArray(searchAnalysis.preferredDishes) && searchAnalysis.preferredDishes.length > 0 && (
                <span className="tag">菜式：{searchAnalysis.preferredDishes.slice(0, 3).join('、')}</span>
              )}
              {Array.isArray(searchAnalysis.ingredients) && searchAnalysis.ingredients.length > 0 && (
                <span className="tag">配料：{searchAnalysis.ingredients.slice(0, 3).join('、')}</span>
              )}
              {Array.isArray(searchAnalysis.style) && searchAnalysis.style.length > 0 && (
                <span className="tag">風格：{searchAnalysis.style.slice(0, 2).join('、')}</span>
              )}
              {Array.isArray(searchAnalysis.dietary) && searchAnalysis.dietary.length > 0 && (
                <span className="tag">需求：{searchAnalysis.dietary.slice(0, 2).join('、')}</span>
              )}
            </div>
          </div>
        )}

        {explanation && (
          <div className="ai-explanation">
            <h3>AI 解說：</h3>
            {explanation.summary && (
              <p className="ai-explanation-summary">{explanation.summary}</p>
            )}
            {Array.isArray(explanation.items) && explanation.items.length > 0 && (
              <div className="ai-explanation-highlights">
                <div className="ai-explanation-subtitle">推薦亮點（前 3 家）：</div>
                <ul>
                  {explanation.items.slice(0, 3).map((it) => (
                    <li key={it.placeId}>
                      <div className="ai-explanation-reason">{it.reason}</div>
                      {(Array.isArray(it.evidenceNotes) && it.evidenceNotes.length > 0) && (
                        <div className="ai-explanation-evidence">
                          依據：{it.evidenceNotes.slice(0, 2).join('；')}
                        </div>
                      )}
                      {(Array.isArray(it.suggestedDishes) && it.suggestedDishes.length > 0) && (
                        <div className="ai-explanation-meta">
                          <span className="ai-chip">可能菜式：{it.suggestedDishes.slice(0, 3).join('、')}</span>
                        </div>
                      )}
                      {(Array.isArray(it.suggestedIngredients) && it.suggestedIngredients.length > 0) && (
                        <div className="ai-explanation-meta">
                          <span className="ai-chip">可能配料：{it.suggestedIngredients.slice(0, 3).join('、')}</span>
                        </div>
                      )}
                      {(Array.isArray(it.suggestedStyle) && it.suggestedStyle.length > 0) && (
                        <div className="ai-explanation-meta">
                          <span className="ai-chip">可能風格：{it.suggestedStyle.slice(0, 2).join('、')}</span>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {explanation.disclaimer && (
              <div className="ai-explanation-disclaimer">{explanation.disclaimer}</div>
            )}
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

        {!loading && restaurants.length === 0 && !error && location && searchAnalysis && (
          <div className="empty-state">
            <p>未找到符合條件的餐廳</p>
            <p style={{ fontSize: '0.9rem', color: '#999', marginTop: '0.5rem' }}>
              請嘗試其他搜索關鍵詞或擴大搜索範圍
            </p>
          </div>
        )}

        {!loading && restaurants.length === 0 && !error && !searchAnalysis && location && (
          <div className="empty-state">
            <p>輸入搜索內容開始尋找餐廳</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default SearchPage;

