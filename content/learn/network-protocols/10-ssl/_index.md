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

## 生活化类比

想象你要跟一家银行通信。你先要求对方出示**营业执照**（证书），确认它真是那家银行、不是路边冒牌的；确认无误后，你们当场商量出一把**只有你俩知道的暗号本**（会话密钥），之后所有对话都用这套暗号来说。

旁边的人能看到你们在说话、说了多久、说了多少字，但**一个字也听不懂，也没法偷偷改动其中一句**——因为改了对方一核对就发现不对。SSL 干的就是"验明正身 + 约定暗号 + 全程加密并防篡改"这三件事。

## 3. 它解决什么问题

为什么没有它，网络就"缺了一块"：

1. **机密性**：防止中间人窃听（对称加密应用数据）。
2. **完整性**：MAC 防止篡改。
3. **认证**：服务端（可选客户端）证书验证身份，防钓鱼/中间人。
4. **会话复用**：用 Session ID / Session Ticket 避免每次全量握手。

## 4. 核心特征

- 【底座】**记录协议（Record Protocol）** 为底层：把数据分片、压缩（SSLv3 后基本不用）、MAC、加密，再加 5 字节记录头（ContentType/Version/Length）。
- 【四大子协议】**四类子协议**：Handshake（握手）、ChangeCipherSpec（切换密码）、Alert（告警）、Application Data（应用数据）。
- 【类型编号】**ContentType**：20=ChangeCipherSpec，21=Alert，22=Handshake，23=Application Data。
- 【致命顺序】**MAC-then-Encrypt**（SSLv3）：先算 MAC 再加密，这一顺序致 **POODLE** 漏洞。
- 【已废弃】**已被废弃**：SSLv3 受 POODLE（CVE-2014-3566）威胁，RFC 7568 禁止启用；现代只用 **TLS 1.2/1.3**。

## 5. 与其他协议的关系

| 相关协议 | 关系 |
|---------|------|
| **TLS** | SSL 的直接继任者；TLS 1.0≈SSL 3.1，握手/记录结构一脉相承、更安全 |
| **TCP** | SSL 承载于 TCP 之上 |
| **HTTPS** | HTTP over SSL/TLS，端口 443 |
| **DTLS** | 基于 UDP 的 TLS 变体 |

## 6. 本目录学习路线

1. **[01-原理与报文](01-原理与报文/)** — 记录协议与四类子协议、握手全流程时序（ClientHello→Finished）、记录头字段、密钥派生与 MAC-then-Encrypt、知识框架。
2. **[02-实战与排错](02-实战与排错/)** — Wireshark `ssl`/`tls` 解密观察、openssl s_client 实测、POODLE/证书错误/握手失败排查、SSL 与 TLS 对比与面试速查。

> 初学者最常踩的坑：把"SSL"当成今天还在用的协议去学配置。**SSLv3 已被 RFC 7568 正式废弃**（POODLE，CVE-2014-3566），现代环境只应启用 TLS 1.2/1.3；日常说的"SSL 证书"其实是 TLS 证书，只是名字沿用下来了。学 SSL 的价值在于读懂记录协议和握手结构——这套结构 TLS 一脉相承。
