# 调试搜索无结果问题

## 🔍 问题分析

从您的截图看到：
- ✅ AI 分析成功（显示了"菜系:火鍋"）
- ❌ 但没有搜索结果

这说明：
- 前端工作正常
- AI 分析成功
- 但 Google Places API 可能没有返回结果

## 📋 检查步骤

### 1. 检查浏览器控制台

打开浏览器开发者工具（F12），查看 Console 标签：

**应该看到：**
- `Sending search request:` - 显示发送的请求
- `Search response:` - 显示 API 响应

**如果有错误：**
- 查看具体的错误信息
- 检查是否是 API 调用失败

### 2. 检查后端日志

在 Railway 中查看后端服务日志：

1. 打开 Railway → openrice-production 项目
2. 点击 "Deployments" → 最新部署 → 查看日志

**应该看到：**
- `Search analysis:` - AI 分析结果
- `Searching Google Places with:` - 搜索参数
- `Google Places API response status:` - API 响应状态
- `Results count:` - 找到的餐厅数量

### 3. 检查环境变量

在 Railway → Variables 中确认：

- ✅ `GOOGLE_MAPS_API_KEY` - 已设置且正确
- ✅ `OPENAI_API_KEY` - 已设置（用于 AI 分析）
- ✅ `MONGODB_URI` - 已设置

### 4. 检查 Google Maps API

**可能的问题：**

1. **API Key 无效**
   - 检查 API Key 是否正确
   - 检查是否已启用 Places API

2. **API 配额用完**
   - 检查 Google Cloud Console 中的使用量
   - 免费额度：每月 $200

3. **API 限制**
   - 检查 IP 限制设置
   - 检查 API 限制配置

### 5. 测试 API 直接调用

在浏览器控制台测试：

```javascript
// 测试 Google Places API
fetch('https://maps.googleapis.com/maps/api/place/textsearch/json?query=火鍋餐廳&location=22.3193,114.1694&radius=5000&type=restaurant&key=YOUR_API_KEY&language=zh-TW')
  .then(r => r.json())
  .then(data => console.log('API Response:', data));
```

## 🔧 可能的原因和解决方案

### 原因 1: Google Places API 返回 ZERO_RESULTS

**解决方案：**
- 尝试更通用的搜索词（如"餐廳"而不是"火鍋"）
- 扩大搜索半径
- 检查位置是否正确（香港坐标）

### 原因 2: API Key 问题

**检查：**
1. Google Cloud Console → APIs & Services → Credentials
2. 确认 API Key 有效
3. 确认已启用 Places API

### 原因 3: 位置信息问题

**检查：**
- 前端显示的位置信息
- 后端收到的位置坐标
- 确保是香港的有效坐标

### 原因 4: API 配额或限制

**检查：**
- Google Cloud Console → APIs & Services → Dashboard
- 查看使用量和配额
- 检查是否有错误

## 🛠️ 快速修复

### 步骤 1: 检查后端日志

查看 Railway 日志，查找：
- Google Places API 的错误信息
- API 响应状态

### 步骤 2: 测试 API Key

在浏览器中直接测试 Google Places API（替换 YOUR_API_KEY）：

```
https://maps.googleapis.com/maps/api/place/textsearch/json?query=restaurant&location=22.3193,114.1694&radius=5000&type=restaurant&key=YOUR_API_KEY&language=zh-TW
```

### 步骤 3: 检查 API 响应

如果 API 返回错误，查看错误信息：
- `REQUEST_DENIED` - API Key 无效或未启用 Places API
- `OVER_QUERY_LIMIT` - 配额用完
- `ZERO_RESULTS` - 没有找到结果

## 📝 改进的代码

我已经添加了：
1. ✅ 更详细的日志输出
2. ✅ 更好的错误处理
3. ✅ 空结果的提示信息
4. ✅ API Key 检查

## 🔍 下一步

1. **查看浏览器控制台** - 查看具体的错误信息
2. **查看 Railway 日志** - 查看后端 API 调用情况
3. **测试 Google Places API** - 直接测试 API 是否工作

请告诉我您在控制台或日志中看到的错误信息，我可以帮您进一步诊断。

