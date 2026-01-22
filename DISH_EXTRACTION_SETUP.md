# 菜品提取功能配置指南

## 📋 功能概述

系统现在支持三种方式提取餐厅菜品信息：

1. **方案 C：从评论文本提取菜品**（已启用，无需配置）
   - 自动从 Google Places 评论中提取菜品提及
   - 无需额外配置

2. **方案 B：从餐牌图片 OCR 提取菜单**（需要启用）
   - 使用 Tesseract.js 对餐厅网站的菜单图片进行 OCR
   - 需要设置环境变量启用

3. **方案 D：增强 AI Prompt**（已启用）
   - AI 会优先使用提取的菜品信息
   - 无需额外配置

## 🚀 启用步骤

### 1. 安装 Tesseract.js 依赖

Tesseract.js 已经添加到 `package.json`，但需要安装：

```bash
cd server
npm install
```

### 2. 启用网站抓取（如果还没启用）

在 **后端服务（openrice-production）→ Variables** 中添加：

```
ENABLE_WEBSITE_SCRAPE=true
```

### 3. 启用菜单图片 OCR（方案 B）

在 **后端服务（openrice-production）→ Variables** 中添加：

```
ENABLE_MENU_OCR=true
```

**注意：**
- OCR 处理会比较慢（每张图片可能需要 5-15 秒）
- 建议只在需要时启用，或限制处理的图片数量

### 4. 可选：调整 OCR 参数

如果需要调整 OCR 行为，可以设置：

```
# OCR 超时时间（毫秒，默认无限制）
OCR_TIMEOUT_MS=30000

# 最多处理的菜单图片数量（默认 3）
OCR_MAX_IMAGES=3
```

## 📊 菜品提取优先级

系统按以下优先级使用菜品信息：

1. **最高优先级**：`evidence.place.dishesFromReviews`
   - 从评论中提取的菜品（最真实可靠）
   - 自动启用，无需配置

2. **第二优先级**：`evidence.website.menuImageItems`
   - 从餐牌图片 OCR 提取的菜品
   - 需要设置 `ENABLE_MENU_OCR=true`

3. **第三优先级**：`evidence.website.menuItems`
   - 从网站 JSON-LD 提取的菜单项
   - 需要设置 `ENABLE_WEBSITE_SCRAPE=true`

4. **第四优先级**：`evidence.website.menuCandidates`
   - 从网站 HTML 解析的菜品候选
   - 需要设置 `ENABLE_WEBSITE_SCRAPE=true`

5. **最后备选**：从餐厅名称推断
   - 如果没有任何证据，从餐厅名称提取关键词

## 🔍 验证功能

### 检查评论提取（方案 C）

查看后端日志，应该看到：
```
Evidence fetched for X places
```

检查 `evidence.place.dishesFromReviews` 是否包含菜品。

### 检查图片 OCR（方案 B）

如果启用了 `ENABLE_MENU_OCR=true`，查看后端日志：
```
Performing OCR on menu image: https://...
Extracted X dishes from menu image
```

### 检查 AI 解释

搜索后，查看 AI 解释中的 `suggestedDishes` 和 `evidenceNotes`：
- `evidenceNotes` 应该标注使用了哪些证据
- `suggestedDishes` 应该包含从证据中提取的具体菜品

## ⚠️ 注意事项

### OCR 性能

- OCR 处理比较慢，每张图片可能需要 5-15 秒
- 建议限制处理的图片数量（默认最多 3 张）
- 如果网站没有菜单图片，OCR 不会执行

### 评论提取

- 只处理 Google Places API 返回的评论（最多 5 条）
- 提取的菜品基于文本模式匹配，可能不够准确
- 建议结合其他证据使用

### 成本考虑

- OCR 会增加处理时间，可能影响响应速度
- 建议在异步解释生成中使用（已实现）
- 可以考虑缓存 OCR 结果

## 🐛 故障排除

### OCR 失败

如果看到 `OCR failed for menu image`：
- 检查图片 URL 是否可访问
- 检查图片格式是否支持（jpg, jpeg, png, webp）
- 检查图片是否真的是菜单（不是 logo 或其他图片）

### 没有提取到菜品

如果 `dishesFromReviews` 或 `menuImageItems` 为空：
- 检查评论中是否真的提到了菜品
- 检查网站是否有菜单图片
- 检查 `ENABLE_WEBSITE_SCRAPE` 和 `ENABLE_MENU_OCR` 是否已启用

### AI 没有使用提取的菜品

如果 AI 解释中没有使用提取的菜品：
- 检查 `evidence` 对象是否包含 `dishesFromReviews` 或 `menuImageItems`
- 检查 AI prompt 是否正确（应该优先使用这些字段）
- 查看后端日志中的 `evidence` 内容

## 📝 环境变量总结

| 变量名 | 必需 | 默认值 | 说明 |
|--------|------|--------|------|
| `ENABLE_WEBSITE_SCRAPE` | 否 | `false` | 启用网站抓取 |
| `ENABLE_MENU_OCR` | 否 | `false` | 启用菜单图片 OCR |
| `EVIDENCE_MAX_PLACES` | 否 | `3` | 最多处理多少个餐厅的证据 |
| `EVIDENCE_CACHE_TTL_MS` | 否 | `6小时` | 证据缓存时间 |

## ✅ 推荐配置

对于生产环境，推荐：

```
ENABLE_WEBSITE_SCRAPE=true
ENABLE_MENU_OCR=true
EVIDENCE_MAX_PLACES=6  # 增加处理的餐厅数量
```

这样可以在合理的时间内获取更多菜品信息。

