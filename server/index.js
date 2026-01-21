const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const searchRoutes = require('./routes/search');
const restaurantRoutes = require('./routes/restaurants');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// CORS 配置 - 允許前端域名
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/openrice')
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/search', searchRoutes);
app.use('/api/restaurants', restaurantRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'OpenRice API Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      search: 'POST /api/search',
      restaurant: 'GET /api/restaurants/:id',
      favorites: 'GET /api/restaurants/favorites/:userId'
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

