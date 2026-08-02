---
title: "SSL — 安全套接层"
description: "为 TCP 之上的应用提供加密与认证的传输安全协议（已废弃，由 TLS 取代）/ 表示安全层 / 位于 TCP 之上 / SSLv3 RFC 6101（历史）"
layout: "learn"
category: "network-protocols"
layer: "表示安全层"
weight: 10
rfc: "RFC 6101（SSLv3 历史文档）；RFC 7568 正式废弃 SSLv3"
port: "无（承载于 TCP；如 HTTPS 443）"
keywords: ["SSL", "安全套接层", "Secure Sockets Layer", "TLS", "握手", "ClientHello", "POODLE", "RFC 6101", "加密", "会话复用"]
ShowToc: true
TocOpen: true
---

## 1. 协议定位

| 项目 | 信息 |
|------|------|
| 所属层 | 表示层/安全层（位于 TCP 之上，应用层之下） |
| 英文全称 | Secure Sockets Layer |
| 主要 RFC | **RFC 6101**（SSLv3 历史规范）；**RFC 7568** 正式废弃 SSLv3 |
| 端口 | 无独立端口；承载于 TCP，如 HTTPS 443、SMTPS 465 |
| 封装于 | TCP（为应用数据提供机密性+完整性+认证） |
| 典型应用 | 已由 **TLS** 全面取代；理解 SSL 是读懂 TLS 演进的钥匙 |

## 2. 一句话理解

**SSL 是"TCP 之上加的一层密码学外衣"**：握手阶段协商密钥、验证对端证书，之后用对称密钥加密应用数据。它把"明文 TCP"升级成"可信加密通道"。SSL 现已不安全，继任者 **TLS（传输层安全）** 在 1.0 时即相当于 SSL 3.1。

## 3. 它解决什么问题

1. **机密性**：防止中间人窃听（对称加密应用数据）。
2. **完整性**：MAC 防止篡改。
3. **认证**：服务端（可选客户端）证书验证身份，防钓鱼/中间人。
4. **会话复用**：用 Session ID / Session Ticket 避免每次全量握手。

## 4. 核心特征

- **记录协议（Record Protocol）** 为底层：把数据分片、压缩（SSLv3 后基本不用）、MAC、加密，再加 5 字节记录头（ContentType/Version/Length）。
- **四类子协议**：Handshake（握手）、ChangeCipherSpec（切换密码）、Alert（告警）、Application Data（应用数据）。
- **ContentType**：20=ChangeCipherSpec，21=Alert，22=Handshake，23=Application Data。
- **MAC-then-Encrypt**（SSLv3）：先算 MAC 再加密，这一顺序致 **POODLE** 漏洞。
- **已被废弃**：SSLv3 受 POODLE（CVE-2014-3566）威胁，RFC 7568 禁止启用；现代只用 **TLS 1.2/1.3**。

## 5. 与其他协议的关系

| 相关协议 | 关系 |
|---------|------|
| **TLS** | SSL 的直接继任者；TLS 1.0≈SSL 3.1，握手/记录结构一脉相承、更安全 |
| **TCP** | SSL 承载于 TCP 之上 |
| **HTTPS** | HTTP over SSL/TLS，端口 443 |
| **DTLS** | 基于 UDP 的 TLS 变体 |

## 6. 本目录学习路线

1. **[01-原理与报文](01-原理与报文.md)** — 记录协议与四类子协议、握手全流程时序（ClientHello→Finished）、记录头字段、密钥派生与 MAC-then-Encrypt、知识框架。
2. **[02-实战与排错](02-实战与排错.md)** — Wireshark `ssl`/`tls` 解密观察、openssl s_client 实测、POODLE/证书错误/握手失败排查、SSL 与 TLS 对比与面试速查。
