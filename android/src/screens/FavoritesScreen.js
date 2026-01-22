import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import api from '../config/api';
import RestaurantCard from '../components/RestaurantCard';

export default function FavoritesScreen({ route, navigation }) {
  const { userId } = route.params;
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const response = await api.get(`/api/restaurants/favorites/${userId}`);
      if (response.data.success) {
        setFavorites(response.data.favorites);
      }
    } catch (err) {
      console.error('Fetch favorites error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {favorites.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>還沒有收藏任何餐廳</Text>
        </View>
      ) : (
        favorites.map((restaurant) => (
          <RestaurantCard
            key={restaurant.placeId}
            restaurant={restaurant}
            userId={userId}
            onPress={() =>
              navigation.navigate('RestaurantDetail', {
                placeId: restaurant.placeId,
                userId,
              })
            }
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

