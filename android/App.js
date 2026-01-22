import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import SearchScreen from './src/screens/SearchScreen';
import RestaurantDetailScreen from './src/screens/RestaurantDetailScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';

const Stack = createNativeStackNavigator();

// 生成或獲取用戶 ID
const getUserId = () => {
  // 在實際應用中，應該從安全存儲獲取
  // 這裡使用簡單的本地存儲模擬
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  // 簡化版本，實際應該使用 AsyncStorage
  return 'user_' + Date.now();
};

export default function App() {
  const [userId] = useState(getUserId);

  return (
    <>
      <StatusBar style="auto" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Search"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#667eea',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="Search" 
            component={SearchScreen}
            options={{ title: '🍽️ OpenRice' }}
            initialParams={{ userId }}
          />
          <Stack.Screen 
            name="RestaurantDetail" 
            component={RestaurantDetailScreen}
            options={{ title: '餐廳詳情' }}
            initialParams={{ userId }}
          />
          <Stack.Screen 
            name="Favorites" 
            component={FavoritesScreen}
            options={{ title: '我的收藏' }}
            initialParams={{ userId }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

