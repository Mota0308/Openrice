# MongoDB Atlas 快速设置指南

## 🚀 5 分钟快速设置

### 步骤 1: 注册并创建集群（2分钟）

1. 访问 https://www.mongodb.com/cloud/atlas/register
2. 使用 Google 账号或邮箱注册
3. 选择 "Build a Database"
4. 选择 **FREE** 套餐（M0）
5. 选择区域（推荐：Asia Pacific - Singapore）
6. 集群名称：`Cluster0`
7. 点击 "Create"

### 步骤 2: 配置访问权限（1分钟）

1. **网络访问：**
   - 点击 "Network Access"
   - 点击 "Add IP Address"
   - 选择 "Allow Access from Anywhere"（`0.0.0.0/0`）
   - 点击 "Confirm"

2. **数据库用户：**
   - 点击 "Database Access"
   - 点击 "Add New Database User"
   - 用户名：输入一个用户名（例如：`openrice_user`）
   - 密码：点击 "Autogenerate Secure Password" 或自己设置
   - **重要：复制并保存密码！**
   - 权限：选择 "Atlas admin"
   - 点击 "Add User"

### 步骤 3: 获取连接字符串（1分钟）

1. 点击 "Database" → 点击您的集群
2. 点击 "Connect"
3. 选择 "Connect your application"
4. 选择 "Node.js" 和版本 "5.5 or later"
5. 复制连接字符串

### 步骤 4: 修改连接字符串（30秒）

原始字符串：
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

修改为：
```
mongodb+srv://openrice_user:your_password@cluster0.xxxxx.mongodb.net/openrice?retryWrites=true&w=majority
```

**替换：**
- `<username>` → 您的用户名（例如：`openrice_user`）
- `<password>` → 您的密码
- 在 `.net/` 后添加数据库名：`openrice`

### 步骤 5: 在 Railway 中设置（1分钟）

1. 打开 Railway 项目
2. 点击 "Variables"
3. 找到或添加 `MONGODB_URI`
4. 粘贴修改后的连接字符串
5. 保存

Railway 会自动重新部署！

## ✅ 完成！

等待部署完成后，检查日志应该看到：
```
MongoDB connected
Server is running on port 8080
```

## 🔍 验证

在浏览器访问：
```
https://your-railway-url.up.railway.app/api/health
```

应该返回：
```json
{"status":"OK","message":"Server is running"}
```

## 💡 提示

- Atlas 免费套餐足够用于开发和测试
- 可以在 MongoDB Compass 中使用相同的连接字符串连接 Atlas
- 数据会自动同步到云端

