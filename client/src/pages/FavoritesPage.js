import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import LoadingSpinner from '../components/LoadingSpinner';
import RestaurantCard from '../components/RestaurantCard';
import '../styles/FavoritesPage.css';

function FavoritesPage({ userId }) {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await api.get(`/api/restaurants/favorites/${userId}`);
        if (response.data.success) {
          setFavorites(response.data.favorites);
        }
      } catch (err) {
        console.error('Fetch favorites error:', err);
        setError('無法載入收藏列表');
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [userId]);

  const handleRemoveFavorite = async (placeId) => {
    try {
      await api.delete(`/api/restaurants/favorite/${placeId}?userId=${userId}`);
      setFavorites(favorites.filter(fav => fav.placeId !== placeId));
    } catch (err) {
      console.error('Remove favorite error:', err);
      alert('取消收藏失敗');
    }
  };

  if (loading) {
    return (
      <main className="favorites-page">
        <LoadingSpinner />
      </main>
    );
  }

  return (
    <main className="favorites-page">
      <div className="favorites-container">
        <h2>我的收藏</h2>
        
        {error && (
          <div className="error-message">{error}</div>
        )}

        {favorites.length === 0 && !error && (
          <div className="empty-state">
            <p>還沒有收藏任何餐廳</p>
            <button onClick={() => navigate('/')} className="search-button">
              開始搜索
            </button>
          </div>
        )}

        {favorites.length > 0 && (
          <div className="favorites-list">
            {favorites.map((restaurant) => (
              <div key={restaurant.placeId} className="favorite-item">
                <RestaurantCard 
                  restaurant={restaurant} 
                  userId={userId}
                  onRemove={() => handleRemoveFavorite(restaurant.placeId)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default FavoritesPage;

