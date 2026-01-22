const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

router.post('/', searchController.searchRestaurants);
router.get('/explanation/:jobId', searchController.getExplanation);

module.exports = router;

