# OpenRice - AI 美食餐廳搜索 App

一個支持 AI 自然語言搜索的美食餐廳應用程序，幫助用戶快速找到符合需求的餐廳。

## 功能特點

- 🔍 **AI 搜索**：使用自然語言搜索餐廳（如「附近的日式餐廳」、「適合約會的火鍋店」）
- 📍 **地理位置**：基於用戶位置搜索附近餐廳
- 🗺️ **地圖集成**：整合 Google Maps API 顯示餐廳位置和導航
- ⭐ **評分系統**：顯示餐廳評分和評論
- ❤️ **收藏功能**：保存喜愛的餐廳
- 📱 **響應式設計**：適配各種設備

## 技術棧

### 前端
- React
- React Router
- Axios
- Google Maps React

### 後端
- Node.js
- Express
- MongoDB
- OpenAI API
- Google Maps API

## 安裝步驟

1. **安裝所有依賴**
```bash
npm run install-all
```

2. **配置環境變量**

在 `server` 目錄下創建 `.env` 文件：
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/openrice
OPENAI_API_KEY=your_openai_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

3. **啟動應用**
```bash
npm run dev
```

前端將運行在 http://localhost:3000
後端將運行在 http://localhost:5000

## 項目結構

```
openrice/
├── client/          # React 前端應用
├── server/          # Node.js 後端服務
├── package.json     # 根目錄配置
└── README.md        # 項目說明
```

## API 端點

- `POST /api/search` - AI 搜索餐廳
- `GET /api/restaurants/:id` - 獲取餐廳詳情
- `POST /api/restaurants/favorite` - 收藏餐廳
- `GET /api/restaurants/favorites` - 獲取收藏列表

## 使用說明

1. 在搜索欄輸入自然語言查詢（如「附近的日式餐廳」）
2. AI 會分析您的需求並搜索匹配的餐廳
3. 查看餐廳列表，點擊查看詳情
4. 可以收藏喜愛的餐廳或直接導航

## 部署到 Railway

詳細的 Railway 部署指南請查看 [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md)

### 快速部署步驟

1. 將代碼推送到 GitHub
2. 在 Railway 創建新項目並連接 GitHub 倉庫
3. 設置環境變量：
   - `MONGODB_URI` - MongoDB Atlas 連接字符串
   - `OPENAI_API_KEY` - OpenAI API 密鑰
   - `GOOGLE_MAPS_API_KEY` - Google Maps API 密鑰
   - `FRONTEND_URL` - 前端 URL（可選，用於 CORS）
4. Railway 會自動部署

### 前端配置

部署前端時，在環境變量中設置：
- `REACT_APP_API_URL` - Railway 後端 URL（例如：`https://your-app.up.railway.app`）
- `REACT_APP_GOOGLE_MAPS_API_KEY` - Google Maps API 密鑰

