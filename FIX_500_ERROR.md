# 修复 500 内部服务器错误

## 🔍 问题分析

您遇到了 500 内部服务器错误，这意味着后端在处理搜索请求时出现了未捕获的异常。

## ✅ 已完成的改进

我已经改进了错误处理和日志记录：

1. **详细的请求日志**
   - 记录每个搜索请求的参数
   - 记录时间戳

2. **改进的错误处理**
   - 每个步骤都有独立的错误处理
   - 数据库操作失败不会导致整个请求失败
   - 单个餐厅处理失败不会影响其他餐厅

3. **详细的错误日志**
   - 记录错误消息
   - 记录错误堆栈
   - 记录 API 响应详情

4. **OpenAI API 检查**
   - 检查 API Key 是否设置
   - 验证响应格式
   - 更好的错误处理

## 🔧 如何诊断问题

### 1. 查看 Railway 后端日志

在 Railway 中查看后端服务日志：

1. 打开 Railway → openrice-production 项目
2. 点击 "Deployments" → 最新部署 → 查看日志
3. 搜索时查看详细的错误信息

**现在会看到：**
- `Search request received:` - 请求参数
- `Search analysis:` - AI 分析结果
- `Searching Google Places with:` - 搜索参数
- `Google Places API response status:` - API 状态
- `Processing X places...` - 处理进度
- `Error processing place:` - 单个餐厅的错误
- `Search error:` - 最终错误信息

### 2. 检查环境变量

在 Railway → Variables 中确认：

- ✅ `GOOGLE_MAPS_API_KEY` - 已设置且正确
- ✅ `OPENAI_API_KEY` - 已设置（可选，失败时会使用备用分析）
- ✅ `MONGODB_URI` - 已设置

### 3. 可能的原因

#### 原因 1: OpenAI API 问题

**症状：**
- 日志显示 `OpenAI API error:`
- 错误消息包含 `401` 或 `Invalid API key`

**解决方案：**
- 检查 `OPENAI_API_KEY` 是否正确
- 如果 API Key 无效，系统会自动使用备用分析（基于关键词）

#### 原因 2: Google Places API 问题

**症状：**
- 日志显示 `Google Places API error:`
- 错误消息包含 `REQUEST_DENIED` 或 `OVER_QUERY_LIMIT`

**解决方案：**
- 检查 `GOOGLE_MAPS_API_KEY` 是否正确
- 检查是否已启用 Places API
- 检查 API 配额

#### 原因 3: 数据库连接问题

**症状：**
- 日志显示 `Database error for place`
- MongoDB 连接错误

**解决方案：**
- 检查 `MONGODB_URI` 是否正确
- 检查 MongoDB Atlas 网络访问设置
- 注意：数据库错误不会导致整个请求失败，只会跳过保存操作

#### 原因 4: 位置信息格式问题

**症状：**
- 日志显示 `location is invalid`
- 位置坐标格式错误

**解决方案：**
- 确保位置格式为 `{lat: number, lng: number}`
- 检查坐标是否有效

## 📝 测试步骤

1. **部署更新后的代码**
   ```bash
   git add .
   git commit -m "改进错误处理和日志记录"
   git push
   ```

2. **等待部署完成**
   - Railway 会自动部署
   - 通常需要 1-2 分钟

3. **测试搜索功能**
   - 在前端输入搜索词
   - 查看浏览器控制台（F12）
   - 查看 Railway 后端日志

4. **根据日志诊断**
   - 查看具体的错误信息
   - 根据错误类型采取相应的解决方案

## 🎯 预期结果

搜索时，您应该看到：

**Railway 后端日志：**
```
Search request received: { query: '火鍋', location: { lat: 22.3193, lng: 114.1694 }, timestamp: '...' }
Search analysis: { cuisine: '火鍋', ... }
Searching Google Places with: { query: '火鍋 火鍋', location: '22.3193,114.1694', radius: 5000 }
Google Places API response status: OK
Google Places API response: { status: 'OK', resultsCount: 10, ... }
Processing 10 places...
Processing place 1/10: ChIJ...
Valid restaurants: 10
```

**如果出现错误：**
```
Search error: Error message here
Error message: Detailed error message
Error stack: Error stack trace
```

## ⚠️ 重要提示

1. **查看 Railway 日志** - 这是诊断问题的最佳方式
2. **检查环境变量** - 确保所有 API Key 都正确设置
3. **错误不会中断处理** - 单个餐厅处理失败不会影响其他餐厅
4. **数据库错误可恢复** - 数据库保存失败不会导致整个请求失败

## 🔍 下一步

1. 部署更新后的代码
2. 查看 Railway 日志中的详细错误信息
3. 根据错误信息采取相应的解决方案

如果问题仍然存在，请告诉我 Railway 日志中显示的具体错误信息。

