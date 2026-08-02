---
title: "SMTP — 简单邮件传输协议"
description: "邮件的『发送』协议：应用层，基于 TCP 25（提交用 587/465），由 RFC 5321 定义"
layout: "learn"
category: "network-protocols"
layer: "应用层"
weight: 16
rfc: "RFC 5321"
port: "25 / 587 / 465"
keywords: ["SMTP", "简单邮件传输协议", "ESMTP", "MIME", "邮件中继", "STARTTLS", "SMTP AUTH", "RFC 5321"]
ShowToc: true
TocOpen: true
---

## 1. 协议定位

| 项目 | 信息 |
|------|------|
| 所属层 | 应用层（Application Layer） |
| 英文全称 | Simple Mail Transfer Protocol（简单邮件传输协议） |
| 主要 RFC | RFC 5321（SMTP 主标准，取代 RFC 2821/821）；RFC 5322（邮件报文格式）；RFC 3207（STARTTLS）；RFC 4954（AUTH）；RFC 6409（Message Submission，587）；RFC 8314（隐式 TLS，465）；RFC 2045–2049（MIME） |
| 端口 | **TCP 25**（MTA 之间中继）、**TCP 587**（客户端提交 Submission，STARTTLS）、**TCP 465**（Submissions，隐式 TLS） |
| 封装于 | TCP（面向连接、可靠、有序），文本行式命令，行结束符为 CRLF |
| 典型应用 | 邮件客户端投递邮件到自家服务器；邮件服务器之间投递邮件（如 QQ 邮箱 → Gmail） |

## 2. 一句话理解

**SMTP 是"推"协议，只管把邮件从发送方推到收件服务器；至于用户怎么把邮件"拉"下来看，那是 POP3 / IMAP 的事。**

## 3. 它解决什么问题

早期互联网需要一个跨主机、跨组织的统一邮件投递机制。SMTP 用一套**纯文本、可人工朗读**的命令/响应对话解决了三件事：

1. **谁发、发给谁**：通过 `MAIL FROM:` 与 `RCPT TO:` 建立"信封（Envelope）"，与邮件正文里的 `From:` / `To:` 头部（Header）相互独立——这正是伪造发件人显示名的根源，也是 SPF/DKIM/DMARC 出现的原因。
2. **内容怎么传**：`DATA` 命令后以 `<CRLF>.<CRLF>` 作为结束标记传输报文；二进制附件由 MIME 编码（Base64 / Quoted-Printable）成 7bit ASCII。
3. **跨域怎么走**：发送方通过 DNS 查询目标域的 **MX 记录**找到对方 MTA，逐跳中继（Relay），每跳追加一条 `Received:` 头，形成可追溯的投递路径。

## 4. 核心特征

- **文本行协议**：命令 4 个字母 + 参数，响应 3 位数字状态码 + 说明文字，可用 `telnet`/`openssl s_client` 手工敲完整会话。
- **状态码分级**：`2xx` 成功、`3xx` 中间态（如 354 等待数据）、`4xx` **临时**失败（会重试）、`5xx` **永久**失败（退信）。4xx 与 5xx 的区分是排错第一要点。
- **ESMTP 扩展机制**：用 `EHLO` 替代 `HELO`，服务器以多行 250 响应回报支持的扩展（`STARTTLS`、`AUTH`、`SIZE`、`8BITMIME`、`PIPELINING`、`DSN` 等）。
- **存储转发（Store and Forward）**：投递失败不会立刻丢弃，MTA 入队重试（典型重试窗口 4 小时提醒、4~5 天放弃），故邮件延迟可达数小时。
- **只发不收**：SMTP 服务器不提供"列出邮箱里的信"这类能力。
- **默认明文，安全靠叠加**：机密性由 STARTTLS/隐式 TLS 提供，身份真实性由 SMTP AUTH + SPF/DKIM/DMARC 提供。

## 5. 与其他协议的关系

| 相关协议 | 关系 |
|---------|------|
| **DNS** | SMTP 靠 MX 记录定位对端 MTA；无 MX 时回退到 A/AAAA 记录 |
| **TCP** | SMTP 的承载层，保证命令与报文按序可靠到达 |
| **TLS** | 通过 STARTTLS（587/25）或隐式 TLS（465）加密整条会话 |
| **POP3 / IMAP** | 互补而非竞争：SMTP 负责**发**，POP3/IMAP 负责**收** |
| **MIME** | 不是独立协议，而是邮件报文的内容格式扩展，让 SMTP 能携带附件与多语言字符 |

## 6. 本目录学习路线

1. **[01-原理与报文](01-原理与报文/)** — SMTP 命令集与响应码、信封与报文头的区别、MIME 结构、完整投递时序图。
2. **[02-实战与排错](02-实战与排错/)** — Wireshark 抓包过滤、telnet/openssl 手工发信、退信码解读、开放中继与鉴权失败排查、与 POP3/IMAP 对比速查。

> 学习建议：先手工用 `telnet` 敲一遍完整会话（`EHLO → MAIL FROM → RCPT TO → DATA → .`），比看十遍文档都管用。之后再理解 STARTTLS 与 AUTH 是如何"插进"这条会话的。
