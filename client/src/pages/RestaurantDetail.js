import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../config/api';
import LoadingSpinner from '../components/LoadingSpinner';
import FavoriteButton from '../components/FavoriteButton';
import '../styles/RestaurantDetail.css';

function RestaurantDetail({ userId }) {
  const { placeId } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const response = await api.get(`/api/restaurants/${placeId}`);
        setRestaurant(response.data);
      } catch (err) {
        console.error('Fetch restaurant error:', err);
        setError('無法載入餐廳信息');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, [placeId]);

  const handleNavigate = () => {
    if (restaurant && restaurant.location) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${restaurant.location.lat},${restaurant.location.lng}`;
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <main className="restaurant-detail">
        <LoadingSpinner />
      </main>
    );
  }

  if (error || !restaurant) {
    return (
      <main className="restaurant-detail">
        <div className="error-message">{error || '餐廳不存在'}</div>
        <button onClick={() => navigate('/')} className="back-button">
          返回搜索
        </button>
      </main>
    );
  }

  return (
    <main className="restaurant-detail">
      <button onClick={() => navigate(-1)} className="back-button">
        ← 返回
      </button>

      <div className="restaurant-header">
        {restaurant.photos && restaurant.photos.length > 0 && (
          <img 
            src={restaurant.photos[0]} 
            alt={restaurant.name}
            className="restaurant-image"
          />
        )}
        <div className="restaurant-info">
          <h1>{restaurant.name}</h1>
          <div className="restaurant-meta">
            {restaurant.rating > 0 && (
              <div className="rating">
                <span className="stars">⭐</span>
                <span>{restaurant.rating.toFixed(1)}</span>
                {restaurant.userRatingsTotal > 0 && (
                  <span className="review-count">
                    ({restaurant.userRatingsTotal} 則評論)
                  </span>
                )}
              </div>
            )}
            {restaurant.priceLevel && (
              <div className="price-level">
                {'$'.repeat(restaurant.priceLevel)}
              </div>
            )}
          </div>
          <div className="restaurant-actions">
            <FavoriteButton 
              userId={userId} 
              placeId={restaurant.placeId}
              restaurant={restaurant}
            />
            <button onClick={handleNavigate} className="navigate-button">
              🗺️ 導航
            </button>
          </div>
        </div>
      </div>

      <div className="restaurant-details">
        <div className="detail-section">
          <h3>📍 地址</h3>
          <p>{restaurant.address}</p>
        </div>

        {restaurant.phoneNumber && (
          <div className="detail-section">
            <h3>📞 電話</h3>
            <p>
              <a href={`tel:${restaurant.phoneNumber}`}>
                {restaurant.phoneNumber}
              </a>
            </p>
          </div>
        )}

        {restaurant.website && (
          <div className="detail-section">
            <h3>🌐 網站</h3>
            <p>
              <a href={restaurant.website} target="_blank" rel="noopener noreferrer">
                {restaurant.website}
              </a>
            </p>
          </div>
        )}

        {restaurant.openingHours && restaurant.openingHours.weekdayText && (
          <div className="detail-section">
            <h3>🕐 營業時間</h3>
            <div className="opening-hours">
              {restaurant.openingHours.openNow && (
                <div className="open-status open">目前營業中</div>
              )}
              {!restaurant.openingHours.openNow && (
                <div className="open-status closed">目前休息中</div>
              )}
              <ul>
                {restaurant.openingHours.weekdayText.map((time, index) => (
                  <li key={index}>{time}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {restaurant.types && restaurant.types.length > 0 && (
          <div className="detail-section">
            <h3>🏷️ 類型</h3>
            <div className="tags">
              {restaurant.types.slice(0, 10).map((type, index) => (
                <span key={index} className="tag">{type}</span>
              ))}
            </div>
          </div>
        )}

        {restaurant.location && (
          <div className="detail-section">
            <h3>🗺️ 地圖</h3>
            <div className="map-container">
              {process.env.REACT_APP_GOOGLE_MAPS_API_KEY ? (
                <iframe
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/place?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&q=${restaurant.location.lat},${restaurant.location.lng}`}
                />
              ) : (
                <div className="map-placeholder">
                  <p>請配置 Google Maps API Key 以顯示地圖</p>
                  <a 
                    href={`https://www.google.com/maps?q=${restaurant.location.lat},${restaurant.location.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="map-link"
                  >
                    在 Google Maps 中查看
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default RestaurantDetail;

