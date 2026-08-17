# 社区系统后端 (scf-community-deepsleep) — 腾讯云 SCF

DeepSleep 博客社区论坛的当前后端,腾讯云函数 SCF 部署(2026-07-30 从 Vercel 迁移)。

## 基本信息

| 属性 | 值 |
|------|-----|
| **项目目录** | `c:\Users\26516\Desktop\n8n\scf-community-deepsleep` |
| **部署** | 腾讯云函数 SCF(Web 函数类型) |
| **端点** | https://1437998910-loiqxuadw0.ap-shanghai.tencentscf.com |
| **数据库** | Neon PostgreSQL(与 Waline 评论共享) |
| **鉴权** | bcryptjs 哈希 + JWT(7 天有效期) |
| **旧端点(废弃备用)** | https://community-deepsleep.vercel.app(Vercel 版,国内手机端不可达) |

## 迁移背景

与立信 LLM API 相同的问题:Vercel 域名在国内手机端/校园网不可达(实测 curl 无代理超时、有代理 200)。2026-07-30 迁移至腾讯云 SCF,国内直连可达。旧 Vercel 版 `community-deepsleep` 保留备用,见 `docs/community/vercel-legacy.md`。

## 核心文件

| 文件 | 说明 |
|------|------|
| `index.js` | express 路由入口(Web 函数) |
| `scf_bootstrap` | SCF 启动脚本 |
| `makezip.py` | 打包 `code.zip` 上传脚本 |
| `create-function.json` / `create-trigger.json` | SCF 创建配置 |
| `api/db.js` | Neon PostgreSQL 连接池 |
| `api/auth.js` | JWT 认证中间件 |
| `api/{register,login,me,posts,init}.js` | 各 API 路由(代码级 CORS 头) |

## API 接口

| 方法 | 路径 | 功能 | 认证 |
|------|------|------|------|
| POST | `/api/register` | 用户注册(邮箱+密码+昵称) | 否 |
| POST | `/api/login` | 用户登录(返回 JWT) | 否 |
| GET | `/api/me` | 获取当前用户信息 | ✅ Bearer Token |
| PUT | `/api/me` | 更新个人资料(昵称/头像/简介) | ✅ Bearer Token |
| GET | `/api/posts` | 帖子列表(分页+分类筛选) | 否 |
| POST | `/api/posts` | 发布新帖子 | ✅ Bearer Token |
| GET | `/api/init` | 初始化表结构 | 否 |

## 环境变量

| 变量名 | 值 | 用途 |
|--------|-----|------|
| `DATABASE_URL` | Neon 连接串 | PostgreSQL 连接 |
| `JWT_SECRET` | `community-deepsleep-jwt-secret-2026` | JWT 签名密钥 |

## 部署流程

```bash
cd scf-community-deepsleep
python makezip.py          # 生成 code.zip
# 腾讯云控制台更新函数代码(函数名 scf-community-deepsleep),或使用 tccli / Serverless CLI
# 配置环境变量 DATABASE_URL / JWT_SECRET

# 验证(国内直连)
curl https://1437998910-loiqxuadw0.ap-shanghai.tencentscf.com/api/posts?limit=1
```

## 前端对接

博客前端 `blog-static/static/js/community.js` 中的 `API_BASE` 指向 SCF 端点,CORS 在代码内配置(允许 `https://deepsleep.fun`)。
