# Android 应用安装指南（SDK 54）

## 🚀 快速开始

### 步骤 1: 进入 Android 目录

```bash
cd android
```

### 步骤 2: 完全清理

```bash
rm -rf node_modules package-lock.json .expo
```

### 步骤 3: 使用 Expo 安装依赖（重要！）

**使用 `expo install` 而不是 `npm install`**，这确保所有版本完全兼容：

```bash
npx expo install --fix
```

或者手动安装：

```bash
npx expo install expo@~54.0.0
npx expo install expo-status-bar@~2.0.0
npx expo install expo-location@~18.0.4
npx expo install react@18.3.1
npx expo install react-native@0.76.5
npx expo install react-native-maps
npx expo install @react-navigation/native
npx expo install @react-navigation/native-stack
npx expo install react-native-safe-area-context
npx expo install react-native-screens
npm install axios
```

### 步骤 4: 启动应用

```bash
npx expo start --clear
```

### 步骤 5: 在 Expo Go 中连接

1. 打开 Expo Go App
2. 扫描 QR 码
3. 等待应用加载

## ⚠️ 如果遇到 PlatformConstants 错误

### 完全清理方案

```bash
cd android
rm -rf node_modules package-lock.json .expo
npm cache clean --force
npx expo install --fix
npx expo start --clear
```

### 在 Expo Go 中

1. 完全关闭 Expo Go App
2. 清除 Expo Go 的缓存（在应用设置中）
3. 重新打开 Expo Go
4. 重新扫描 QR 码

## ✅ 验证

应用应该：
- ✅ 正常启动
- ✅ 没有 PlatformConstants 错误
- ✅ GPS 定位功能正常
- ✅ 可以搜索餐厅

## 💡 关键提示

**最重要：使用 `npx expo install --fix` 而不是 `npm install`**

这确保所有依赖版本与 SDK 54 完全匹配。

