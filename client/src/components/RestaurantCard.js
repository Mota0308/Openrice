import React from 'react';
import { useNavigate } from 'react-router-dom';
import FavoriteButton from './FavoriteButton';
import '../styles/RestaurantCard.css';

function RestaurantCard({ restaurant, userId, onRemove }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/restaurant/${restaurant.placeId}`);
  };

  const handleNavigate = (e) => {
    e.stopPropagation();
    if (restaurant.location) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${restaurant.location.lat},${restaurant.location.lng}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="restaurant-card" onClick={handleClick}>
      {restaurant.photos && restaurant.photos.length > 0 && (
        <div className="card-image">
          <img src={restaurant.photos[0]} alt={restaurant.name} />
        </div>
      )}
      
      <div className="card-content">
        <h3 className="card-title">{restaurant.name}</h3>
        
        <div className="card-meta">
          {restaurant.rating > 0 && (
            <div className="rating">
              <span className="stars">⭐</span>
              <span>{restaurant.rating.toFixed(1)}</span>
              {restaurant.userRatingsTotal > 0 && (
                <span className="review-count">
                  ({restaurant.userRatingsTotal})
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

        <p className="card-address">{restaurant.address}</p>

        {restaurant.aiReason && (
          <p className="card-ai-reason">
            <span className="card-ai-label">AI 推薦：</span>
            {restaurant.aiReason}
          </p>
        )}

        {(Array.isArray(restaurant.aiSuggestedDishes) && restaurant.aiSuggestedDishes.length > 0) && (
          <div className="card-ai-chips">
            <span className="card-ai-chip">可能菜式：{restaurant.aiSuggestedDishes.slice(0, 3).join('、')}</span>
          </div>
        )}

        {(Array.isArray(restaurant.aiSuggestedIngredients) && restaurant.aiSuggestedIngredients.length > 0) && (
          <div className="card-ai-chips">
            <span className="card-ai-chip">可能配料：{restaurant.aiSuggestedIngredients.slice(0, 3).join('、')}</span>
          </div>
        )}

        {(Array.isArray(restaurant.aiSuggestedStyle) && restaurant.aiSuggestedStyle.length > 0) && (
          <div className="card-ai-chips">
            <span className="card-ai-chip">可能風格：{restaurant.aiSuggestedStyle.slice(0, 2).join('、')}</span>
          </div>
        )}

        {restaurant.distance && (
          <p className="card-distance">距離：{restaurant.distance} 米</p>
        )}

        <div className="card-actions" onClick={(e) => e.stopPropagation()}>
          <FavoriteButton 
            userId={userId} 
            placeId={restaurant.placeId}
            restaurant={restaurant}
            onRemove={onRemove}
          />
          {restaurant.location && (
            <button 
              onClick={handleNavigate} 
              className="navigate-button"
            >
              🗺️ 導航
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default RestaurantCard;

