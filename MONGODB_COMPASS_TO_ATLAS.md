# 从 MongoDB Compass 迁移到 MongoDB Atlas

## 📚 重要说明

**MongoDB Compass** 是一个图形界面工具，用于连接和管理 MongoDB 数据库，**不是数据库本身**。

- **MongoDB Compass** = 管理工具（类似数据库客户端）
- **MongoDB** = 实际的数据库服务器

## 🔍 当前情况

如果您在本地使用 MongoDB Compass：
- 这意味着您连接的是**本地 MongoDB 服务器**
- Railway 是云端服务，**无法连接到您本地的数据库**

## ✅ 解决方案：使用 MongoDB Atlas

Railway 需要连接到**云端数据库**，推荐使用 **MongoDB Atlas**（MongoDB 官方云服务）。

### 选项 1: 创建新的 MongoDB Atlas 数据库（推荐）

#### 步骤 1: 注册 MongoDB Atlas

1. **访问 MongoDB Atlas**
   - 打开 https://www.mongodb.com/cloud/atlas
   - 点击 "Try Free" 或 "Sign Up"
   - 使用 Google 账号或邮箱注册

2. **创建免费集群**
   - 选择 "Build a Database"
   - 选择 "FREE" 套餐（M0 Sandbox）
   - 选择云服务商和区域（推荐选择离您最近的）
   - 集群名称：`Cluster0`（或自定义）
   - 点击 "Create"

#### 步骤 2: 配置网络访问

1. **设置 IP 白名单**
   - 在 Atlas 界面，点击 "Network Access"
   - 点击 "Add IP Address"
   - 选择 "Allow Access from Anywhere"（添加 `0.0.0.0/0`）
   - 点击 "Confirm"
   - **注意**：这会允许任何 IP 访问，仅用于开发。生产环境应限制 IP。

#### 步骤 3: 创建数据库用户

1. **创建用户**
   - 点击 "Database Access"
   - 点击 "Add New Database User"
   - 选择 "Password" 认证方式
   - 输入用户名和密码（**记住这些信息！**）
   - 用户权限：选择 "Atlas admin" 或 "Read and write to any database"
   - 点击 "Add User"

#### 步骤 4: 获取连接字符串

1. **获取连接字符串**
   - 点击 "Database" → 点击您的集群
   - 点击 "Connect"
   - 选择 "Connect your application"
   - 选择 "Node.js" 和最新版本
   - 复制连接字符串

2. **连接字符串格式：**
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

3. **修改连接字符串：**
   - 将 `<username>` 替换为您的数据库用户名
   - 将 `<password>` 替换为您的数据库密码
   - 在 `mongodb.net/` 后面添加数据库名称：`openrice`
   - 最终格式：
     ```
     mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/openrice?retryWrites=true&w=majority
     ```

#### 步骤 5: 在 Railway 中设置

1. **更新环境变量**
   - 在 Railway 项目页面
   - 点击 "Variables" 标签
   - 找到或添加 `MONGODB_URI`
   - 粘贴修改后的连接字符串
   - 保存

2. **Railway 会自动重新部署**

### 选项 2: 迁移本地数据到 Atlas（如果需要）

如果您在本地 MongoDB 中有数据需要迁移：

#### 使用 MongoDB Compass 导出数据

1. **打开 MongoDB Compass**
2. **连接到本地数据库**
3. **导出数据：**
   - 选择数据库和集合
   - 点击 "Export Collection"
   - 选择 JSON 或 CSV 格式
   - 保存文件

#### 导入数据到 Atlas

1. **在 MongoDB Compass 中连接到 Atlas**
   - 打开 Compass
   - 点击 "New Connection"
   - 粘贴 Atlas 连接字符串
   - 连接

2. **导入数据：**
   - 选择目标数据库
   - 点击 "Import Data"
   - 选择之前导出的文件
   - 导入

#### 或使用命令行工具

```bash
# 导出本地数据
mongoexport --uri="mongodb://localhost:27017/openrice" --collection=restaurants --out=restaurants.json

# 导入到 Atlas
mongoimport --uri="mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/openrice" --collection=restaurants --file=restaurants.json
```

## 🔄 在 MongoDB Compass 中连接 Atlas

设置好 Atlas 后，您仍然可以使用 Compass 管理云端数据库：

1. **打开 MongoDB Compass**
2. **点击 "New Connection"**
3. **粘贴 Atlas 连接字符串**
4. **连接**

现在您可以在 Compass 中管理 Atlas 数据库，就像管理本地数据库一样！

## 📝 连接字符串示例

**Atlas 连接字符串（用于 Railway）：**
```
mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/openrice?retryWrites=true&w=majority
```

**本地连接字符串（仅用于本地开发）：**
```
mongodb://localhost:27017/openrice
```

## ✅ 验证连接

设置完成后：

1. **在 Railway 日志中查看**
   - 应该看到：`MongoDB connected`
   - 不应该有错误信息

2. **在 MongoDB Compass 中测试**
   - 使用 Atlas 连接字符串连接
   - 应该能成功连接并看到数据库

## 💡 重要提示

- **本地 MongoDB** 只能用于本地开发
- **MongoDB Atlas** 用于生产环境和云端部署
- 两个可以同时使用（本地开发用本地，生产用 Atlas）
- Compass 可以连接到两者

## 🆘 如果遇到问题

1. **检查 IP 白名单** - 确保 Atlas 允许 `0.0.0.0/0`
2. **检查用户名密码** - 确保正确且没有特殊字符问题
3. **检查连接字符串格式** - 确保使用 `mongodb+srv://`
4. **查看 Railway 日志** - 查看详细错误信息

