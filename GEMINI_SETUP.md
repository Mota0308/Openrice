# Google Gemini 快速配置指南

## 為什麼選擇 Gemini？

- ✅ **免費額度大**：每分鐘 60 次請求，每月 1500 次
- ✅ **質量高**：接近 GPT-4 的表現
- ✅ **價格便宜**：超過免費額度後價格也很實惠
- ✅ **支持繁體中文**：對中文理解優秀

## 獲取 Gemini API Key

### 步驟 1：訪問 Google AI Studio

1. 打開瀏覽器，訪問：**https://aistudio.google.com/app/apikey**
2. 使用你的 Google 帳號登錄

### 步驟 2：創建 API Key

1. 點擊頁面上的 **"Create API Key"** 按鈕
2. 選擇你的 Google Cloud 項目（如果沒有，會自動創建一個）
3. 複製生成的 API Key（格式類似：`AIzaSy...`）

⚠️ **重要**：請妥善保管你的 API Key，不要分享給他人。

## 在 Railway 上配置

### 方法 1：通過 Railway Dashboard

1. 登錄 Railway：https://railway.app/
2. 選擇你的 **Openrice** 項目
3. 點擊後端服務（backend service）
4. 進入 **Variables** 標籤
5. 添加以下環境變量：

```
AI_PROVIDER=gemini
GEMINI_API_KEY=你的_Gemini_API_Key
GEMINI_MODEL=gemini-pro
```

6. 點擊 **Deploy** 或等待自動重新部署

### 方法 2：通過 Railway CLI

```bash
railway variables set AI_PROVIDER=gemini
railway variables set GEMINI_API_KEY=你的_Gemini_API_Key
railway variables set GEMINI_MODEL=gemini-pro
```

## 驗證配置

部署完成後，測試搜索功能：

1. 訪問你的前端網站
2. 輸入搜索查詢（例如："附近的日式餐廳"）
3. 如果看到 AI 解說面板，說明配置成功！

## 切換回 OpenAI（如果需要）

如果你想使用 OpenAI 而不是 Gemini：

1. 在 Railway Variables 中設置：
   ```
   AI_PROVIDER=openai
   OPENAI_API_KEY=你的_OpenAI_API_Key
   OPENAI_MODEL=gpt-4o-mini
   ```

2. 移除或註釋掉 `GEMINI_API_KEY`（可選）

## 常見問題

### Q: 為什麼搜索時沒有 AI 解說？

**A:** 檢查以下幾點：
1. Railway 環境變量中是否設置了 `GEMINI_API_KEY`
2. `AI_PROVIDER` 是否設置為 `gemini`
3. 查看 Railway 日誌，確認是否有 API 錯誤

### Q: 出現 "Gemini API key not configured" 錯誤？

**A:** 
1. 確認 `GEMINI_API_KEY` 環境變量已正確設置
2. 確認 API Key 格式正確（應該以 `AIzaSy` 開頭）
3. 重新部署服務

### Q: 如何查看 API 使用量？

**A:** 
1. 訪問 https://aistudio.google.com/app/apikey
2. 點擊你的 API Key
3. 查看使用統計和配額

### Q: 免費額度用完了怎麼辦？

**A:** 
1. Gemini 免費額度很大（每月 1500 次），一般不會用完
2. 如果超過免費額度，可以：
   - 升級到付費計劃（價格很便宜）
   - 切換到 OpenAI（需要付費）
   - 等待下個月的免費額度重置

## 相關資源

- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API 文檔](https://ai.google.dev/docs)
- [Railway 文檔](https://docs.railway.app/)

