// API 配置
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  // Default timeout for most APIs (fast endpoints)
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 請求攔截器
api.interceptors.request.use(
  (config) => {
    // AI search can be slow (Ollama model loading, evidence fetching).
    // Only increase timeout for the search endpoint to avoid slowing down the whole app.
    if (config?.method?.toLowerCase() === 'post' && config?.url?.includes('/api/search')) {
      config.timeout = 120000; // 2 minutes
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 響應攔截器
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default api;

