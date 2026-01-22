import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import api from '../config/api';

export default function RestaurantDetailScreen({ route, navigation }) {
  const { placeId, userId } = route.params;
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRestaurant();
  }, [placeId]);

  const fetchRestaurant = async () => {
    try {
      const response = await api.get(`/api/restaurants/${placeId}`);
      setRestaurant(response.data);
    } catch (err) {
      console.error('Fetch restaurant error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = () => {
    if (restaurant && restaurant.location) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${restaurant.location.lat},${restaurant.location.lng}`;
      Linking.openURL(url);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>無法載入餐廳信息</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
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
                  ({restaurant.userRatingsTotal} 則評論)
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

        <TouchableOpacity
          style={styles.navigateButton}
          onPress={handleNavigate}
        >
          <Text style={styles.navigateButtonText}>🗺️ 導航</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 地址</Text>
          <Text style={styles.sectionContent}>{restaurant.address}</Text>
        </View>

        {restaurant.phoneNumber && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📞 電話</Text>
            <TouchableOpacity
              onPress={() => Linking.openURL(`tel:${restaurant.phoneNumber}`)}
            >
              <Text style={styles.link}>{restaurant.phoneNumber}</Text>
            </TouchableOpacity>
          </View>
        )}

        {restaurant.website && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🌐 網站</Text>
            <TouchableOpacity
              onPress={() => Linking.openURL(restaurant.website)}
            >
              <Text style={styles.link}>{restaurant.website}</Text>
            </TouchableOpacity>
          </View>
        )}

        {restaurant.location && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🗺️ 地圖</Text>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: restaurant.location.lat,
                longitude: restaurant.location.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={{
                  latitude: restaurant.location.lat,
                  longitude: restaurant.location.lng,
                }}
                title={restaurant.name}
              />
            </MapView>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  stars: {
    fontSize: 20,
    marginRight: 4,
  },
  ratingText: {
    fontSize: 16,
    color: '#666',
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: '#999',
  },
  priceLevel: {
    fontSize: 16,
    color: '#4caf50',
    fontWeight: '600',
  },
  navigateButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  navigateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  link: {
    fontSize: 16,
    color: '#667eea',
    textDecorationLine: 'underline',
  },
  map: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginTop: 8,
  },
});

