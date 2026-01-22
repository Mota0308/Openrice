# 修复搜索无结果问题

## 🔍 问题分析

您遇到的 CORS 错误是因为在浏览器控制台直接测试了 Google Maps API。**这是正常的**，因为 Google Maps API 不支持 CORS，必须通过后端调用。

## ✅ 已修复的问题

我已经改进了后端错误处理，现在会：

1. **详细记录 Google Places API 响应**
   - 记录 API 状态码
   - 记录错误信息
   - 记录结果数量

2. **处理所有可能的 API 状态**
   - `OK` - 成功
   - `ZERO_RESULTS` - 没有结果
   - `REQUEST_DENIED` - API 密钥问题
   - `OVER_QUERY_LIMIT` - 配额用完
   - `INVALID_REQUEST` - 无效请求

3. **返回详细的错误信息**
   - 前端会收到具体的错误原因
   - 帮助诊断问题

## 🔧 如何测试

### 1. 不要在前端直接调用 Google Maps API

❌ **错误做法**（会导致 CORS 错误）：
```javascript
// 在浏览器控制台直接调用
fetch('https://maps.googleapis.com/maps/api/place/textsearch/json?...')
```

✅ **正确做法**（通过后端）：
```javascript
// 前端通过后端 API 调用
api.post('/api/search', { query, location })
```

### 2. 查看后端日志

在 Railway 中查看后端服务日志：

1. 打开 Railway → openrice-production 项目
2. 点击 "Deployments" → 最新部署 → 查看日志

**现在会看到：**
- `Searching Google Places with:` - 搜索参数
- `Google Places API response status:` - API 状态
- `Google Places API response:` - 完整响应信息
- `Results count:` - 找到的餐厅数量

### 3. 检查常见问题

#### 问题 1: REQUEST_DENIED

**原因：**
- API Key 无效
- 未启用 Places API
- API 限制设置问题

**解决方案：**
1. 检查 Google Cloud Console → APIs & Services → Credentials
2. 确认 API Key 有效
3. 确认已启用 **Places API** 和 **Places API (New)**

#### 问题 2: OVER_QUERY_LIMIT

**原因：**
- API 配额用完（免费额度：每月 $200）

**解决方案：**
- 检查 Google Cloud Console → Dashboard → 查看使用量
- 等待配额重置或升级到付费计划

#### 问题 3: ZERO_RESULTS

**原因：**
- 搜索词太具体
- 位置附近没有匹配的餐厅

**解决方案：**
- 尝试更通用的搜索词（如"餐廳"而不是"火鍋餐廳"）
- 扩大搜索半径
- 检查位置是否正确

#### 问题 4: INVALID_REQUEST

**原因：**
- 搜索参数无效
- 位置坐标格式错误

**解决方案：**
- 检查位置坐标格式（应该是 `{lat: 22.3193, lng: 114.1694}`）
- 检查搜索查询是否为空

## 📝 下一步

1. **部署更新后的代码**
   ```bash
   git add .
   git commit -m "改进搜索错误处理"
   git push
   ```

2. **查看 Railway 日志**
   - 等待部署完成
   - 查看后端服务日志
   - 搜索时查看详细的 API 响应

3. **测试搜索功能**
   - 在前端输入搜索词
   - 查看浏览器控制台（F12）
   - 查看后端日志

4. **根据日志信息诊断**
   - 如果看到 `REQUEST_DENIED`，检查 API Key
   - 如果看到 `OVER_QUERY_LIMIT`，检查配额
   - 如果看到 `ZERO_RESULTS`，尝试其他搜索词

## 🎯 预期结果

搜索时，您应该看到：

**浏览器控制台：**
- `Sending search request:` - 请求信息
- `Search response:` - API 响应

**Railway 后端日志：**
- `Search analysis:` - AI 分析结果
- `Searching Google Places with:` - 搜索参数
- `Google Places API response status:` - API 状态
- `Google Places API response:` - 完整响应
- `Results count:` - 结果数量

## ⚠️ 重要提示

**永远不要在前端直接调用 Google Maps API**，因为：
1. Google Maps API 不支持 CORS
2. 会暴露 API Key（安全风险）
3. 所有 API 调用必须通过后端

所有搜索请求都应该通过 `/api/search` 端点进行。

