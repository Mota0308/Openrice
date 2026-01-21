const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');

router.get('/:id', restaurantController.getRestaurantById);
router.get('/favorite/check/:placeId', restaurantController.checkFavorite);
router.post('/favorite', restaurantController.addFavorite);
router.delete('/favorite/:placeId', restaurantController.removeFavorite);
router.get('/favorites/:userId', restaurantController.getFavorites);

module.exports = router;

