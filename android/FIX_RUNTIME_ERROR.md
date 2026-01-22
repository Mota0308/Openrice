# 修复 Runtime Error: PlatformConstants 错误

## 🔍 错误分析

错误信息：
```
TurboModuleRegistry.getEnforcing(...): 'PlatformConstants' could not be found
```

**原因：**
- Expo SDK 54 与 Expo Go App 版本不匹配
- 或者依赖版本不兼容
- 需要重新安装依赖和清理缓存

## ✅ 解决方法

### 方法 1: 更新 Expo Go App（推荐）

1. **更新 Expo Go App**
   - 在 Google Play Store 或 App Store 更新 Expo Go 到最新版本
   - 确保支持 SDK 54

2. **重新启动应用**
   - 关闭 Expo Go App
   - 重新打开并扫描 QR 码

### 方法 2: 清理并重新安装依赖

```bash
cd android
rm -rf node_modules package-lock.json
npm install
npx expo start --clear
```

### 方法 3: 使用开发构建（如果 Expo Go 不支持 SDK 54）

如果 Expo Go 还没有支持 SDK 54，可以：

1. **降级到支持的 SDK 版本**
   - 或者等待 Expo Go 更新

2. **使用 EAS Build 创建开发构建**
   ```bash
   npm install -g eas-cli
   eas build --profile development --platform android
   ```

### 方法 4: 检查 SDK 54 兼容性

SDK 54 可能还没有在 Expo Go 中完全支持。可以：

1. **检查 Expo Go 版本**
   - 打开 Expo Go App
   - 查看设置中的版本信息
   - 确认是否支持 SDK 54

2. **如果 Expo Go 不支持 SDK 54**
   - 考虑使用 SDK 51 或 SDK 52（更稳定）
   - 或使用 EAS Build 创建自定义开发构建

## 🔧 快速修复步骤

### 步骤 1: 清理项目

```bash
cd android
rm -rf node_modules
rm package-lock.json
```

### 步骤 2: 重新安装

```bash
npm install
```

### 步骤 3: 清理 Metro 缓存

```bash
npx expo start --clear
```

### 步骤 4: 重新连接

- 在 Expo Go 中重新扫描 QR 码
- 或重新运行应用

## ⚠️ 如果仍然失败

### 选项 A: 降级到 SDK 51（更稳定）

SDK 51 在 Expo Go 中支持更好：

```json
{
  "expo": {
    "sdkVersion": "51.0.0"
  }
}
```

然后更新 package.json：
```json
{
  "dependencies": {
    "expo": "~51.0.0",
    "react": "18.2.0",
    "react-native": "0.74.5"
  }
}
```

### 选项 B: 使用 EAS Build

创建开发构建，不依赖 Expo Go：

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --profile development --platform android
```

## 📝 验证清单

- [ ] Expo Go App 已更新到最新版本
- [ ] 依赖已重新安装
- [ ] Metro 缓存已清理
- [ ] 应用重新启动

## 💡 建议

如果 Expo Go 还没有支持 SDK 54，建议：
1. 使用 SDK 51（更稳定，Expo Go 完全支持）
2. 或使用 EAS Build 创建开发构建

