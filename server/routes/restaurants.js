const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');

router.get('/favorite/check/:placeId', restaurantController.checkFavorite);
router.post('/favorite', restaurantController.addFavorite);
router.delete('/favorite/:placeId', restaurantController.removeFavorite);
router.get('/favorites/:userId', restaurantController.getFavorites);
// 注意：放最後，避免把上面的路由都匹配成 /:id
router.get('/:id', restaurantController.getRestaurantById);

module.exports = router;

