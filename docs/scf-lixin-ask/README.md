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
| **响应方式** | SSE 流式(`res.write` + `res.end`,SCF Web 函数原生支持) |
| **限速** | 每 IP 每小时 10 次 |

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
