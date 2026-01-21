# Railway 快速部署指南

## 5 分鐘快速部署

### 1. 準備 GitHub 倉庫
```bash
git init
git add .
git commit -m "Ready for Railway deployment"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. 在 Railway 創建項目
1. 訪問 https://railway.app/
2. 點擊 "New Project" → "Deploy from GitHub repo"
3. 選擇您的倉庫
4. Railway 會自動檢測到 `server` 目錄

### 3. 設置環境變量
在 Railway 項目設置中添加：

| 變量名 | 說明 | 示例 |
|--------|------|------|
| `PORT` | 端口（Railway 自動設置） | 5000 |
| `MONGODB_URI` | MongoDB Atlas 連接字符串 | `mongodb+srv://...` |
| `OPENAI_API_KEY` | OpenAI API 密鑰 | `sk-...` |
| `GOOGLE_MAPS_API_KEY` | Google Maps API 密鑰 | `AIza...` |
| `FRONTEND_URL` | 前端 URL（可選） | `https://your-frontend.vercel.app` |

### 4. 獲取部署 URL
部署完成後，Railway 會提供：
```
https://your-app-name.up.railway.app
```

### 5. 測試部署
```bash
curl https://your-app-name.up.railway.app/api/health
```

應該返回：`{"status":"OK","message":"Server is running"}`

## 配置前端連接

在您的前端部署平台（如 Vercel、Netlify）設置環境變量：

```env
REACT_APP_API_URL=https://your-app-name.up.railway.app
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## 常見問題

**Q: Railway 找不到 server 目錄？**
A: 在 Railway 項目設置中，設置 Root Directory 為 `server`

**Q: 部署失敗？**
A: 檢查構建日誌，確保所有環境變量都已設置

**Q: CORS 錯誤？**
A: 設置 `FRONTEND_URL` 環境變量為您的前端域名

**Q: MongoDB 連接失敗？**
A: 確保 MongoDB Atlas IP 白名單包含 `0.0.0.0/0`（允許所有 IP）

## 詳細文檔

查看 [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md) 獲取完整部署指南。

