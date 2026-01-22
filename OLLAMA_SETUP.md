# Ollama 快速配置指南

## 为什么选择 Ollama？

- ✅ **完全免费**：无需 API Key，无使用限制
- ✅ **数据隐私**：模型在本地运行，数据不会上传到第三方
- ✅ **可自定义**：可以选择不同的模型
- ✅ **离线运行**：本地部署时不需要网络连接

## Railway 部署步骤

### 步骤 1：创建 Ollama 服务

1. 登录 Railway：https://railway.app/
2. 在你的项目中，点击 **"New Service"**
3. 选择 **"Empty Service"**
4. 在服务设置中：
   - **Root Directory**: `ollama-service`
   - Railway 会自动检测 Dockerfile 并构建

### 步骤 2：配置资源

⚠️ **重要**：Ollama 需要大量资源！

**最小要求：**
- **RAM**: 至少 4GB（推荐 8GB+）
- **存储**: 至少 10GB（用于模型文件）

**推荐配置：**
- **RAM**: 8GB+
- **存储**: 20GB+
- **CPU**: 4+ 核心

⚠️ Railway 免费计划通常不足以运行 Ollama，需要升级到付费计划。

### 步骤 3：选择模型

**推荐的小模型（资源需求较低）：**

| 模型 | 大小 | RAM 需求 | 质量 | 推荐场景 |
|------|------|----------|------|----------|
| `tinyllama` | 637MB | ~2GB | ⭐⭐ | 测试、开发 |
| `phi-2` | 1.6GB | ~4GB | ⭐⭐⭐ | 小规模生产 |
| `llama2:7b` | 3.8GB | ~8GB | ⭐⭐⭐⭐ | 生产环境 |

**设置模型：**

在 Railway Ollama 服务的环境变量中（可选）：
```
OLLAMA_MODEL=phi-2
```

或在首次部署后通过 API 下载：
```bash
curl https://your-ollama-service.up.railway.app/api/pull -d '{
  "name": "phi-2"
}'
```

### 步骤 4：获取服务 URL

部署完成后，Railway 会提供一个 URL，例如：
```
https://ollama-service-production.up.railway.app
```

### 步骤 5：配置主后端服务

在你的 OpenRice 后端服务中，添加环境变量：

```
AI_PROVIDER=ollama
OLLAMA_API_URL=https://your-ollama-service.up.railway.app
OLLAMA_MODEL=phi-2
```

### 步骤 6：测试

1. **测试 Ollama 服务**：
   ```bash
   curl https://your-ollama-service.up.railway.app/api/tags
   ```

2. **测试后端连接**：
   - 访问你的前端网站
   - 输入搜索查询
   - 如果看到 AI 解说面板，说明配置成功！

## 本地开发设置

如果你想在本地测试 Ollama：

### 1. 安装 Ollama

- **Windows**: 下载 https://ollama.com/download/windows
- **Mac**: `brew install ollama` 或下载安装包
- **Linux**: `curl -fsSL https://ollama.com/install.sh | sh`

### 2. 下载模型

```bash
ollama pull phi-2
```

### 3. 启动服务

```bash
ollama serve
```

服务会在 `http://localhost:11434` 运行

### 4. 配置环境变量

在 `server/.env` 中：
```env
AI_PROVIDER=ollama
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=phi-2
```

## 常见问题

### Q: 服务启动失败，提示内存不足？

**A:** 
1. 升级 Railway 计划到至少 4GB RAM
2. 或使用更小的模型（如 `tinyllama` 或 `phi-2`）

### Q: 首次请求很慢（30-60 秒）？

**A:** 
- 首次请求需要加载模型到内存，这是正常的
- 后续请求会快很多（但仍比云端 API 慢，通常 5-15 秒）

### Q: 如何查看可用的模型？

**A:** 
```bash
curl https://your-ollama-service.up.railway.app/api/tags
```

### Q: 如何下载新模型？

**A:** 
```bash
curl https://your-ollama-service.up.railway.app/api/pull -d '{
  "name": "llama2:7b"
}'
```

### Q: 服务重启后模型丢失？

**A:** 
- Railway 的存储是持久的，模型文件不会丢失
- 但容器重启后需要重新加载模型到内存（首次请求会慢）

### Q: 响应时间太长怎么办？

**A:** 
1. 使用更小的模型（`phi-2` 或 `tinyllama`）
2. 增加后端 API 超时时间（已设置为 60 秒）
3. 考虑使用云端 API（Gemini 或 OpenAI）以获得更快响应

### Q: Railway 免费计划可以运行吗？

**A:** 
- 通常不行，免费计划只有 512MB RAM
- 建议升级到至少 4GB RAM 的计划
- 或使用云端 API（Gemini 免费额度很大）

## 性能对比

| 方案 | 响应时间 | 成本 | 隐私 | 推荐度 |
|------|----------|------|------|--------|
| Ollama (phi-2) | 5-15 秒 | 免费（但需服务器资源） | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Gemini | 1-3 秒 | 免费额度大 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| OpenAI | 1-3 秒 | 付费 | ⭐⭐⭐ | ⭐⭐⭐⭐ |

## 相关资源

- [Ollama 官方文档](https://ollama.ai/docs)
- [Ollama GitHub](https://github.com/ollama/ollama)
- [Railway 文档](https://docs.railway.app/)
- [ollama-service/README.md](./ollama-service/README.md) - 详细部署指南

