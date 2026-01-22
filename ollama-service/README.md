# Ollama 服务部署指南

这是一个独立的 Ollama 服务，用于在 Railway 上运行本地大语言模型。

## 部署步骤

### 1. 在 Railway 创建新服务

1. 登录 Railway：https://railway.app/
2. 在你的项目中，点击 **"New Service"**
3. 选择 **"Empty Service"** 或 **"Deploy from GitHub repo"**
4. 如果选择 GitHub，选择包含 `ollama-service` 目录的仓库

### 2. 配置服务

#### 方法 A：使用 Dockerfile（推荐）

1. 在 Railway 服务设置中：
   - **Root Directory**: `ollama-service`
   - **Build Command**: （自动检测 Dockerfile）
   - **Start Command**: `ollama serve`

2. Railway 会自动使用 Dockerfile 构建

#### 方法 B：使用 Nixpacks

如果 Railway 自动检测到 Node.js，可以创建 `nixpacks.toml`：

```toml
[phases.setup]
nixPkgs = ["curl"]

[phases.install]
cmds = [
  "curl -fsSL https://ollama.com/install.sh | sh"
]

[start]
cmd = "ollama serve"
```

### 3. 设置环境变量（可选）

在 Railway 服务中添加：

```
# 可选：预下载模型（在启动时）
OLLAMA_MODEL=llama2:7b
```

### 4. 资源要求

⚠️ **重要**：Ollama 需要大量资源！

**最小要求：**
- **RAM**: 至少 4GB（推荐 8GB+）
- **存储**: 至少 10GB（用于模型文件）
- **CPU**: 2+ 核心

**推荐配置：**
- **RAM**: 8GB+
- **存储**: 20GB+
- **CPU**: 4+ 核心

**模型大小参考：**
- `tinyllama`: ~637MB（需要 ~2GB RAM）
- `phi-2`: ~1.6GB（需要 ~4GB RAM）
- `llama2:7b`: ~3.8GB（需要 ~8GB RAM）
- `llama2:13b`: ~7.3GB（需要 ~16GB RAM）

### 5. 首次部署

首次部署时，Ollama 需要下载模型，这可能需要：
- **时间**: 10-30 分钟（取决于模型大小和网络速度）
- **存储**: 确保有足够空间

### 6. 预下载模型（可选）

如果你想在构建时预下载模型，可以修改 Dockerfile：

```dockerfile
FROM ollama/ollama:latest

# 预下载模型（构建时）
RUN ollama pull llama2:7b

EXPOSE 11434
CMD ["ollama", "serve"]
```

⚠️ **注意**：这会使构建时间大大增加（10-30 分钟），但可以避免首次请求时的延迟。

### 7. 获取服务 URL

部署完成后，Railway 会提供一个 URL，例如：
```
https://ollama-service-production.up.railway.app
```

**重要**：Ollama 默认端口是 11434，但 Railway 会自动映射到 80/443。

### 8. 测试服务

```bash
# 检查服务是否运行
curl https://your-ollama-service.up.railway.app/api/tags

# 测试生成
curl https://your-ollama-service.up.railway.app/api/generate -d '{
  "model": "llama2:7b",
  "prompt": "Hello, how are you?",
  "stream": false
}'
```

### 9. 配置后端服务

在你的主后端服务（OpenRice）中，设置环境变量：

```
AI_PROVIDER=ollama
OLLAMA_API_URL=https://your-ollama-service.up.railway.app
OLLAMA_MODEL=llama2:7b
```

## 常见问题

### Q: 服务启动失败，提示内存不足？

**A:** 
1. 升级 Railway 计划到至少 4GB RAM
2. 或使用更小的模型（如 `tinyllama` 或 `phi-2`）

### Q: 首次请求很慢？

**A:** 
- 首次请求需要加载模型到内存，可能需要 30-60 秒
- 后续请求会快很多（但仍比云端 API 慢）

### Q: 如何查看模型列表？

**A:** 
```bash
curl https://your-ollama-service.up.railway.app/api/tags
```

### Q: 如何下载新模型？

**A:** 
1. 通过 API：
```bash
curl https://your-ollama-service.up.railway.app/api/pull -d '{
  "name": "phi-2"
}'
```

2. 或 SSH 到容器中运行 `ollama pull <model>`

### Q: 服务重启后模型丢失？

**A:** 
- Railway 的存储是持久的，模型文件不会丢失
- 但容器重启后需要重新加载模型到内存（首次请求会慢）

## 性能优化

1. **使用更小的模型**：`tinyllama` 或 `phi-2` 响应更快
2. **增加超时时间**：后端 API 调用超时设置为 60-120 秒
3. **预热服务**：定期发送请求保持模型在内存中
4. **使用 GPU**：如果 Railway 支持 GPU，性能会大幅提升（但通常不支持）

## 成本考虑

- **Railway 免费计划**：通常不足以运行 Ollama
- **Railway Pro 计划**：$20/月起，包含更多资源
- **对比**：Gemini 免费额度通常更经济实惠

## 相关资源

- [Ollama 官方文档](https://ollama.ai/docs)
- [Ollama GitHub](https://github.com/ollama/ollama)
- [Railway 文档](https://docs.railway.app/)

