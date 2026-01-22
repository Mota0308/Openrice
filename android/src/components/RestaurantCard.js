import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';

export default function RestaurantCard({ restaurant, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {restaurant.photos && restaurant.photos.length > 0 && (
        <Image
          source={{ uri: restaurant.photos[0] }}
          style={styles.image}
          resizeMode="cover"
        />
      )}
      
      <View style={styles.content}>
        <Text style={styles.title}>{restaurant.name}</Text>
        
        <View style={styles.meta}>
          {restaurant.rating > 0 && (
            <View style={styles.rating}>
              <Text style={styles.stars}>⭐</Text>
              <Text style={styles.ratingText}>
                {restaurant.rating.toFixed(1)}
              </Text>
              {restaurant.userRatingsTotal > 0 && (
                <Text style={styles.reviewCount}>
                  ({restaurant.userRatingsTotal})
                </Text>
              )}
            </View>
          )}
          {restaurant.priceLevel && (
            <Text style={styles.priceLevel}>
              {'$'.repeat(restaurant.priceLevel)}
            </Text>
          )}
        </View>

        <Text style={styles.address} numberOfLines={2}>
          {restaurant.address}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  stars: {
    fontSize: 16,
    marginRight: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#999',
  },
  priceLevel: {
    fontSize: 14,
    color: '#4caf50',
    fontWeight: '600',
  },
  address: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

