import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import api from '../config/api';
import RestaurantCard from '../components/RestaurantCard';

export default function SearchScreen({ route, navigation }) {
  const { userId } = route.params;
  const [query, setQuery] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationInfo, setLocationInfo] = useState('正在獲取位置...');
  const [error, setError] = useState(null);

  // 獲取用戶位置
  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    try {
      // 請求位置權限
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        // 如果用戶拒絕，使用默認位置（香港）
        setLocation({ lat: 22.3193, lng: 114.1694 });
        setLocationInfo('使用默認位置（香港）');
        return;
      }

      // 獲取當前位置
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });
      setLocationInfo('使用您的位置');
    } catch (err) {
      // 錯誤時使用默認位置（香港）
      setLocation({ lat: 22.3193, lng: 114.1694 });
      setLocationInfo('使用默認位置（香港）');
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      Alert.alert('提示', '請輸入搜索內容');
      return;
    }

    if (!location) {
      Alert.alert('提示', '正在獲取位置信息，請稍候...');
      return;
    }

    setLoading(true);
    setError(null);
    setRestaurants([]);

    try {
      const response = await api.post('/api/search', {
        query,
        location,
      });

      if (response.data.success) {
        setRestaurants(response.data.restaurants);
      } else {
        setError('搜索失敗，請稍後再試');
      }
    } catch (err) {
      console.error('Search error:', err);
      Alert.alert('錯誤', err.response?.data?.error || '搜索失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Text style={styles.locationInfo}>📍 {locationInfo}</Text>
        
        <TextInput
          style={styles.searchInput}
          placeholder="例如：附近的日式餐廳、適合約會的火鍋店..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
        />
        
        <TouchableOpacity
          style={[styles.searchButton, loading && styles.searchButtonDisabled]}
          onPress={handleSearch}
          disabled={loading || !location}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.searchButtonText}>🔍 搜索</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.resultsContainer}>
        {restaurants.length > 0 && (
          <Text style={styles.resultsHeader}>
            找到 {restaurants.length} 間餐廳
          </Text>
        )}

        {restaurants.map((restaurant) => (
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
        ))}

        {!loading && restaurants.length === 0 && location && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>輸入搜索內容開始尋找餐廳</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  locationInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  searchInput: {
    height: 50,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 12,
  },
  searchButton: {
    height: 50,
    backgroundColor: '#667eea',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    padding: 16,
  },
  resultsHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
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

