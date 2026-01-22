# 設置指南

## 環境變量配置

### 後端環境變量 (server/.env)

在 `server` 目錄下創建 `.env` 文件，並添加以下內容：

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/openrice

# AI 提供商選擇：'ollama'（默認，本地模型）、'openai' 或 'gemini'
AI_PROVIDER=ollama

# Ollama 配置（推薦，完全免費，數據隱私）
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=llama2:7b

# Google Gemini API Key（可選）
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-pro

# OpenAI API Key（可選）
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini

# Google Maps API Key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### 前端環境變量 (client/.env)

在 `client` 目錄下創建 `.env` 文件，並添加以下內容：

```env
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

## 獲取 API 密鑰

### 1. Ollama（推薦，完全免費）

**為什麼選擇 Ollama？**
- ✅ **完全免費**：無需 API Key，無使用限制
- ✅ **數據隱私**：模型在本地運行，數據不會上傳到第三方
- ✅ **可自定義**：可以選擇不同的模型
- ✅ **離線運行**：不需要網絡連接（本地部署時）

**設置步驟：**

#### 本地開發

1. **安裝 Ollama**：
   - Windows: 下載 https://ollama.com/download/windows
   - Mac: `brew install ollama` 或下載安裝包
   - Linux: `curl -fsSL https://ollama.com/install.sh | sh`

2. **下載模型**（首次使用）：
   ```bash
   ollama pull llama2:7b
   ```
   
   推薦的小模型（資源需求較低）：
   - `tinyllama` (637MB) - 最小，適合測試
   - `phi-2` (1.6GB) - 小但質量不錯
   - `llama2:7b` (3.8GB) - 平衡質量和資源

3. **啟動 Ollama 服務**：
   ```bash
   ollama serve
   ```
   服務會在 `http://localhost:11434` 運行

4. **配置環境變量**：
   在 `server/.env` 中設置：
   ```env
   AI_PROVIDER=ollama
   OLLAMA_API_URL=http://localhost:11434
   OLLAMA_MODEL=llama2:7b
   ```

#### Railway 部署

1. **創建獨立的 Ollama 服務**：
   - 參考 `ollama-service/README.md` 進行部署
   - 獲取 Ollama 服務的 Railway URL

2. **配置主後端服務**：
   在 Railway 後端服務的環境變量中設置：
   ```env
   AI_PROVIDER=ollama
   OLLAMA_API_URL=https://your-ollama-service.up.railway.app
   OLLAMA_MODEL=llama2:7b
   ```

⚠️ **注意**：
- Ollama 需要大量資源（至少 4GB RAM，推薦 8GB+）
- Railway 免費計劃可能不足以運行 Ollama
- 首次請求可能較慢（需要加載模型到內存）
- 建議使用較小的模型（如 `phi-2` 或 `tinyllama`）以節省資源

### 2. Google Gemini API Key（可選）

**為什麼選擇 Gemini？**
- 免費額度大：每分鐘 60 次請求，每月 1500 次
- 質量接近 GPT-4
- 價格便宜（超過免費額度後）
- 支持繁體中文

**獲取步驟：**
1. 訪問 https://aistudio.google.com/app/apikey
2. 使用 Google 帳號登錄
3. 點擊 "Create API Key"
4. 複製 API Key 並保存到 `server/.env` 文件的 `GEMINI_API_KEY`
5. 設置 `AI_PROVIDER=gemini`（這是默認值）

**注意：** 如果使用 Gemini，不需要設置 `OPENAI_API_KEY`。

### 2. OpenAI API Key（可選）

如果你想使用 OpenAI 而不是 Gemini：

1. 訪問 https://platform.openai.com/
2. 註冊或登錄帳號
3. 前往 API Keys 頁面
4. 創建新的 API Key
5. 複製並保存到 `server/.env` 文件
6. 設置 `AI_PROVIDER=openai`

### 4. Google Maps API Key

1. 訪問 https://console.cloud.google.com/
2. 創建新項目或選擇現有項目
3. 啟用以下 API：
   - Places API
   - Maps JavaScript API
   - Geocoding API
   - Directions API
4. 前往「憑證」頁面
5. 創建 API 密鑰
6. 將 API Key 添加到 `server/.env` 和 `client/.env` 文件

### 3. MongoDB

#### 選項 A: 本地 MongoDB

1. 安裝 MongoDB: https://www.mongodb.com/try/download/community
2. 啟動 MongoDB 服務
3. 使用默認連接字符串：`mongodb://localhost:27017/openrice`

#### 選項 B: MongoDB Atlas (雲端)

1. 訪問 https://www.mongodb.com/cloud/atlas
2. 創建免費帳號
3. 創建新集群
4. 獲取連接字符串
5. 將連接字符串添加到 `server/.env` 文件

## 安裝依賴

在項目根目錄運行：

```bash
npm run install-all
```

這將安裝：
- 根目錄的依賴
- 後端 (server) 的依賴
- 前端 (client) 的依賴

## 啟動應用

### 開發模式（同時啟動前端和後端）

```bash
npm run dev
```

### 分別啟動

**後端：**
```bash
npm run server
```

**前端：**
```bash
npm run client
```

## 訪問應用

- 前端：http://localhost:3000
- 後端 API：http://localhost:5000

## 故障排除

### MongoDB 連接錯誤

- 確保 MongoDB 服務正在運行
- 檢查 `MONGODB_URI` 是否正確
- 如果使用 MongoDB Atlas，確保 IP 地址已添加到白名單

### API 錯誤

- 檢查 API 密鑰是否正確設置
- 確保已啟用所需的 Google Maps API
- 檢查 API 配額是否已用完

### 端口衝突

如果端口 3000 或 5000 已被占用，可以：
- 修改 `server/.env` 中的 `PORT`
- 修改 `client/package.json` 中的啟動腳本

