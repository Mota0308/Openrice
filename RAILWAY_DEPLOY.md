# Railway 部署指南

本指南將幫助您將 OpenRice 後端服務器部署到 Railway 平台。

## 前置要求

1. Railway 帳號（訪問 https://railway.app/ 註冊）
2. GitHub 帳號（用於連接代碼倉庫）
3. MongoDB Atlas 帳號（用於雲端數據庫）
4. OpenAI API Key
5. Google Maps API Key

## 部署步驟

### 1. 準備代碼倉庫

確保您的代碼已推送到 GitHub：

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. 在 Railway 創建新項目

1. 訪問 https://railway.app/
2. 登錄您的帳號
3. 點擊 "New Project"
4. 選擇 "Deploy from GitHub repo"
5. 選擇您的 GitHub 倉庫
6. Railway 會自動檢測到 Node.js 項目

### 3. 配置環境變量

在 Railway 項目設置中，添加以下環境變量：

#### 必需環境變量

```
PORT=5000
MONGODB_URI=<your-mongodb-atlas-connection-string>
OPENAI_API_KEY=<your-openai-api-key>
GOOGLE_MAPS_API_KEY=<your-google-maps-api-key>
```

#### 可選環境變量

```
FRONTEND_URL=<your-frontend-url>
# 例如：https://your-frontend.vercel.app
# 如果不設置，CORS 將允許所有來源（僅用於開發）
```

### 4. 獲取 MongoDB Atlas 連接字符串

1. 訪問 https://www.mongodb.com/cloud/atlas
2. 創建或選擇您的集群
3. 點擊 "Connect"
4. 選擇 "Connect your application"
5. 複製連接字符串
6. 將 `<password>` 替換為您的數據庫密碼
7. 將連接字符串添加到 Railway 環境變量

**示例連接字符串格式：**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/openrice?retryWrites=true&w=majority
```

### 5. 配置 Railway 構建設置

Railway 會自動檢測到 `server` 目錄，但您可能需要手動配置：

1. 在 Railway 項目中，點擊服務設置
2. 設置 **Root Directory** 為 `server`
3. 設置 **Build Command** 為 `npm install`（通常自動檢測）
4. 設置 **Start Command** 為 `npm start`（通常自動檢測）

### 6. 部署

Railway 會自動開始部署。您可以在 "Deployments" 標籤中查看部署日誌。

### 7. 獲取部署 URL

部署完成後，Railway 會提供一個公共 URL，例如：
```
https://your-app-name.up.railway.app
```

### 8. 測試部署

訪問以下端點測試服務器：

```bash
# 健康檢查
curl https://your-app-name.up.railway.app/api/health

# 應該返回：
# {"status":"OK","message":"Server is running"}
```

## 配置前端連接

更新前端代碼以連接到 Railway 部署的後端：

### 方法 1: 使用環境變量（推薦）

在 `client/.env` 或 `client/.env.production` 中添加：

```env
REACT_APP_API_URL=https://your-app-name.up.railway.app
```

然後更新 `client/src` 中的 API 調用，使用 `process.env.REACT_APP_API_URL` 作為基礎 URL。

### 方法 2: 使用代理（開發環境）

在 `client/package.json` 中更新 proxy：

```json
{
  "proxy": "https://your-app-name.up.railway.app"
}
```

## 自定義域名（可選）

1. 在 Railway 項目設置中，點擊 "Settings"
2. 找到 "Domains" 部分
3. 點擊 "Generate Domain" 或添加自定義域名
4. 按照指示配置 DNS 記錄

## 監控和日誌

- **日誌查看**：在 Railway 項目中點擊 "Deployments" → 選擇部署 → 查看日誌
- **實時日誌**：Railway 提供實時日誌流
- **監控**：Railway 會自動監控服務健康狀態

## 故障排除

### 部署失敗

1. 檢查構建日誌中的錯誤信息
2. 確保所有環境變量都已正確設置
3. 檢查 `server/package.json` 中的依賴是否正確

### 連接錯誤

1. 檢查 MongoDB Atlas 連接字符串是否正確
2. 確保 MongoDB Atlas IP 白名單包含 Railway 的 IP（或設置為 0.0.0.0/0）
3. 檢查環境變量是否正確設置

### CORS 錯誤

1. 確保 `FRONTEND_URL` 環境變量設置正確
2. 檢查前端請求的 URL 是否正確

### API 錯誤

1. 檢查 OpenAI API Key 是否有效
2. 檢查 Google Maps API Key 是否有效且已啟用所需服務
3. 查看 Railway 日誌以獲取詳細錯誤信息

## 更新部署

當您推送新代碼到 GitHub 時，Railway 會自動觸發新的部署：

```bash
git add .
git commit -m "Update code"
git push
```

Railway 會自動檢測更改並重新部署。

## 成本說明

- Railway 提供免費層級，包括：
  - $5 免費額度/月
  - 512MB RAM
  - 1GB 存儲
- 超出免費額度後按使用量計費
- MongoDB Atlas 提供免費 M0 集群

## 相關資源

- [Railway 文檔](https://docs.railway.app/)
- [MongoDB Atlas 文檔](https://docs.atlas.mongodb.com/)
- [OpenAI API 文檔](https://platform.openai.com/docs)
- [Google Maps API 文檔](https://developers.google.com/maps/documentation)

