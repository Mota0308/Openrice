# 推送到 GitHub 指南

## ✅ 已完成
- [x] Git 仓库已初始化
- [x] 所有文件已添加到暂存区
- [x] 已创建初始提交
- [x] 分支已重命名为 `main`

## 📋 接下来：连接到 GitHub

### 方法 1: 如果您已经在 GitHub 创建了仓库

1. **添加远程仓库**
   ```bash
   git remote add origin https://github.com/您的用户名/Openrice.git
   ```
   或者使用 SSH：
   ```bash
   git remote add origin git@github.com:您的用户名/Openrice.git
   ```

2. **推送到 GitHub**
   ```bash
   git push -u origin main
   ```

### 方法 2: 如果还没有创建 GitHub 仓库

1. **在 GitHub 创建新仓库**
   - 访问 https://github.com/new
   - 仓库名称：`Openrice`
   - 选择 Public 或 Private
   - **不要**初始化 README、.gitignore 或 license（我们已经有了）
   - 点击 "Create repository"

2. **添加远程仓库并推送**
   ```bash
   git remote add origin https://github.com/您的用户名/Openrice.git
   git push -u origin main
   ```

### 方法 3: 使用 GitHub CLI（如果已安装）

```bash
gh repo create Openrice --public --source=. --remote=origin --push
```

## 🔐 身份验证

如果推送时要求身份验证：

### 使用 Personal Access Token (推荐)
1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 选择权限：`repo`（完整仓库访问权限）
4. 生成并复制 token
5. 推送时使用 token 作为密码：
   ```bash
   Username: 您的GitHub用户名
   Password: 您的Personal Access Token
   ```

### 使用 SSH 密钥
1. 生成 SSH 密钥（如果还没有）：
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```
2. 将公钥添加到 GitHub：
   - 复制 `~/.ssh/id_ed25519.pub` 内容
   - 访问 https://github.com/settings/keys
   - 点击 "New SSH key" 并添加

## ✅ 验证推送

推送成功后，访问您的 GitHub 仓库：
```
https://github.com/您的用户名/Openrice
```

您应该能看到所有项目文件。

## 🚀 连接到 Railway

推送成功后，在 Railway 中：

1. 打开您的 "Openrice" 项目
2. 点击 "Settings" → "Source"
3. 点击 "Connect GitHub Repo"
4. 选择 `Openrice` 仓库
5. Railway 会自动检测并开始部署

## 📝 后续更新

以后更新代码时：

```bash
git add .
git commit -m "描述您的更改"
git push
```

Railway 会自动检测到新的推送并重新部署。

