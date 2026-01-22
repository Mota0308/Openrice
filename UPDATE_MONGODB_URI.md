# 更新 MongoDB URI 到 Railway

## ✅ 您的 MongoDB Atlas 连接字符串

原始连接字符串：
```
mongodb+srv://chenyaolin0308:9GUhZvnuEpAA1r6c@cluster0.0dhi0qc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

## 🔧 需要修改

在 `.net/` 后面添加数据库名称 `openrice`：

**修改后的连接字符串：**
```
mongodb+srv://chenyaolin0308:9GUhZvnuEpAA1r6c@cluster0.0dhi0qc.mongodb.net/openrice?retryWrites=true&w=majority&appName=Cluster0
```

**关键变化：**
- 从：`.net/?retryWrites=...`
- 改为：`.net/openrice?retryWrites=...`

## 📋 在 Railway 中设置步骤

### 步骤 1: 打开 Railway 项目

1. 登录 https://railway.app/
2. 打开 "Openrice" 项目

### 步骤 2: 更新环境变量

1. **点击 "Variables" 标签**
2. **找到或添加 `MONGODB_URI`**
   - 如果已存在，点击编辑
   - 如果不存在，点击 "New Variable"
3. **粘贴修改后的连接字符串：**
   ```
   mongodb+srv://chenyaolin0308:9GUhZvnuEpAA1r6c@cluster0.0dhi0qc.mongodb.net/openrice?retryWrites=true&w=majority&appName=Cluster0
   ```
4. **保存**

### 步骤 3: 等待重新部署

- Railway 会自动检测环境变量更改
- 会自动触发重新部署
- 等待 1-2 分钟

### 步骤 4: 验证连接

部署完成后，在 Railway 日志中应该看到：
```
MongoDB connected
Server is running on port 8080
```

而不是错误信息。

## ✅ 验证步骤

### 1. 检查 Railway 日志

在 Railway → Deployments → 最新部署 → 查看日志

应该看到：
- ✅ `MongoDB connected`
- ✅ `Server is running on port 8080`
- ❌ 不应该有 `MongoDB connection error`

### 2. 测试 API

在浏览器访问（替换为您的 Railway URL）：
```
https://your-railway-url.up.railway.app/api/health
```

应该返回：
```json
{"status":"OK","message":"Server is running"}
```

## 🔍 如果仍然失败

### 检查 MongoDB Atlas 设置

1. **网络访问**
   - 登录 MongoDB Atlas
   - 点击 "Network Access"
   - 确保有 `0.0.0.0/0`（允许所有 IP）

2. **数据库用户**
   - 点击 "Database Access"
   - 确认用户 `chenyaolin0308` 存在
   - 确认密码正确

3. **集群状态**
   - 点击 "Database"
   - 确认集群状态为 "Running"

## 💡 提示

- 连接字符串中的密码是敏感信息，不要分享给他人
- 可以在 MongoDB Compass 中使用相同的连接字符串连接 Atlas
- 数据库名称 `openrice` 会在第一次写入数据时自动创建

