const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  placeId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  location: {
    lat: Number,
    lng: Number
  },
  rating: {
    type: Number,
    default: 0
  },
  userRatingsTotal: {
    type: Number,
    default: 0
  },
  priceLevel: {
    type: Number,
    min: 0,
    max: 4
  },
  types: [String],
  photos: [String],
  phoneNumber: String,
  website: String,
  openingHours: {
    openNow: Boolean,
    weekdayText: [String]
  },
  description: String,
  cuisine: String,
  atmosphere: [String]
}, {
  timestamps: true
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant;

