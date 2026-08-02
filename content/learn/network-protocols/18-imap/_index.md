---
title: "IMAP — 互联网邮件访问协议"
description: "邮件的『在线管理』协议：应用层，基于 TCP 143（IMAPS 993），由 RFC 3501 定义，邮件留在服务器多端同步"
layout: "learn"
category: "network-protocols"
layer: "应用层"
weight: 18
rfc: "RFC 3501"
port: "143 / 993"
keywords: ["IMAP", "IMAP4rev1", "邮件同步", "FETCH", "SEARCH", "IDLE", "邮箱文件夹", "RFC 3501", "RFC 9051"]
ShowToc: true
TocOpen: true
---

## 1. 协议定位

| 项目 | 信息 |
|------|------|
| 所属层 | 应用层（Application Layer） |
| 英文全称 | Internet Message Access Protocol（互联网邮件访问协议），当前主流版本 IMAP4rev1 |
| 主要 RFC | **RFC 3501**（IMAP4rev1）；RFC 9051（IMAP4rev2，2021 年新版）；RFC 2177（IDLE 推送）；RFC 4315（UIDPLUS）；RFC 4551（CONDSTORE）；RFC 6851（MOVE）；RFC 6154（特殊用途文件夹）；RFC 8314（隐式 TLS 推荐） |
| 端口 | **TCP 143**（明文 / STARTTLS 升级）、**TCP 993**（IMAPS，隐式 TLS） |
| 封装于 | TCP，文本行式命令，行结束符 CRLF，支持字面量（Literal）传二进制 |
| 典型应用 | 手机 + 电脑 + 网页多端收信；企业/团队共享邮箱；需要服务端搜索与文件夹分类的场景 |

## 2. 一句话理解

**IMAP 把服务器当成"邮件的唯一真相源"：客户端只是一个视图窗口，所有已读标记、文件夹归档、删除操作都写回服务器，于是所有设备看到的都是同一份状态。**

## 3. 它解决什么问题

POP3 的"下载即搬走"模型在多设备时代彻底失效：手机收了信电脑就看不到，电脑上分好的文件夹手机上不存在，已读状态各自为政。IMAP 针对性地解决四件事：

1. **多端状态一致**：已读（`\Seen`）、星标（`\Flagged`）、回复过（`\Answered`）等标志存在服务器，任一端修改，全端同步。
2. **服务器端文件夹**：支持创建、重命名、订阅任意层级的邮箱（Mailbox/Folder），归档结构对所有客户端可见。
3. **按需获取（Partial Fetch）**：可以只取头部渲染列表、只取某个 MIME 段下载单个附件，不必整封拉下来——这对手机流量至关重要。
4. **服务器端搜索与推送**：`SEARCH` 在服务端完成检索（无需本地全量数据），`IDLE` 让服务器主动推送新邮件通知，实现"准实时"到达。

## 4. 核心特征

- **带标签的命令流水线**：每条命令以客户端生成的**标签（Tag）**开头（如 `a001 SELECT INBOX`），响应用同一标签结束，因此可以**并发发多条命令**、乱序收响应。
- **四状态模型**：未认证（Not Authenticated）→ 已认证（Authenticated）→ 已选择（Selected）→ 注销（Logout）。
- **响应分三类**：带标签的最终响应（`OK`/`NO`/`BAD`）、以 `*` 开头的**未标记响应**（服务器主动数据/事件）、以 `+` 开头的**续行请求**。
- **两套编号并存**：序号（Sequence Number，随删除而重排）与 **UID**（在同一 `UIDVALIDITY` 下永久不变），编程一律用 UID。
- **删除是两步**：`STORE +FLAGS \Deleted` 打标记 → `EXPUNGE` 真删除；许多客户端实际用"移动到已删除邮件"文件夹代替。
- **协议复杂度高**：命令数十条、语法含括号嵌套与字面量，实现难度远高于 POP3，但换来了功能完备性。

## 5. 与其他协议的关系

| 相关协议 | 关系 |
|---------|------|
| **SMTP** | 互补：IMAP 只收不发，发信仍必须配置 SMTP；客户端发完信后通常用 `APPEND` 把副本写入"已发送"文件夹 |
| **POP3** | 同类竞品：POP3 下载搬走，IMAP 在线同步；IMAP 是多设备场景的事实标准 |
| **TLS** | `STARTTLS`（143 升级）或隐式 TLS（993）；RFC 8314 推荐直接用 993 |
| **TCP** | 承载层；`IDLE` 依赖长连接保持，需注意 NAT/防火墙的空闲超时 |
| **JMAP**（RFC 8620/8621） | 新一代基于 JSON over HTTP 的邮件访问协议，目标是替代 IMAP，目前生态仍小 |

## 6. 本目录学习路线

1. **[01-原理与报文](01-原理与报文.md)** — 四状态机、标签与三类响应、完整命令集、标志与 UID 体系、FETCH 数据项、IDLE 推送、会话时序图。
2. **[02-实战与排错](02-实战与排错.md)** — Wireshark 过滤、openssl 手工完整会话、同步不一致/IDLE 掉线/UIDVALIDITY 变更排查、与 POP3 全面对比、面试题。

> 学习建议：先用 `openssl s_client -connect imap.qq.com:993` 敲一遍 `LOGIN → LIST → SELECT INBOX → UID FETCH → LOGOUT`，直观感受"标签 + 未标记响应"这套交互模型，再去理解 `FETCH` 复杂的数据项语法。
