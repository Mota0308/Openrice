# 修复 MongoDB 连接错误

## 🔍 错误分析

您遇到的错误：
```
MongoDB connection error: Error: querySrv ENOTFOUND _mongodb._tcp.cluster0.xxxxx.mongodb.net
```

这个错误通常表示：
1. **MongoDB URI 格式不正确**
2. **MongoDB Atlas 集群不存在或已删除**
3. **网络连接问题**

## ✅ 已修复的问题

1. ✅ **移除了已弃用的选项**
   - 删除了 `useNewUrlParser: true`
   - 删除了 `useUnifiedTopology: true`
   - 这些选项在新版本的 MongoDB 驱动中已不需要

## 🔧 解决 MongoDB 连接问题

### 步骤 1: 检查 MongoDB URI 格式

正确的 MongoDB Atlas 连接字符串格式：

```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<database>?retryWrites=true&w=majority
```

**重要检查点：**
- ✅ 确保使用 `mongodb+srv://`（不是 `mongodb://`）
- ✅ 替换 `<username>` 为您的数据库用户名
- ✅ 替换 `<password>` 为您的数据库密码（URL 编码特殊字符）
- ✅ 替换 `cluster0.xxxxx.mongodb.net` 为您的实际集群地址
- ✅ 替换 `<database>` 为数据库名称（例如：`openrice`）

### 步骤 2: 获取正确的 MongoDB URI

1. **登录 MongoDB Atlas**
   - 访问 https://www.mongodb.com/cloud/atlas
   - 登录您的账号

2. **获取连接字符串**
   - 点击您的集群
   - 点击 "Connect" 按钮
   - 选择 "Connect your application"
   - 选择 "Node.js" 和最新版本
   - 复制连接字符串

3. **替换密码**
   - 将连接字符串中的 `<password>` 替换为您的实际密码
   - **注意**：如果密码包含特殊字符，需要进行 URL 编码：
     - `@` → `%40`
     - `:` → `%3A`
     - `/` → `%2F`
     - `?` → `%3F`
     - `#` → `%23`
     - `[` → `%5B`
     - `]` → `%5D`

### 步骤 3: 更新 Railway 环境变量

1. **在 Railway 中更新 MONGODB_URI**
   - 打开 Railway 项目
   - 点击 "Variables" 标签
   - 找到 `MONGODB_URI`
   - 更新为正确的连接字符串
   - 保存

2. **重新部署**
   - Railway 会自动检测环境变量更改
   - 或者手动触发重新部署

### 步骤 4: 检查 MongoDB Atlas 网络访问

1. **检查 IP 白名单**
   - 在 MongoDB Atlas 中
   - 点击 "Network Access"
   - 确保有以下任一配置：
     - ✅ 添加 `0.0.0.0/0`（允许所有 IP）- **推荐用于开发**
     - ✅ 或添加 Railway 的 IP 地址

2. **检查数据库用户**
   - 在 MongoDB Atlas 中
   - 点击 "Database Access"
   - 确保数据库用户存在且有正确权限

## 📝 MongoDB URI 示例

**正确格式：**
```
mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/openrice?retryWrites=true&w=majority
```

**如果密码包含特殊字符：**
```
原始密码: P@ssw0rd#123
编码后: P%40ssw0rd%23123
URI: mongodb+srv://myuser:P%40ssw0rd%23123@cluster0.abc123.mongodb.net/openrice?retryWrites=true&w=majority
```

## 🔍 故障排除

### 如果仍然连接失败：

1. **验证集群是否存在**
   - 登录 MongoDB Atlas
   - 确认集群名称正确
   - 确认集群状态为 "Running"

2. **测试连接**
   - 在 MongoDB Atlas 中点击 "Connect"
   - 选择 "Connect with MongoDB Compass"
   - 测试连接是否正常

3. **检查防火墙/网络**
   - 确保 Railway 可以访问外部网络
   - 检查是否有防火墙阻止连接

4. **查看详细日志**
   - 在 Railway 中查看完整的部署日志
   - 查找更多错误信息

## ✅ 验证修复

修复后，您应该在日志中看到：
```
MongoDB connected
Server is running on port 8080
```

而不是错误信息。

## 💡 提示

- 不要在代码中硬编码 MongoDB URI
- 始终使用环境变量
- 定期检查 MongoDB Atlas 集群状态
- 考虑使用 MongoDB Atlas 的连接字符串测试工具

