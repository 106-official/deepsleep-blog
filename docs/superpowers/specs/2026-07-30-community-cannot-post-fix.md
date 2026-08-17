# Spec: DeepSleep 社区「不能发帖」问题诊断、修复与 SCF 迁移

## 背景
用户反馈社区功能（`https://deepsleep.fun/community/`）无法发帖。本文档记录根因分析、代码修复、以及 SCF 迁移的完整过程。

## 架构现状（迁移后）
- **前端**：`blog-static/layouts/_default/community.html` + `blog-static/static/js/community.js` + `static/css/community.css`，随 Hugo 博客部署到 GitHub Pages
- **后端 API（当前：腾讯云 SCF）**：`scf-community-deepsleep/index.js`（express 路由）+ `api/{register,login,posts,me,init,auth,db}.js`
  - SCF 端点：`https://1437998910-loiqxuadw0.ap-shanghai.tencentscf.com`
  - 国内直连可达（无代理验证通过）
- **数据库**：Neon PostgreSQL（`us-east-1.aws.neon.tech`），SCF 通过公网 + SSL 连接
- **鉴权**：bcryptjs 哈希 + JWT（7 天有效期），`JWT_SECRET = community-deepsleep-jwt-secret-2026`
- **旧端点（已废弃，保留备用）**：`community-deepsleep.vercel.app`（Vercel，电脑端走代理可用，手机端不可达）

## 根因分析（按严重程度排序）

### ① 🔴 主因：Vercel 域名国内手机/校园网不可达
与 lixin LLM API 迁移 SCF 前完全相同的问题。实测（2026-07-30）：
- `curl 无代理 → Exit 28 超时`（完全不可达）
- `curl 有代理(127.0.0.1:65532) → 200 OK`（数据库正常）

影响：手机端/校园网用户无法注册、登录、加载帖子、发帖——所有请求全部超时挂起。这是「不能发帖」的直接原因。

### ② 🟡 前端 `api()` 无 fetch 超时
裸 `fetch()` 无 AbortController，API 不可达时永久挂起，用户看永久「加载中」无错误反馈。

### ③ 🟡 `register.js` 返回 `displayName: undefined`
第 55 行用驼峰 `user.displayName` 读取，但 PostgreSQL 返回蛇形 `display_name`，导致响应中 `displayName` 字段被丢弃。实测注册响应缺失 displayName。

### ④ 🟡 `me.js` GET/PUT 均未调用 `authMiddleware`
引入了 `authMiddleware` 但从未调用，`req.userId` 恒 undefined。GET 返回「用户不存在」；前端 api() 见「不存在」会 clearToken 登出用户。PUT 静默 UPDATE 0 行却返回「更新成功」。

### ⑤ 🟡 `posts.js` COUNT SQL 用 `.replace()` hack
category 过滤时计数丢弃条件，与列表不一致，脆弱。

## 已实施修复

### 代码层 bug 修复（4 文件）
| 文件 | 修复 |
|------|------|
| `register.js:55` | `user.displayName` → `user.display_name`（蛇形） |
| `me.js` | GET+PUT 合并到同一 `authMiddleware(req, res, async () => {...})` 调用内 |
| `posts.js` | 拆成两条独立 SQL（带/不带 category），移除 replace hack |
| `community.js` | `api()` 加 15s AbortController 超时 + 明确网络错误提示 |

### SCF 迁移（解决主因 ①）

**获取 DATABASE_URL 的关键步骤**：Vercel 加密 env var 无法通过 dashboard/CLI 解密（`vercel env pull` 返回空值）。最终通过：
1. `vercel login`（device OAuth，用户在浏览器点击 Allow 完成授权）
2. 部署临时 debug 端点 `api/scfmigrate.js`（X-Migrate-Secret 头保护）
3. 从运行时获取 `DATABASE_URL`（Neon PG）和 `JWT_SECRET`（默认值）
4. 删除 debug 端点，重新部署干净代码

**SCF 部署配置**：
| 配置项 | 值 |
|--------|------|
| 函数名 | community-deepsleep |
| 区域 | ap-shanghai |
| 类型 | HTTP（Web 函数，监听 0.0.0.0:9000） |
| Runtime | Nodejs18.15 |
| Handler | scf_bootstrap |
| Memory | 512MB |
| Timeout | 30s |
| 环境变量 | DATABASE_URL（Neon PG）、JWT_SECRET |
| Function URL | `https://1437998910-loiqxuadw0.ap-shanghai.tencentscf.com` |
| AppId | 1437998910 |

**SCF 函数结构**（`scf-community-deepsleep/`）：
- `index.js` — express 服务器，路由 `/api/{register,login,posts,me,init}` 到现有处理器
- `scf_bootstrap` — `#!/bin/bash\nnode index.js`
- `package.json` — express + pg + bcryptjs + jsonwebtoken
- `api/*.js` — 从 `community-deepsleep/api/` 复制（含 bug 修复）
- `node_modules/` — 97 个包，打包进 zip

**部署注意事项**：
- PowerShell `Compress-Archive` 生成反斜杠路径 zip，SCF Linux 无法解压（`Unzip codezip Failded`）。改用 Python `zipfile` 模块打包（正斜杠路径），927 文件 1.18MB
- `CreateTrigger` 的 `TriggerDesc` 必须用 `NetConfig` 嵌套结构：`{"AuthType":"NONE","NetConfig":{"EnableExtranet":true,"EnableIntranet":false}}`，不能把 `EnableExtranet` 放顶层
- `CreateTrigger` 必须传 `TriggerName` 参数
- SCF 函数创建前需确保账户余额 > 0（曾因欠费 4 元创建失败）

### 端到端验证（全部通过，无代理直连）
| # | 测试 | 结果 |
|---|------|------|
| 1 | GET `/` 健康检查 | ✓ `{"ok":true,"service":"community-deepsleep","runtime":"scf"}` |
| 2 | GET `/api/posts` | ✓ 返回 4 条帖子（DB 连接正常） |
| 3 | POST `/api/register` | ✓ 响应含 `displayName`（修复验证） |
| 4 | OPTIONS CORS 预检 | ✓ 200 + `Access-Control-Allow-Origin: https://deepsleep.fun` |
| 5 | POST `/api/posts`（带 token） | ✓ 创建帖子 id=4 |
| 6 | GET `/api/me`（带 token） | ✓ 返回用户信息（authMiddleware 修复验证） |
| 7 | PUT `/api/me`（更新资料） | ✓ `{"success":true,"message":"更新成功"}` |
| 8 | POST `/api/login` | ✓ 返回更新后的用户对象 + token |

## 文件清单
| 路径 | 说明 |
|------|------|
| `scf-community-deepsleep/index.js` | SCF express 入口（路由到 api/*.js） |
| `scf-community-deepsleep/scf_bootstrap` | SCF 启动脚本 |
| `scf-community-deepsleep/package.json` | 依赖：express/pg/bcryptjs/jsonwebtoken |
| `scf-community-deepsleep/api/*.js` | 7 个 API 处理器（含 bug 修复） |
| `scf-community-deepsleep/create-function.json` | CreateFunction 输入（含 base64 代码） |
| `scf-community-deepsleep/create-trigger.json` | CreateTrigger 输入 |
| `scf-community-deepsleep/makezip.py` | Python zip 打包脚本（避免反斜杠问题） |
| `community-deepsleep/api/*.js` | Vercel 版本（同样含 bug 修复，已部署） |
| `blog-static/static/js/community.js` | 前端（API_BASE 已改为 SCF 端点 + fetch 超时） |

## 更新 SCF 函数代码
1. 修改 `scf-community-deepsleep/api/*.js` 或 `index.js`
2. `python makezip.py`（重新打包 code.zip）
3. Base64 编码 + 构造 JSON：
   ```powershell
   $base64 = [System.Convert]::ToBase64String([System.IO.File]::ReadAllBytes("code.zip"))
   # 构造 UpdateFunctionCode JSON（FunctionName + Handler + Code.ZipFile）
   ```
4. `tccli scf UpdateFunctionCode --cli-input-json file://c:/.../update-code.json --region ap-shanghai`

## 排错
- SCF 函数创建失败 "Unzip codezip Failded"：用 Python `zipfile` 打包，不用 PowerShell `Compress-Archive`
- SCF 函数创建失败 "账户余额不足"：`tccli billing DescribeAccountBalance` 检查余额，充值后重试
- CreateTrigger "InvalidParameterValue"：TriggerDesc 用 `NetConfig` 嵌套，不能把 EnableExtranet 放顶层
- CreateTrigger "MissingParameter TriggerName"：必须传 TriggerName
- Vercel env pull 返回空值：加密 env var 无法通过 CLI 解密，需部署临时 debug 端点从运行时获取
- 数据库连接超时：Neon PG 冷启动可能需几秒，SCF Timeout 设 30s

## 待办
- [ ] 用户 push `blog-static` 重新构建 GitHub Pages（让前端 API_BASE 切换生效）
- [ ] 清理测试数据：用户 id=13/14（bugtest-135790@example.com / scf-test-246@example.com）、帖子 id=3/4
- [ ] 可选：给 SCF 端点配自定义域名（如 community-api.deepsleep.fun）避免 SCF 域名被未来屏蔽
