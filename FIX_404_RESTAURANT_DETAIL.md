# 修复餐厅详情 404 错误

## 🔍 问题分析

错误信息显示：
```
GET /api/restaurants/ChIJIen4TrMABDQR0g9fEQKnmcg 404 (Not Found)
```

这是因为新的 Google Places API (New) 返回的 place ID 格式可能与旧的 API 不同，导致无法正确查找餐厅。

## ✅ 已完成的修复

我已经修复了以下问题：

### 1. Place ID 格式标准化

**问题：**
- 新 API 可能返回 `places/ChIJIen4TrMABDQR0g9fEQKnmcg` 格式
- 旧 API 返回 `ChIJIen4TrMABDQR0g9fEQKnmcg` 格式
- 数据库查找时格式不匹配导致 404

**解决方案：**
- 在保存到数据库时，统一移除 `places/` 前缀
- 在查找时，同时尝试两种格式
- 在调用 API 时，标准化 place ID

### 2. 改进的错误处理

- 添加详细的日志记录
- 改进错误消息
- 处理各种 place ID 格式

### 3. 数据库查找优化

- 首先尝试标准格式查找
- 如果没找到，尝试带 `places/` 前缀的格式
- 如果数据库中没有，从 API 获取

## 🔧 代码变化

### `restaurantController.js`

1. **标准化 place ID**
   ```javascript
   // 移除 "places/" 前缀（如果存在）
   let normalizedPlaceId = placeId;
   if (placeId.startsWith('places/')) {
     normalizedPlaceId = placeId.replace('places/', '');
   }
   ```

2. **数据库查找**
   ```javascript
   // 尝试标准格式
   let restaurant = await Restaurant.findOne({ placeId });
   
   // 如果没找到，尝试带前缀的格式
   if (!restaurant && !placeId.startsWith('places/')) {
     restaurant = await Restaurant.findOne({ placeId: `places/${placeId}` });
   }
   ```

3. **API 调用**
   ```javascript
   // 标准化 place ID 后再调用 API
   let normalizedPlaceId = placeId;
   if (placeId.startsWith('places/')) {
     normalizedPlaceId = placeId.replace('places/', '');
   }
   ```

### `searchController.js`

1. **搜索结果标准化**
   ```javascript
   // 在转换搜索结果时标准化 place ID
   let normalizedPlaceId = place.id;
   if (place.id && place.id.startsWith('places/')) {
     normalizedPlaceId = place.id.replace('places/', '');
   }
   ```

## 📝 部署步骤

1. **提交代码**
   ```bash
   git add .
   git commit -m "Fix restaurant detail 404 error - normalize place ID format"
   git push
   ```

2. **等待 Railway 部署**
   - 通常需要 1-2 分钟

3. **测试餐厅详情**
   - 搜索餐厅
   - 点击查看详情
   - 应该能正常显示

## 🎯 预期结果

修复后，餐厅详情页面应该：

1. ✅ 能正确从数据库查找餐厅
2. ✅ 如果数据库中没有，能从 API 获取
3. ✅ 正确处理各种 place ID 格式
4. ✅ 显示详细的错误信息（如果仍有问题）

## ⚠️ 重要提示

1. **Place ID 格式**: 新 API 可能返回不同的格式，代码已自动处理
2. **数据库兼容性**: 代码会同时支持新旧两种格式
3. **错误处理**: 如果仍有 404 错误，查看 Railway 日志获取详细信息

## 🔍 故障排除

### 如果仍有 404 错误

1. **查看 Railway 日志**
   - 检查 `Fetching restaurant:` 日志
   - 查看 place ID 格式
   - 检查 API 调用是否成功

2. **检查 place ID**
   - 确认 place ID 格式是否正确
   - 检查是否包含特殊字符

3. **检查 API Key**
   - 确认 Google Maps API Key 正确
   - 确认已启用 Places API (New)

## 📚 相关文档

- [Places API (New) - Get Place](https://developers.google.com/maps/documentation/places/web-service/place-details)
- [Place ID 格式说明](https://developers.google.com/maps/documentation/places/web-service/place-id)

