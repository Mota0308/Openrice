# 修复 PlatformConstants 错误（SDK 54）

## 🔍 错误原因

即使 Expo Go 支持 SDK 54，`PlatformConstants` 错误通常是因为：
1. 依赖版本不完全匹配
2. 需要使用 `expo install` 而不是 `npm install`
3. 缓存问题

## ✅ 解决方法

### 方法 1: 使用 expo install（推荐）

Expo 推荐使用 `expo install` 来安装依赖，确保版本完全兼容：

```bash
cd android

# 清理
rm -rf node_modules package-lock.json .expo

# 使用 expo install 安装所有依赖
npx expo install --fix

# 或者手动安装每个包
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

# 清理缓存并启动
npx expo start --clear
```

### 方法 2: 完全清理并重新安装

```bash
cd android

# 完全清理
rm -rf node_modules package-lock.json .expo
npm cache clean --force

# 重新安装
npm install

# 清理 Metro 缓存
npx expo start --clear
```

### 方法 3: 检查并修复依赖版本

确保所有依赖版本与 SDK 54 完全匹配。运行：

```bash
npx expo install --check
```

这会检查并提示需要更新的包。

## 🔧 验证步骤

1. **清理所有缓存**
   ```bash
   rm -rf node_modules package-lock.json .expo
   ```

2. **使用 expo install**
   ```bash
   npx expo install --fix
   ```

3. **启动应用**
   ```bash
   npx expo start --clear
   ```

4. **在 Expo Go 中重新连接**
   - 完全关闭 Expo Go
   - 重新打开
   - 重新扫描 QR 码

## ⚠️ 重要提示

- **使用 `expo install` 而不是 `npm install`** - 这确保版本完全兼容
- **清理所有缓存** - `.expo` 文件夹也需要删除
- **确保 Expo Go 是最新版本** - 在应用商店更新

## 📝 如果仍然失败

如果以上方法都不行，可能需要：

1. **检查 Expo Go 版本**
   - 确保是最新版本
   - 支持 SDK 54

2. **尝试开发构建**
   ```bash
   npm install -g eas-cli
   eas build --profile development --platform android
   ```

3. **检查 app.json 配置**
   - 确保没有冲突的配置
   - 检查插件配置

