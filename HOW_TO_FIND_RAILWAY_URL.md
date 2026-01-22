# 如何查找 Railway 部署 URL

## 📍 方法 1: 在项目主页查看（最简单）

1. **登录 Railway**
   - 访问 https://railway.app/
   - 登录您的账号

2. **打开项目**
   - 在项目列表中，点击 "Openrice" 项目

3. **查看 URL**
   - 在项目主页的顶部，您会看到一个 **"Domains"** 或 **"Public Domain"** 部分
   - 点击域名旁边的 **"🔗"** 图标或直接复制 URL
   - URL 格式通常是：`https://openrice-production-xxxx.up.railway.app`

## 📍 方法 2: 在 Settings 中查看

1. **进入项目设置**
   - 在 "Openrice" 项目页面
   - 点击左侧菜单的 **"Settings"**（设置）

2. **查看 Domains**
   - 在 Settings 页面中，找到 **"Domains"** 部分
   - 您会看到：
     - **Generated Domain**（自动生成的域名）
     - 或者 **Custom Domain**（自定义域名，如果已设置）

3. **复制 URL**
   - 点击域名旁边的复制按钮
   - 或直接复制显示的 URL

## 📍 方法 3: 在部署日志中查看

1. **查看部署历史**
   - 在项目页面，点击 **"Deployments"** 标签
   - 选择最新的部署

2. **查看日志**
   - 在部署详情中，通常会显示服务的 URL
   - 或者在日志中搜索 "Server is running on port" 相关信息

## 📍 方法 4: 如果没有看到 URL

如果还没有生成域名：

1. **生成域名**
   - 进入 Settings → Domains
   - 点击 **"Generate Domain"** 按钮
   - Railway 会自动生成一个域名

2. **等待部署完成**
   - 确保服务已成功部署
   - 如果部署失败，URL 可能不会显示

## 🔍 识别 URL 的特征

Railway URL 通常有以下特征：
- 格式：`https://[项目名]-[随机字符].up.railway.app`
- 例如：`https://openrice-production-abc123.up.railway.app`
- 或者：`https://openrice-xxxx.up.railway.app`

## ✅ 验证 URL 是否有效

获取 URL 后，在浏览器中访问：

```
https://your-url.up.railway.app/api/health
```

如果看到以下响应，说明 URL 正确：
```json
{"status":"OK","message":"Server is running"}
```

## 📸 视觉指引

Railway 界面通常如下：

```
┌─────────────────────────────────┐
│  Openrice Project               │
├─────────────────────────────────┤
│                                 │
│  🌐 Public Domain              │
│  https://openrice-xxxx.up...   │
│  [Copy] [Open]                  │
│                                 │
│  [Settings] [Deployments] ...   │
└─────────────────────────────────┘
```

## 🆘 如果找不到 URL

可能的原因：
1. **部署还未完成** - 等待部署完成
2. **部署失败** - 检查部署日志
3. **服务未启动** - 检查服务状态

解决方法：
- 查看 "Deployments" 标签中的错误信息
- 检查环境变量是否都已设置
- 查看服务日志

## 💡 提示

- Railway 的 URL 是自动生成的，无法自定义（除非使用自定义域名）
- URL 在每次重新部署后通常保持不变
- 可以在 Settings → Domains 中设置自定义域名

