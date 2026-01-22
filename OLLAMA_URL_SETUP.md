# Ollama 服务 URL 配置指南

## ✅ 服务状态确认

从你的日志可以看到，Ollama 服务已经成功启动：
- ✅ 服务运行中（监听在端口 11434）
- ✅ 版本：0.14.3
- ✅ 内存充足（7.5 GiB 总内存，7.4 GiB 可用）
- ✅ 使用 CPU 模式（适合 phi-2 模型）

## 📋 下一步：获取公共 URL

### 步骤 1：生成公共域名

1. 在 Railway 中，进入你的 **AI 服务**（Ollama 服务）
2. 点击 **Settings** 标签
3. 找到 **"Public Networking"** 部分
4. 点击紫色的 **"Generate Domain"** 按钮
5. Railway 会生成一个 URL，例如：
   ```
   https://ai-production-xxxxx.up.railway.app
   ```

### 步骤 2：测试服务

生成 URL 后，在浏览器或命令行测试：

```bash
# 测试服务是否可访问
curl https://your-generated-url.up.railway.app/api/tags

# 应该返回 JSON（可能是空数组 [] 或模型列表）
```

如果返回 JSON，说明服务正常。

### 步骤 3：下载模型（如果需要）

如果你的 `OLLAMA_MODEL=phi-2`，但模型还没下载，可以通过 API 下载：

```bash
curl https://your-generated-url.up.railway.app/api/pull -d '{
  "name": "phi-2"
}'
```

或者等待首次请求时自动下载（但会比较慢）。

### 步骤 4：配置后端服务

1. 在 Railway 中，进入你的 **后端服务**（openrice-production）
2. 点击 **Variables** 标签
3. 找到 `OLLAMA_API_URL`
4. 将值从占位符：
   ```
   https://your-ollama-service.up.railway.app
   ```
   改为你刚生成的真实 URL：
   ```
   https://ai-production-xxxxx.up.railway.app
   ```
5. 保存更改

### 步骤 5：验证配置

1. 后端服务会自动重新部署
2. 查看后端服务的日志，应该能看到：
   ```
   Calling Ollama API at https://ai-production-xxxxx.up.railway.app with model phi-2
   ```
3. 如果看到连接错误，检查：
   - Ollama 服务是否正常运行
   - URL 是否正确（包含 `https://`）
   - 模型是否已下载

## 🔍 常见问题

### Q: 测试 URL 返回 404？

**A:** 
- 检查服务是否完全部署完成
- 确认 Start Command 是 `ollama serve`
- 等待几分钟后重试

### Q: 测试 URL 返回空数组 `[]`？

**A:** 
- 这是正常的，说明服务运行正常
- 模型会在首次请求时自动下载
- 或者手动通过 API 下载模型

### Q: 后端连接失败？

**A:** 
- 确认 `OLLAMA_API_URL` 是完整的 URL（包含 `https://`）
- 确认没有多余的空格或引号
- 检查后端日志获取详细错误信息

### Q: 模型下载很慢？

**A:** 
- 首次下载 `phi-2`（1.6GB）可能需要 5-10 分钟
- 可以在 Ollama 服务的 Variables 中设置 `OLLAMA_MODEL=phi-2`，让它在启动时预下载
- 或者使用更小的模型（如 `tinyllama`，637MB）

## 📝 完整配置清单

### Ollama 服务（AI 服务）

- [x] 服务已部署
- [x] 服务运行正常（从日志确认）
- [ ] 已生成公共域名
- [ ] 测试 URL 可访问
- [ ] 模型已下载（phi-2）

### 后端服务（openrice-production）

- [ ] `OLLAMA_API_URL` 已设置为真实 URL
- [ ] `OLLAMA_MODEL` 已设置（phi-2）
- [ ] `AI_PROVIDER` 已设置为 `ollama`
- [ ] 后端服务已重新部署
- [ ] 后端日志显示连接成功

## 🎯 快速验证

部署完成后，测试搜索功能：

1. 访问前端网站
2. 输入搜索查询（例如："附近的日式餐厅"）
3. 如果看到 AI 解说面板，说明配置成功！

如果遇到问题，查看后端服务的日志获取详细错误信息。

