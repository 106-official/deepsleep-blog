# Waline 评论系统 + 论坛功能 完整配置指南

## 📌 功能特性

- ✅ **用户注册/登录**：邮箱验证码注册，设置昵称和头像
- ✅ **文章评论**：在每篇文章下发表评论和回复
- ✅ **论坛版块**：独立论坛页面，支持发帖讨论
- ✅ **数据管理**：所有数据存储在你的 LeanCloud，完全可控
- ✅ **零成本**：使用 Vercel + LeanCloud 免费版

---

## 🔧 第一步：注册必要的服务

### 1. 注册 Vercel（部署 Waline 服务端）

1. 访问 https://vercel.com/signup
2. 使用 GitHub 账号登录（推荐）
3. 完成注册（免费）

### 2. 注册 LeanCloud（数据库存储）

1. 访问 https://www.leancloud.cn （国内版）或 https://leancloud.us （国际版）
   - **推荐使用国际版**（leancloud.us），无需实名认证
2. 注册账号并登录
3. 创建应用：
   - 点击"创建应用"
   - 名称输入：`deepsleep-blog`
   - 选择开发版（免费）
   - 点击创建

### 3. 获取 LeanCloud 配置信息

进入刚创建的应用：

1. 点击左侧 **"设置"** → **"应用凭证"**
2. 复制以下三个值：
   - `AppID` (或 App ID)
   - `AppKey` (或 App Key)
   - `MasterKey` (或 Master Key) ⚠️ **重要！保密！**

---

## 🚀 第二步：一键部署 Waline 到 Vercel

### 方法 A：使用 Vercel 一键部署（推荐）

1. 访问 Waline Vercel 部署页面：
   
   👉 **https://vercel.com/new/clone?repository-url=https://github.com/walinejs/waline/tree/main/example**

2. 点击 **"Deploy"** 按钮
3. 等待部署完成（约2分钟）
4. 部署成功后，你会得到一个 URL：
   ```
   https://your-waline.vercel.app
   ```
   **记住这个URL！**

### 方法 B：手动部署（高级用户）

```bash
# 克隆 Waline 示例项目
git clone https://github.com/walinejs/waline.git
cd waline/example

# 安装依赖
npm install

# 本地测试
npm run dev

# 部署到 Vercel
npx vercel --prod
```

---

## ⚙️ 第三步：配置 Waline 环境变量

在 Vercel 中配置环境变量：

1. 访问你的 Vercel Dashboard
2. 找到 Waline 项目 → **Settings** → **Environment Variables**
3. 添加以下变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `LEAN_ID` | 你的 LeanCloud AppID | 从第一步获取 |
| `LEAN_KEY` | 你的 LeanCloud AppKey | 从第一步获取 |
| `LEAN_MASTER_KEY` | 你的 LeanCloud MasterKey | ⚠️ 必须保密 |
| `SITE_URL` | `https://deepsleep.fun` | 你的博客域名 |

4. 点击 **Save**
5. 点击 **Deployments** → 选择最新部署 → **Redeploy**（重新部署使配置生效）

---

## 📝 第四步：在博客中集成 Waline

### 博客已自动配置！

本博客已经集成了 Waline 评论系统，你只需要：

1. 编辑 `.env` 或 `hugo.toml` 文件中的 Waline 配置：
   ```toml
   [params.waline]
     serverURL = "https://your-waline.vercel.app"  # 替换为你的 Waline URL
     lang = "zh-CN"
     emoji = ["https://cdn.jsdelivr.net/npm/@waline/emojis@1.1.0/bilibili"]
     requiredMeta = ["nick", "email"]
     wordLimit = [0, 500]
   ```

2. 将 `your-waline.vercel.app` 替换为你实际的 Waline 地址

3. 提交并推送到 GitHub：
   ```bash
   git add .
   git commit -m "Add Waline comment system"
   git push origin main
   ```

---

## 💬 第五步：功能说明

### 用户如何使用？

#### 注册账号
1. 在评论区点击 **"登录"** 或尝试发表评论
2. 选择 **"注册"**
3. 输入邮箱地址
4. 查收验证码邮件（检查垃圾箱！）
5. 输入验证码完成注册
6. 设置昵称和密码

#### 发表评论
- 在文章底部找到评论框
- 登录后即可发表评论
- 支持 Markdown 语法
- 可以 @ 回复其他用户

#### 使用论坛
1. 访问 `/forum/` 页面
2. 创建新帖子（类似发帖）
3. 其他用户可以回复讨论

---

## 🎨 第六步：自定义配置（可选）

### 修改评论样式

编辑 `static/css/custom.css` 添加：

```css
/* Waline 评论样式定制 */
.waline-editor {
    border-radius: 12px !important;
}

.waline-user {
    color: #D4AF37 !important;
}

.waline-avatar {
    border-radius: 50% !important;
}
```

### 启用管理后台

访问 `https://your-waline.vercel.app/ui/setup` 
- 设置管理员密码
- 之后可通过 `/ui` 进入管理后台管理评论

---

## 🔒 安全建议

1. **不要公开 MasterKey** - 只在服务端环境变量中使用
2. **开启评论审核** - 可在管理后台设置
3. **定期备份数据** - LeanCloud 控制台可导出数据
4. **配置反垃圾** - Waline 内置 Akismet 支持

---

## ❓ 常见问题

### Q: 验证邮件收不到？
A: 检查垃圾箱，或使用国际版 LeanCloud（leancloud.us）

### Q: 如何删除不当评论？
A: 访问 Waline 管理后台 `/ui` 进行管理

### Q: 免费额度够用吗？
A: 个人博客完全足够：
- LeanCloud 免费版：10万次API调用/月
- Vercel 免费版：100GB带宽/月

### Q: 能否迁移到自建服务器？
A: 可以！Waline 支持多种部署方式（Docker、Node.js等）

---

## 📊 数据统计

配置完成后，你可以在 Waline 管理后台查看：
- 评论数量趋势
- 用户活跃度
- 热门文章排行
- 日历热力图

---

*最后更新: 2026-05-29*
*适用版本: Waline v3.x, Hugo v0.162+*
