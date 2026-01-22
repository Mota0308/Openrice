# 快速找到 Railway URL

## 🎯 最简单的方法

### 步骤 1: 打开 Railway 项目
- 访问 https://railway.app/
- 登录并打开 "Openrice" 项目

### 步骤 2: 查看项目主页顶部
在项目主页的**最顶部**，查找：
- **"Public Domain"** 或
- **"Domains"** 或  
- **"Networking"**

应该会显示类似：
```
🌐 Public Domain
https://openrice-production-xxxx.up.railway.app
[Copy] [Open]
```

### 步骤 3: 如果主页没有显示

1. **点击左侧菜单的 "Settings"**
2. **查找 "Networking" 或 "Domains" 部分**
3. **如果没有域名，点击 "Generate Domain"**

## 📍 常见位置

Railway URL 通常显示在：
1. ✅ 项目主页顶部（最常见）
2. ✅ Settings → Networking
3. ✅ Settings → Domains
4. ✅ 左侧菜单的 "Networking" 选项

## 🔍 如果找不到

**检查服务状态：**
- 点击 "Deployments" 查看最新部署状态
- 确保显示 "Active" 或 "Deployed"

**手动生成：**
- Settings → Networking → "Generate Domain"

## ✅ 找到后测试

复制 URL，在浏览器访问：
```
https://your-url.up.railway.app/api/health
```

应该看到：
```json
{"status":"OK","message":"Server is running"}
```

