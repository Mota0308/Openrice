# 查找前端部署 URL

## 📍 在 Railway 中查找前端 URL

### 方法 1: 在项目主页查看（最简单）

1. **打开 Railway**
   - 访问 https://railway.app/
   - 登录您的账号

2. **打开 ideal-perception 项目**
   - 在项目列表中找到 "ideal-perception"
   - 点击进入

3. **查看域名**
   - 在项目主页顶部，查找 **"Public Domain"** 或 **"Domains"** 部分
   - 应该显示类似：
     ```
     https://ideal-perception-production-xxxx.up.railway.app
     ```
   - 或
     ```
     https://ideal-perception-xxxx.up.railway.app
     ```

### 方法 2: 在 Settings 中查看

1. **进入设置**
   - 在 ideal-perception 项目中
   - 点击左侧菜单的 **"Settings"**

2. **查看 Networking**
   - 在 Settings 页面中，查找 **"Networking"** 或 **"Domains"** 部分
   - 应该会显示您的公共域名

3. **如果没有域名，生成一个**
   - 点击 **"Generate Domain"** 或 **"Add Domain"** 按钮
   - Railway 会自动生成域名

### 方法 3: 在 Networking 标签中查看

1. **点击左侧菜单的 "Networking"**
   - 如果看到这个选项，直接点击

2. **查看 Public Networking**
   - 在 Networking 页面中
   - 查找 **"Public Networking"** 部分
   - 应该会显示您的域名

## 🔍 Railway URL 的格式

前端 URL 通常格式为：
```
https://ideal-perception-production-xxxx.up.railway.app
```
或
```
https://ideal-perception-xxxx.up.railway.app
```

## ✅ 找到 URL 后

访问该 URL，您应该能看到：
- OpenRice 应用界面
- 搜索功能
- 餐厅列表等功能

## 🆘 如果找不到 URL

1. **检查部署状态**
   - 点击 "Deployments" 标签
   - 确认最新部署显示 "Active" 或 "Deployed"

2. **检查服务是否运行**
   - 点击 "Metrics" 标签
   - 如果看到 CPU/内存数据，说明服务正在运行

3. **手动生成域名**
   - Settings → Networking → "Generate Domain"

## 📝 完整架构 URL

部署完成后，您应该有两个 URL：

- **后端 API**: `https://openrice-production.up.railway.app`
- **前端应用**: `https://ideal-perception-xxxx.up.railway.app`（您的实际 URL）

前端会调用后端 API 来获取数据。

