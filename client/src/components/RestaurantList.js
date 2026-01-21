import React from 'react';
import RestaurantCard from './RestaurantCard';
import '../styles/RestaurantList.css';

function RestaurantList({ restaurants, userId }) {
  return (
    <div className="restaurant-list">
      {restaurants.map((restaurant) => (
        <RestaurantCard 
          key={restaurant.placeId} 
          restaurant={restaurant}
          userId={userId}
        />
      ))}
    </div>
  );
}

export default RestaurantList;

