# 修复 CORS 错误

## 🔍 问题分析

错误信息显示：
```
The 'Access-Control-Allow-Origin' header has a value 'https://your-ideal-perception-url.up.railway.app' 
that is not equal to the supplied origin.
```

**问题原因：**
- 前端实际 URL：`https://frontend-production-a46d.up.railway.app`
- 后端 CORS 配置中的 `FRONTEND_URL` 还是占位符值：`https://your-ideal-perception-url.up.railway.app`
- 两者不匹配，导致 CORS 错误

## ✅ 解决方法

### 步骤 1: 更新后端环境变量

1. **打开 Railway**
   - 访问 https://railway.app/
   - 打开 **openrice-production** 项目（后端服务）

2. **更新环境变量**
   - 点击 "Variables" 标签
   - 找到 `FRONTEND_URL` 环境变量
   - 更新值为：
     ```
     https://frontend-production-a46d.up.railway.app
     ```
   - 如果不存在，点击 "New Variable" 添加
   - 保存

3. **重新部署**
   - Railway 会自动检测环境变量更改
   - 会自动触发重新部署
   - 等待 1-2 分钟

### 步骤 2: 验证修复

部署完成后：
1. 刷新前端页面
2. 尝试搜索功能
3. 应该不再有 CORS 错误

## 📝 环境变量配置总结

### 后端服务（openrice-production）
```
MONGODB_URI=mongodb+srv://...
GOOGLE_MAPS_API_KEY=AIzaSyCsDlH7B6Qi_qL9bWkrqrvymMALHIFHqFY
OPENAI_API_KEY=sk-...（如果使用 AI 搜索）
FRONTEND_URL=https://frontend-production-a46d.up.railway.app
```

### 前端服务（frontend-production-a46d）
```
REACT_APP_API_URL=https://openrice-production.up.railway.app
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyCsDlH7B6Qi_qL9bWkrqrvymMALHIFHqFY
```

## 🔍 如果仍然有 CORS 错误

1. **检查环境变量值**
   - 确保 `FRONTEND_URL` 值完全正确（包括 https://）
   - 没有多余的空格或引号

2. **检查后端日志**
   - 在 Railway 中查看后端部署日志
   - 确认服务已重新启动

3. **清除浏览器缓存**
   - 清除浏览器缓存或使用无痕模式
   - 重新访问前端页面

## 💡 提示

- `FRONTEND_URL` 必须与前端实际 URL 完全匹配
- 如果前端 URL 改变，记得更新后端的 `FRONTEND_URL`
- 可以设置多个前端 URL（用逗号分隔），但需要修改后端代码

