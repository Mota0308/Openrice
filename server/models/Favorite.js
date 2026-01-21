const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  placeId: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

favoriteSchema.index({ userId: 1, placeId: 1 }, { unique: true });

const Favorite = mongoose.model('Favorite', favoriteSchema);

module.exports = Favorite;

