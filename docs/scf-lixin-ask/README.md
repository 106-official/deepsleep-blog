# 立信 LLM 问答接口 (scf-lixin-ask) — 腾讯云 SCF

DeepSleep 博客立信板块(/lixin/)的 LLM 问答后端,腾讯云 SCF Web 函数部署。

> 立信板块的问答接口原挂在 Waline 项目的 Vercel 上(`waline-deepsleep/api/lixin-ask.js`),后因 Vercel 国内手机端不可达,迁移为独立的 SCF Web 函数(与社区后端同日迁移,2026-07-30)。

## 基本信息

| 属性 | 值 |
|------|-----|
| **项目目录** | `c:\Users\26516\Desktop\n8n\scf-lixin-ask` |
| **部署** | 腾讯云函数 SCF(Web 函数类型) |
| **启动** | `scf_bootstrap` + 监听 9000 端口 |
| **模型** | DeepSeek API(`deepseek-v4-flash`,`https://api.deepseek.com/v1/chat/completions`) |
| **响应方式** | 旧版 SSE 流式；RPG 格式返回 JSON `{reply, mock}` |
| **限速** | 每 IP 每小时 10 次 |

## 选课避雷知识库（course-kb.json）

后端启动时会加载同目录的 `course-kb.json`（由 `立信选课推荐及避坑.xlsx` 的「工作表1_后台数据」解析生成，收录 113 位教师、387 条学生评价）。

- **检索**：每次请求根据问题中的**教师姓名**做轻量子串匹配，命中的教师评价才注入 system prompt；未命中则只给教师名册索引，引导用户指明具体老师。这样既不浪费 token，也能精准回答"XX 老师怎么样 / 避雷吗"。
- **双格式兼容**：
  1. 旧版 `POST /`：`{question, context?, topics?}` → SSE 流式 `{delta}`。
  2. RPG 前端 `POST /api/llm/chat`：`{messages:[{role,content}...]}` → JSON `{reply, mock:false}`。RPG 的「⚙ 设置」里把后端地址填为该函数 URL 即可直接接入真实大模型（含选课知识）。
- **部署注意**：`course-kb.json` 必须随函数代码一并上传（否则知识库为空，仅打印告警）。

## 环境变量

| 变量名 | 说明 |
|--------|------|
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 |

## 请求

- `POST /`(SCF 触发路径)
- CORS: 仅允许 `https://deepsleep.fun`
- 请求体: 含用户问题(`question` 字段,最长 500 字符)
- 响应: SSE 流式文本

## 安全限制

- 每 IP 每小时最多 10 次(实例级 rateMap,公益场景可接受)
- 问题长度上限 500 字符
- 客户端 IP 通过 `x-forwarded-for` / `x-real-ip` 识别

## 部署流程

```bash
cd scf-lixin-ask
# 打包上传至腾讯云 SCF(Web 函数),配置 DEEPSEEK_API_KEY 环境变量
```

## 配置文件

| 文件 | 说明 |
|------|------|
| `index.js` | HTTP server 入口(SSE 转发 DeepSeek) |
| `scf_bootstrap` | SCF 启动脚本 |
| `serverless.yml` | Serverless Framework 部署配置 |
