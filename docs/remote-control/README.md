# 远程接管 MCP 服务器 (remote-control)

通过 MCP 协议远程控制本机的服务。将本地能力(任意 shell 执行 + 全量文件系统访问)以 Streamable HTTP 暴露在 `/mcp` 端点。

> 项目名: `remote-takeover-mcp` · 目录: `c:\Users\26516\Desktop\n8n\remote-control`

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | MCP Server(stdio 工具 → Streamable HTTP) |
| **端点** | `POST /mcp` |
| **端口** | `PORT`(默认 3000) |
| **依赖** | `@modelcontextprotocol/sdk` + `zod` |
| **Node** | >=18(ESM) |

## 提供的能力

| 工具 | 说明 |
|------|------|
| `exec` | 执行任意 shell 命令(可指定 cwd / 超时) |
| `read_file` | 读取文件内容 |
| `write_file` | 写入文件 |
| `list_dir` | 列出目录内容 |

## 环境变量

| 变量名 | 说明 |
|--------|------|
| `PORT` | HTTP 端口(默认 3000) |
| `MCP_TOKEN` | 访问令牌校验(建议必填) |
| `FS_ROOT` | 文件系统访问根目录(默认 `/`,谨慎) |

## 安全说明

- `MCP_TOKEN` 做请求鉴权,建议放在隧道/Tailscale 内层使用,不直接暴露公网
- `exec` 与 `write_file` 均为高危能力,仅授予可信客户端

## 启动

```bash
cd remote-control
npm install
MCP_TOKEN=your-token PORT=3000 npm start
```

## 客户端接入

MCP 客户端以 `http://<host>:3000/mcp` 连接,请求头携带 `Authorization: Bearer <MCP_TOKEN>`。

## 文件

| 文件 | 说明 |
|------|------|
| `server.mjs` | MCP 服务器入口(注册工具 + HTTP 传输) |
| `package.json` | 依赖与启动脚本 |
| `run.sh` | 启动脚本 |
