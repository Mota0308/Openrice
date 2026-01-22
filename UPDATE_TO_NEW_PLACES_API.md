# 更新到 Google Places API (New)

## 🔍 问题分析

错误信息显示：
```
API 請求被拒絕: You're calling a legacy API, which is not activated...
```

这是因为代码使用了**旧的 Google Places API (Legacy)**，而 Google 现在要求使用**新的 Places API (New)**。

## ✅ 已完成的更新

我已经将代码更新为使用新的 Places API (New)：

### 1. 搜索 API 更新

**旧 API (Legacy):**
```javascript
GET https://maps.googleapis.com/maps/api/place/textsearch/json
```

**新 API (New):**
```javascript
POST https://places.googleapis.com/v1/places:searchText
```

### 2. 详情 API 更新

**旧 API (Legacy):**
```javascript
GET https://maps.googleapis.com/maps/api/place/details/json
```

**新 API (New):**
```javascript
GET https://places.googleapis.com/v1/places/{placeId}
```

### 3. 主要变化

1. **请求方式**: GET → POST (searchText)
2. **请求头**: 使用 `X-Goog-Api-Key` 而不是 URL 参数
3. **响应格式**: 完全不同的 JSON 结构
4. **字段名称**: 使用新的字段名（如 `displayName.text` 而不是 `name`）

## 🔧 需要检查的配置

### 1. 启用新的 Places API

在 Google Cloud Console 中：

1. 打开 [Google Cloud Console](https://console.cloud.google.com/)
2. 选择您的项目
3. 进入 **APIs & Services** → **Library**
4. 搜索 **"Places API (New)"**
5. 点击 **Enable**（启用）

⚠️ **重要**: 需要启用 **"Places API (New)"** 而不是旧的 **"Places API"**

### 2. 检查 API Key 权限

确保您的 API Key 有权限访问新的 Places API：

1. 进入 **APIs & Services** → **Credentials**
2. 点击您的 API Key
3. 在 **API restrictions** 中，确保选择了 **"Places API (New)"**

### 3. 检查配额

新的 Places API 有不同的配额限制：

- 免费额度：每月 $200
- 每次搜索请求的费用可能不同

## 📝 代码变化详情

### 搜索请求格式

**旧格式:**
```javascript
GET /maps/api/place/textsearch/json?query=...&location=...&key=...
```

**新格式:**
```javascript
POST /v1/places:searchText
Headers:
  X-Goog-Api-Key: YOUR_API_KEY
  Content-Type: application/json
Body:
{
  "textQuery": "...",
  "locationBias": {
    "circle": {
      "center": { "latitude": ..., "longitude": ... },
      "radius": 5000.0
    }
  },
  "includedType": "restaurant",
  "languageCode": "zh-TW"
}
```

### 响应格式转换

新 API 返回的格式不同，代码会自动转换：

- `displayName.text` → `name`
- `location.latitude/longitude` → `geometry.location.lat/lng`
- `userRatingCount` → `user_ratings_total`
- `nationalPhoneNumber` → `formatted_phone_number`
- `websiteUri` → `website`

## 🚀 部署步骤

1. **提交代码**
   ```bash
   git add .
   git commit -m "Update to Google Places API (New)"
   git push
   ```

2. **等待 Railway 部署**
   - 通常需要 1-2 分钟

3. **测试搜索功能**
   - 在前端输入搜索词
   - 查看是否正常工作

4. **如果仍有错误**
   - 检查 Google Cloud Console 中是否启用了 "Places API (New)"
   - 检查 API Key 权限
   - 查看 Railway 日志中的详细错误信息

## ⚠️ 重要提示

1. **必须启用新的 API**: 旧的 Places API 已被弃用
2. **API Key 权限**: 确保 API Key 有权限访问新的 API
3. **配额限制**: 新 API 的配额和计费可能不同
4. **响应格式**: 新 API 的响应格式完全不同，代码已自动转换

## 🔍 故障排除

### 错误: "API key not valid"
- 检查 API Key 是否正确
- 检查是否启用了 "Places API (New)"

### 错误: "Permission denied"
- 检查 API Key 的权限设置
- 确保在 API restrictions 中选择了 "Places API (New)"

### 错误: "Quota exceeded"
- 检查 API 使用量
- 考虑升级到付费计划

## 📚 参考文档

- [Places API (New) 文档](https://developers.google.com/maps/documentation/places/web-service)
- [Text Search (New)](https://developers.google.com/maps/documentation/places/web-service/text-search)
- [Get Place (New)](https://developers.google.com/maps/documentation/places/web-service/place-details)

