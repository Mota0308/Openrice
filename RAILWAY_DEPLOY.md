# Railway 部署指南

本指南將幫助您將 OpenRice 後端服務器部署到 Railway 平台。

## 前置要求

1. Railway 帳號（訪問 https://railway.app/ 註冊）
2. GitHub 帳號（用於連接代碼倉庫）
3. MongoDB Atlas 帳號（用於雲端數據庫）
4. Google Gemini API Key（推薦）或 OpenAI API Key
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
GOOGLE_MAPS_API_KEY=<your-google-maps-api-key>

# AI 提供商配置（三選一）
# 選項 1：使用 Ollama（推薦，完全免費，數據隱私）
AI_PROVIDER=ollama
OLLAMA_API_URL=https://your-ollama-service.up.railway.app
OLLAMA_MODEL=llama2:7b

# 選項 2：使用 Google Gemini（免費額度大）
# AI_PROVIDER=gemini
# GEMINI_API_KEY=<your-gemini-api-key>
# GEMINI_MODEL=gemini-pro

# 選項 3：使用 OpenAI
# AI_PROVIDER=openai
# OPENAI_API_KEY=<your-openai-api-key>
# OPENAI_MODEL=gpt-4o-mini
```

#### 可選環境變量

```
FRONTEND_URL=<your-frontend-url>
# 例如：https://your-frontend.vercel.app
# 如果不設置，CORS 將允許所有來源（僅用於開發）

# 網站抓取配置（可選）
ENABLE_WEBSITE_SCRAPE=true
EVIDENCE_CACHE_TTL_MS=21600000
EVIDENCE_MAX_PLACES=3
```

### 4. 設置 Ollama 服務（推薦，完全免費）

**為什麼選擇 Ollama？**
- ✅ **完全免費**：無需 API Key，無使用限制
- ✅ **數據隱私**：模型在本地運行，數據不會上傳到第三方
- ✅ **可自定義**：可以選擇不同的模型

**部署步驟：**

1. **創建獨立的 Ollama 服務**：
   - 在 Railway 項目中，點擊 **"New Service"**
   - 選擇 **"Empty Service"**
   - 參考 `ollama-service/README.md` 進行配置
   - 設置 **Root Directory** 為 `ollama-service`
   - Railway 會自動使用 Dockerfile 構建

2. **資源要求**：
   - **RAM**: 至少 4GB（推薦 8GB+）
   - **存儲**: 至少 10GB（用於模型文件）
   - ⚠️ Railway 免費計劃可能不足以運行 Ollama

3. **獲取 Ollama 服務 URL**：
   - 部署完成後，Railway 會提供一個 URL
   - 例如：`https://ollama-service-production.up.railway.app`

4. **在主後端服務中配置**：
   - 在後端服務的環境變量中設置：
     ```
     AI_PROVIDER=ollama
     OLLAMA_API_URL=https://your-ollama-service.up.railway.app
     OLLAMA_MODEL=llama2:7b
     ```

**推薦的小模型（資源需求較低）：**
- `tinyllama` (637MB) - 最小，適合測試
- `phi-2` (1.6GB) - 小但質量不錯
- `llama2:7b` (3.8GB) - 平衡質量和資源

### 5. 獲取 Google Gemini API Key（可選）

**為什麼選擇 Gemini？**
- 免費額度大：每分鐘 60 次請求，每月 1500 次
- 質量接近 GPT-4
- 價格便宜（超過免費額度後）
- 支持繁體中文

**獲取步驟：**
1. 訪問 https://aistudio.google.com/app/apikey
2. 使用 Google 帳號登錄
3. 點擊 "Create API Key"
4. 複製 API Key
5. 在 Railway 環境變量中添加：
   - `AI_PROVIDER=gemini`
   - `GEMINI_API_KEY=<your-gemini-api-key>`
   - `GEMINI_MODEL=gemini-pro`（可選，默認值）

**或者使用 OpenAI：**
1. 訪問 https://platform.openai.com/
2. 註冊或登錄帳號
3. 前往 API Keys 頁面
4. 創建新的 API Key
5. 在 Railway 環境變量中添加：
   - `AI_PROVIDER=openai`
   - `OPENAI_API_KEY=<your-openai-api-key>`
   - `OPENAI_MODEL=gpt-4o-mini`（可選）

### 6. 獲取 MongoDB Atlas 連接字符串

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

### 7. 配置 Railway 構建設置

Railway 會自動檢測到 `server` 目錄，但您可能需要手動配置：

1. 在 Railway 項目中，點擊服務設置
2. 設置 **Root Directory** 為 `server`
3. 設置 **Build Command** 為 `npm install`（通常自動檢測）
4. 設置 **Start Command** 為 `npm start`（通常自動檢測）

### 8. 部署

Railway 會自動開始部署。您可以在 "Deployments" 標籤中查看部署日誌。

### 9. 獲取部署 URL

部署完成後，Railway 會提供一個公共 URL，例如：
```
https://your-app-name.up.railway.app
```

### 10. 測試部署

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

1. 檢查 AI API Key 是否有效（Gemini 或 OpenAI）
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
- [Google Gemini API 文檔](https://ai.google.dev/docs)
- [OpenAI API 文檔](https://platform.openai.com/docs)
- [Google Maps API 文檔](https://developers.google.com/maps/documentation)

