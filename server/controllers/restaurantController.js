const Restaurant = require('../models/Restaurant');
const Favorite = require('../models/Favorite');
const axios = require('axios');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// 從 Google Places API 獲取餐廳詳情
async function fetchPlaceDetailsFromAPI(placeId) {
  try {
    // 使用新的 Places API (New) - Get Place
    const response = await axios.get(
      `https://places.googleapis.com/v1/places/${placeId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,rating,userRatingCount,priceLevel,types,photos,nationalPhoneNumber,websiteUri,regularOpeningHours,currentOpeningHours'
        },
        params: {
          languageCode: 'zh-TW'
        }
      }
    );

    if (response.data) {
      const place = response.data;
      
      // 轉換新 API 格式到數據庫格式
      const restaurantData = {
        placeId: place.id,
        name: place.displayName?.text || '',
        address: place.formattedAddress || '',
        location: {
          lat: place.location?.latitude || 0,
          lng: place.location?.longitude || 0
        },
        rating: place.rating || 0,
        userRatingsTotal: place.userRatingCount || 0,
        priceLevel: place.priceLevel || null,
        types: place.types || [],
        phoneNumber: place.nationalPhoneNumber || null,
        website: place.websiteUri || null,
        openingHours: place.regularOpeningHours || place.currentOpeningHours ? {
          openNow: place.currentOpeningHours?.openNow || false,
          weekdayText: place.regularOpeningHours?.weekdayText || []
        } : null
      };

      // 處理照片
      if (place.photos && place.photos.length > 0) {
        const photo = place.photos[0];
        if (photo.name) {
          restaurantData.photos = [
            `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=400&key=${GOOGLE_MAPS_API_KEY}`
          ];
        } else if (photo.uri) {
          restaurantData.photos = [photo.uri];
        }
      }

      // 保存到數據庫
      const savedRestaurant = await Restaurant.findOneAndUpdate(
        { placeId: place.id },
        restaurantData,
        { upsert: true, new: true }
      );

      return savedRestaurant;
    }
    return null;
  } catch (error) {
    console.error('Fetch place details from API error:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    return null;
  }
}

// 根據 ID 獲取餐廳詳情
exports.getRestaurantById = async (req, res) => {
  try {
    const placeId = req.params.id;
    console.log('Fetching restaurant:', placeId);

    // 首先從數據庫查找
    let restaurant = await Restaurant.findOne({ placeId });
    
    // 如果數據庫中沒有，從 Google Places API 獲取
    if (!restaurant) {
      console.log('Restaurant not found in database, fetching from API...');
      
      if (!GOOGLE_MAPS_API_KEY) {
        return res.status(500).json({ error: 'Google Maps API 密鑰未配置' });
      }

      restaurant = await fetchPlaceDetailsFromAPI(placeId);
      
      if (!restaurant) {
        return res.status(404).json({ error: '餐廳不存在或無法獲取餐廳信息' });
      }
    }

    res.json(restaurant);
  } catch (error) {
    console.error('Get restaurant error:', error);
    res.status(500).json({ error: '獲取餐廳信息失敗' });
  }
};

// 檢查是否已收藏
exports.checkFavorite = async (req, res) => {
  try {
    const { placeId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: '需要提供 userId' });
    }

    const favorite = await Favorite.findOne({ userId, placeId });
    res.json({ isFavorite: !!favorite });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({ error: '檢查收藏狀態失敗' });
  }
};

// 添加收藏
exports.addFavorite = async (req, res) => {
  try {
    const { userId, placeId } = req.body;

    if (!userId || !placeId) {
      return res.status(400).json({ error: '需要提供 userId 和 placeId' });
    }

    // 查找餐廳（先從數據庫，如果沒有則從 API 獲取）
    let restaurant = await Restaurant.findOne({ placeId });
    
    if (!restaurant) {
      console.log('Restaurant not found in database, fetching from API...');
      
      if (!GOOGLE_MAPS_API_KEY) {
        return res.status(500).json({ error: 'Google Maps API 密鑰未配置' });
      }

      restaurant = await fetchPlaceDetailsFromAPI(placeId);
      
      if (!restaurant) {
        return res.status(404).json({ error: '餐廳不存在或無法獲取餐廳信息' });
      }
    }

    // 檢查是否已收藏
    const existingFavorite = await Favorite.findOne({ userId, placeId });
    if (existingFavorite) {
      return res.status(400).json({ error: '已經收藏過此餐廳' });
    }

    // 創建收藏
    const favorite = new Favorite({
      userId,
      placeId,
      restaurantId: restaurant._id
    });

    await favorite.save();

    res.json({ success: true, favorite });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ error: '收藏失敗' });
  }
};

// 移除收藏
exports.removeFavorite = async (req, res) => {
  try {
    const { placeId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: '需要提供 userId' });
    }

    const favorite = await Favorite.findOneAndDelete({ userId, placeId });

    if (!favorite) {
      return res.status(404).json({ error: '收藏不存在' });
    }

    res.json({ success: true, message: '已取消收藏' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ error: '取消收藏失敗' });
  }
};

// 獲取收藏列表
exports.getFavorites = async (req, res) => {
  try {
    const { userId } = req.params;

    const favorites = await Favorite.find({ userId })
      .populate('restaurantId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: favorites.length,
      favorites: favorites.map(fav => ({
        ...fav.restaurantId.toObject(),
        favoritedAt: fav.createdAt
      }))
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: '獲取收藏列表失敗' });
  }
};

