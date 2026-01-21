import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SearchPage from './pages/SearchPage';
import RestaurantDetail from './pages/RestaurantDetail';
import FavoritesPage from './pages/FavoritesPage';
import './App.css';

function App() {
  const [userId] = useState(() => {
    // 生成或獲取用戶 ID（實際應用中應該從認證系統獲取）
    let id = localStorage.getItem('userId');
    if (!id) {
      id = 'user_' + Date.now();
      localStorage.setItem('userId', id);
    }
    return id;
  });

  return (
    <Router>
      <div className="App">
        <header className="app-header">
          <h1>🍽️ OpenRice</h1>
          <nav>
            <a href="/">搜索</a>
            <a href="/favorites">我的收藏</a>
          </nav>
        </header>

        <Routes>
          <Route path="/" element={<SearchPage userId={userId} />} />
          <Route path="/restaurant/:placeId" element={<RestaurantDetail userId={userId} />} />
          <Route path="/favorites" element={<FavoritesPage userId={userId} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

