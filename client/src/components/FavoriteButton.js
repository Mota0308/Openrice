import React, { useState, useEffect } from 'react';
import api from '../config/api';
import '../styles/FavoriteButton.css';

function FavoriteButton({ userId, placeId, restaurant, onRemove }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      try {
        const response = await api.get(`/api/restaurants/favorite/check/${placeId}?userId=${userId}`);
        setIsFavorite(response.data.isFavorite);
      } catch (err) {
        console.error('Check favorite status error:', err);
      }
    };

    if (userId && placeId) {
      checkFavoriteStatus();
    }
  }, [userId, placeId]);

  const handleToggleFavorite = async (e) => {
    e.stopPropagation();
    
    if (loading) return;

    setLoading(true);

    try {
      if (isFavorite) {
        await api.delete(`/api/restaurants/favorite/${placeId}?userId=${userId}`);
        setIsFavorite(false);
        if (onRemove) {
          onRemove();
        }
      } else {
        await api.post('/api/restaurants/favorite', {
          userId,
          placeId
        });
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('Toggle favorite error:', err);
      alert(err.response?.data?.error || '操作失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`favorite-button ${isFavorite ? 'active' : ''}`}
      onClick={handleToggleFavorite}
      disabled={loading}
      title={isFavorite ? '取消收藏' : '加入收藏'}
    >
      {isFavorite ? '❤️' : '🤍'} {isFavorite ? '已收藏' : '收藏'}
    </button>
  );
}

export default FavoriteButton;

