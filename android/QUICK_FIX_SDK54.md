# 快速修复 SDK 54 运行时错误

## 🔍 错误原因

`PlatformConstants could not be found` 错误通常是因为：
1. Expo Go App 还没有支持 SDK 54
2. 依赖版本不兼容
3. 需要清理缓存

## ✅ 立即修复步骤

### 步骤 1: 清理并重新安装

```bash
cd android
rm -rf node_modules package-lock.json
npm install
```

### 步骤 2: 清理 Metro 缓存

```bash
npx expo start --clear
```

### 步骤 3: 更新 Expo Go App

- 在 Google Play Store 更新 Expo Go 到最新版本
- 确保支持 SDK 54

### 步骤 4: 重新连接

- 关闭 Expo Go App
- 重新打开并扫描 QR 码

## ⚠️ 如果仍然失败：降级到 SDK 51

如果 Expo Go 还没有支持 SDK 54，建议使用 SDK 51（更稳定）：

### 更新 app.json

移除 `sdkVersion`（Expo 会自动检测）

### 更新 package.json

```json
{
  "dependencies": {
    "expo": "~51.0.0",
    "react": "18.2.0",
    "react-native": "0.74.5",
    "expo-location": "~17.0.1",
    "expo-status-bar": "~1.12.1"
  }
}
```

然后运行：
```bash
rm -rf node_modules package-lock.json
npm install
npx expo start --clear
```

