# OpenRice Android App

OpenRice Android 應用程序，支持 AI 搜索美食餐廳。

## 功能特點

- 🔍 AI 自然語言搜索餐廳
- 📍 GPS 定位功能
- 🗺️ Google Maps 集成
- ⭐ 餐廳評分和詳情
- ❤️ 收藏功能

## 技術棧

- **React Native** - 跨平台移動應用框架
- **Expo** - React Native 開發工具
- **React Navigation** - 導航
- **Axios** - HTTP 請求
- **@react-native-community/geolocation** - GPS 定位
- **react-native-maps** - 地圖顯示

## 安裝步驟

### 前置要求

1. **Node.js** (v18 或更高)
2. **npm** 或 **yarn**
3. **Expo CLI**
   ```bash
   npm install -g expo-cli
   ```
4. **Expo Go App** (在手機上安裝，用於測試)

### 安裝依賴

```bash
cd android
npm install
```

### 運行應用

#### 開發模式

```bash
npm start
```

然後：
- 掃描 QR 碼（使用 Expo Go App）
- 或按 `a` 在 Android 模擬器中運行

#### 構建 APK

```bash
npm run build:android
```

## 配置

### 環境變量

創建 `.env` 文件：

```env
EXPO_PUBLIC_API_URL=https://openrice-production.up.railway.app
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Google Maps API Key

1. 獲取 Google Maps API Key（與網頁版相同）
2. 在 Google Cloud Console 中啟用：
   - Maps SDK for Android
   - Places API
   - Geocoding API

## 項目結構

```
android/
├── App.js                 # 主應用組件
├── src/
│   ├── screens/          # 頁面組件
│   │   ├── SearchScreen.js
│   │   ├── RestaurantDetailScreen.js
│   │   └── FavoritesScreen.js
│   ├── components/       # 可重用組件
│   ├── services/        # API 服務
│   └── utils/           # 工具函數
├── app.json             # Expo 配置
└── package.json         # 依賴配置
```

## 功能說明

### GPS 定位

應用會自動請求位置權限，並使用 GPS 獲取用戶位置。

### API 連接

應用連接到相同的後端 API：
- 搜索：`POST /api/search`
- 餐廳詳情：`GET /api/restaurants/:id`
- 收藏：`POST /api/restaurants/favorite`

## 開發指南

查看 `DEVELOPMENT.md` 獲取詳細開發指南。

## 部署

### 構建 APK

```bash
expo build:android
```

### 發布到 Google Play Store

1. 構建 AAB 文件
2. 上傳到 Google Play Console
3. 填寫應用信息
4. 提交審核

