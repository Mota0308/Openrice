const Restaurant = require('../models/Restaurant');
const Favorite = require('../models/Favorite');

// 根據 ID 獲取餐廳詳情
exports.getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ placeId: req.params.id });
    
    if (!restaurant) {
      return res.status(404).json({ error: '餐廳不存在' });
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

    // 查找餐廳
    const restaurant = await Restaurant.findOne({ placeId });
    if (!restaurant) {
      return res.status(404).json({ error: '餐廳不存在' });
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

