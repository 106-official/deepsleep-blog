# DeepSleep 社区后端

为博客「社区」模块提供账号注册 / 登录 / 发帖 / 个人资料的后端 API。
前端在 `static/js/community.js`（部署到腾讯云 SCF），与现有社区前端契约完全一致，无需改动前端逻辑。

## 接口契约（前端已在用）

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| POST | `/register` | 否 | body: `{email, password, displayName}` → `{token, user}` |
| POST | `/login` | 否 | body: `{email, password}` → `{token, user}` |
| GET  | `/posts?page=&limit=&category=` | 否 | → `{posts, pagination:{total}}` |
| POST | `/posts` | 是 | body: `{title, content, category}` → `{success, post}` |
| GET  | `/me` | 是 | → `{success, user}` |
| PUT  | `/me` | 是 | body: `{displayName, avatarUrl, bio}` → `{success, user}` |
| POST | `/api/llm/chat` | 否 | body: `{messages:[{role,content}], model?}` → `{reply}` 或 `{mock:true, reply}`。立信村学习 RPG 的对话/问答后端，密钥仅服务端 |

错误统一返回 `{ error: "提示信息" }`，并带对应 HTTP 状态码（400/401/404/409/500）。

## 本地运行（SQLite，零依赖数据库）

```bash
cd community-backend
npm install
npm start
# 默认 http://localhost:3000
```

环境变量可选：`PORT`（默认 3000）、`JWT_SECRET`（默认开发用弱密钥，生产务必改）、`DB_TYPE=sqlite`（默认）。

自测：

```bash
curl -X POST localhost:3000/register -H 'Content-Type: application/json' \
  -d '{"email":"a@b.com","password":"123456","displayName":"测试"}'
curl localhost:3000/posts
```

## 生产部署（腾讯云 SCF + TencentDB for MySQL）

### 1. 准备数据库
在腾讯云控制台创建 **云数据库 MySQL（TencentDB）**，新建库（如 `deepsleep`），字符集 `utf8mb4`。
后端会在首次启动时自动建表（`users` / `posts`），无需手动执行 SQL。

### 2. 配置环境变量（SCF 函数环境变量）
| 变量 | 说明 |
|------|------|
| `DB_TYPE` | 设为 `mysql` |
| `MYSQL_HOST` | TencentDB 内网/外网地址 |
| `MYSQL_PORT` | 默认 3306 |
| `MYSQL_USER` | 数据库账号 |
| `MYSQL_PASSWORD` | 数据库密码 |
| `MYSQL_DATABASE` | 库名，如 `deepsleep` |
| `JWT_SECRET` | **务必改成随机长字符串**，否则 token 可被伪造 |

> SCF 与 TencentDB 同地域时，请用内网地址，免费且延迟低。

### 6. 学习 RPG 的 LLM 代理（可选）

`/api/llm/chat` 对接任意 OpenAI 兼容的 Chat Completions 接口，供 `static/lixin/rpg/` 的
「立信村学习 RPG」使用（自由问答 + Grill me 摸底）。密钥**只存在于后端环境变量**，前端不持有。

| 变量 | 说明 | 默认 |
|------|------|------|
| `LLM_API_KEY` | 大模型 API Key；**未设置则返回 `{mock:true}`**，前端自动降级为内置 Demo | 空 |
| `LLM_BASE_URL` | 兼容接口基址，去掉末尾 `/` | `https://api.deepseek.com/v1`（DeepSeek） |
| `LLM_MODEL` | 模型名（前端也可按请求覆盖 `model` 字段） | `deepseek-chat` |

常见供应商填法：
- **DeepSeek（默认）**：`LLM_BASE_URL=https://api.deepseek.com/v1`，`LLM_MODEL=deepseek-chat`
- OpenAI：`LLM_BASE_URL=https://api.openai.com/v1`
- 通义千问（兼容模式）：`LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1`
- 智谱 GLM：`LLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4`

> 配置示例见 `.env.example`：复制为 `.env` 后填入 `LLM_API_KEY` 即可（切勿提交真实 key）。

前端在「⚙ 设置」里填后端网关地址（如 `https://<网关>/api`）即可启用真实大模型；留空则玩 Demo。

### 3. 部署函数
方式 A（控制台）：
1. 在 `community-backend/` 执行 `npm install --production`（或本地装好依赖一起打包）。
2. 将整个目录打包为 zip，上传到 SCF（运行时 Node.js 18）。
3. 执行方法填 `scf.main_handler`。

方式 B（Serverless Framework / 命令行）：把本目录作为函数代码，入口 `scf.main_handler`。

### 4. 绑定 API 网关
在 SCF 函数上 **创建 API 网关触发**，建议：
- 路径：`/` （或 `/api`），后端路径映射为 `/`，开启「启用 CORS」并允许 `GET/POST/PUT/OPTIONS`。
- 由于前端已把 `API_BASE` 写成 `.../api`，网关路径建议配置为 `/api`，或把前端 `API_BASE` 改为函数根路径。两者保持一致即可。

部署后把得到的 API 网关域名填回前端：
- `static/js/community.js` 的 `API_BASE`
- `layouts/_default/posts.html` 的 `API_BASE`（本仓库已统一为 SCF 端点）

### 5. 验证
```bash
curl https://<你的SCF网关>/api/health
curl -X POST https://<你的SCF网关>/api/register -H 'Content-Type: application/json' \
  -d '{"email":"a@b.com","password":"123456","displayName":"测试"}'
```
返回 token 即代表注册链路打通，所有人即可在前端 `/community/` 注册账号。

## 安全提醒
- 生产务必设置强 `JWT_SECRET`。
- 数据库密码、JWT 密钥不要提交进仓库（已写入 `.gitignore` 的 `.env`）。
- 当前接口未做发帖频率限制 / 内容审核，上线前建议加一层基础风控。
- 全站 HTTPS（GitHub Pages 与 SCF 网关均默认支持）。
