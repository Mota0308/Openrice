# 性能优化说明

## 🚀 已实施的优化

### 1. 并行化证据获取（方案 1）✅

**优化前**：串行获取证据，每个餐厅依次等待
- 3 个餐厅 × 8 秒 = 24 秒

**优化后**：并行获取证据，同时处理多个餐厅
- 3 个餐厅并行 = 约 8 秒（最快餐厅的时间）

**预期提升**：减少 50-70% 的证据获取时间

**实现位置**：`server/services/evidenceService.js` - `fetchEvidenceForPlaces`

### 2. 减少证据获取的餐厅数量（方案 2）✅

**优化前**：为所有餐厅获取证据（最多 20 个）

**优化后**：只为前 6 个餐厅获取详细证据
- 其他餐厅使用基本信息生成解释

**预期提升**：减少 50-80% 的证据获取时间

**环境变量**：`MAX_EVIDENCE_RESTAURANTS=6`（默认值）

**实现位置**：`server/controllers/searchController.js` - `generateResultsExplanation`

### 3. 优化超时设置（方案 4）✅

**优化前**：
- Places API 超时：8000ms
- 网站抓取超时：8000ms
- robots.txt 超时：6000ms

**优化后**：
- Places API 超时：5000ms（可通过 `PLACES_EVIDENCE_TIMEOUT_MS` 配置）
- 网站抓取超时：5000ms（默认值）
- robots.txt 超时：4000ms
- 网站证据超时：5000ms（可通过 `WEBSITE_EVIDENCE_TIMEOUT_MS` 配置）

**预期提升**：减少等待时间，更快失败并继续处理

**实现位置**：
- `server/services/evidenceService.js` - `fetchPlacesEvidence`
- `server/services/evidenceService.js` - `fetchHtml`
- `server/services/evidenceService.js` - `fetchEvidenceForPlaces`

### 4. 减少 AI 解释的餐厅数量（方案 5）✅

**优化前**：为最多 20 个餐厅生成 AI 解释

**优化后**：为最多 10 个餐厅生成 AI 解释（默认值）

**预期提升**：减少 50% 的 AI 解释生成时间

**环境变量**：`MAX_RESTAURANTS_FOR_EXPLANATION=10`（默认值）

**实现位置**：`server/controllers/searchController.js` - `generateResultsExplanation`

## 📊 性能提升总结

| 优化项 | 优化前 | 优化后 | 提升 |
|--------|--------|--------|------|
| 证据获取（3个餐厅） | ~24秒（串行） | ~8秒（并行） | **70%** ⬇️ |
| 证据获取数量 | 20个 | 6个 | **70%** ⬇️ |
| 超时等待 | 8秒 | 5秒 | **37%** ⬇️ |
| AI 解释数量 | 20个 | 10个 | **50%** ⬇️ |
| **总体提升** | - | - | **60-80%** ⬇️ |

## ⚙️ 环境变量配置

### 推荐配置（平衡速度和体验）

```bash
# 证据获取配置
EVIDENCE_MAX_PLACES=3                    # 最多获取 3 个餐厅的详细证据
MAX_EVIDENCE_RESTAURANTS=6               # 只对前 6 个餐厅获取详细证据
MAX_RESTAURANTS_FOR_EXPLANATION=10       # 为前 10 个餐厅生成 AI 解释

# 超时配置（可选）
PLACES_EVIDENCE_TIMEOUT_MS=5000          # Places API 超时（默认 5000ms）
WEBSITE_EVIDENCE_TIMEOUT_MS=5000         # 网站证据超时（默认 5000ms）

# 功能开关（如果需要最快速度）
ENABLE_WEBSITE_SCRAPE=false              # 禁用网站抓取（最快）
ENABLE_MENU_OCR=false                    # 禁用 OCR（最快）
```

### 最快速度配置（牺牲部分功能）

```bash
EVIDENCE_MAX_PLACES=0                    # 不获取证据（最快）
MAX_EVIDENCE_RESTAURANTS=0               # 不获取详细证据
MAX_RESTAURANTS_FOR_EXPLANATION=5        # 只生成 5 个餐厅的解释
ENABLE_WEBSITE_SCRAPE=false              # 禁用网站抓取
ENABLE_MENU_OCR=false                    # 禁用 OCR
```

### 最佳体验配置（较慢但更详细）

```bash
EVIDENCE_MAX_PLACES=6                    # 获取 6 个餐厅的详细证据
MAX_EVIDENCE_RESTAURANTS=10              # 对前 10 个餐厅获取详细证据
MAX_RESTAURANTS_FOR_EXPLANATION=15       # 为前 15 个餐厅生成 AI 解释
ENABLE_WEBSITE_SCRAPE=true               # 启用网站抓取
ENABLE_MENU_OCR=true                     # 启用 OCR
```

## 🔍 如何验证优化效果

### 1. 查看后端日志

部署后，查看 Railway 日志，应该看到：

```
Fetching evidence for 6 places (out of 10 total)...
Evidence fetched for 6 places
Generating explanation for 10 restaurants (out of 15 total)
```

### 2. 测量响应时间

- **优化前**：证据获取可能需要 20-30 秒
- **优化后**：证据获取应该在 5-10 秒内完成

### 3. 前端体验

- 搜索结果应该更快显示
- AI 解释应该在 10-20 秒内完成（而不是 30-60 秒）

## ⚠️ 注意事项

1. **并行请求限制**：虽然并行化提高了速度，但要注意不要超过 API 限制
2. **证据质量**：减少证据数量可能会影响 AI 解释的质量
3. **超时设置**：如果网络较慢，可能需要增加超时时间
4. **缓存**：证据结果会被缓存，重复搜索会更快

## 🎯 下一步优化建议

如果还需要进一步优化，可以考虑：

1. **实现 Redis 缓存**：缓存搜索结果和证据，减少重复计算
2. **CDN 加速**：对静态资源使用 CDN
3. **数据库索引**：优化 MongoDB 查询
4. **前端懒加载**：只加载可见的餐厅卡片
5. **服务端渲染**：使用 SSR 加快首屏加载

