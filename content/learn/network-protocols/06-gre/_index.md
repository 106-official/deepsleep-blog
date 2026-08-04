---
title: "GRE — 通用路由封装"
description: "把任意网络层协议封装进另一种网络层协议的通用隧道协议 / 网络层（隧道） / 无端口，IP 协议号 47 / RFC 2784"
layout: "learn"
category: "network-protocols"
layer: "网络层（隧道）"
weight: 6
rfc: "RFC 2784（扩展 RFC 2890；前身 RFC 1701/1702）"
port: "无（IP 协议号 47）"
keywords: ["GRE", "通用路由封装", "隧道", "Generic Routing Encapsulation", "RFC 2784", "IP 协议号 47", "GRE over IPSec", "NVGRE", "GRETAP"]
ShowToc: true
TocOpen: true
---

## 1. 协议定位

| 项目 | 信息 |
|------|------|
| 所属层 | 网络层（隧道 / 封装协议） |
| 英文全称 | Generic Routing Encapsulation |
| 主要 RFC | **RFC 2784**（2000）；**RFC 2890**（Key/Sequence 扩展）；RFC 1701/1702（历史） |
| 端口 | **无**，直接以 **IP 协议号 47** 承载 |
| 封装于 | IPv4 / IPv6（交付协议），也可被 IPSec 再封装 |
| 典型应用 | 站点间隧道、私网跨公网互联、组播/动态路由过 VPN、GRE over IPSec、DMVPN、NVGRE overlay |

## 2. 一句话理解

**GRE 是"网络层的快递纸箱"**：把完整报文（乘客协议 Payload）原封不动塞进箱，贴新外层 IP（交付协议），中间网络只看外层地址转发，到目的地拆箱还原。

三层结构：`外层 IP 头（协议号 47）` + `GRE 头（4~16 字节）` + `原始报文`。

## 💡 生活化类比

想象你要把一封写着"公司内部门牌号"的信寄给外地分公司。这个门牌号只有公司内部认识，邮局根本送不了。于是你把整封信塞进一个新信封，外面写上两家公司的**公网街道地址**——邮局只认外面这层地址，一路照送；分公司收到后拆开外信封，里面那封写着内部门牌号的信原封不动，照着内部规则继续投递。

GRE 干的就是这件事：**外层负责"能送到"，内层负责"到了以后怎么分发"，而且中间的邮局全程不知道、也不需要知道里面装的是什么**。

## 3. 它解决什么问题

为什么没有它，网络就"缺了一块"：

1. **异构协议穿越**：用通用头 + `Protocol Type`（EtherType）把 n 种协议互穿从 O(n²) 降到 O(n)，IPv6-over-IPv4、MPLS-over-IP 共用一套。
2. **私网互联**：用公网地址做外层封装，把私网报文"背"过公网。
3. **隧道即链路**：GRE 隧道口是虚拟三层接口，可跑 **OSPF/RIP/组播** —— 纯 IPSec 隧道模式做不到。经典组合 **GRE over IPSec**：GRE 管路由/组播，IPSec 管加密。
4. **二层 overlay**：`Protocol Type = 0x6558`（Transparent Ethernet Bridging）封装以太帧，即 GRETAP / NVGRE。

## 4. 核心特征

- 【无状态】**无状态**：无握手、无协商、无会话，配置极简；本身不感知对端死活，需 Keepalive 或路由 Hello 探测。
- 【不安全】**不加密不认证**：明文封装；`Key` 仅是流标识，非安全凭证，可被伪造，机密性须叠 IPSec。
- 【开销小】**头部极小**：最小 4 字节；加外层 IPv4 头 20 字节，典型开销 24 字节，隧道 MTU 常设 **1476**（1500−24）。
- 【尽力而为】**不可靠、可选保序**：默认不重传不排序；置 `S` 位用 `Sequence Number` 提供"不可靠但有序"交付（乱序丢弃）。
- 【自己坑自己】**递归封装风险**：隧道路由指向隧道自身会触发"递归路由"，致隧道反复 up/down。

## 5. 与其他协议的关系

| 相关协议 | 关系 |
|---------|------|
| **IP** | 交付协议，也常是乘客协议（IP-in-IP over GRE） |
| **IPSec** | 互补。GRE 提供可跑路由/组播的虚拟链路，IPSec 提供加密，合称 GRE over IPSec |
| **IP-in-IP (RFC 2003)** | 仅 20 字节外层 IP、无 GRE 头，但**只能承载 IP 单播**，不能组播/封二层 |
| **VXLAN** | 同为 overlay；VXLAN 走 UDP 4789（对 ECMP/NAT 友好），GRE 走 IP 协议号 47（易被防火墙/NAT 拦） |
| **PPTP** | 用 RFC 2637"增强型 GRE"（Version=1 带 Ack）承载 PPP，与标准 GRE 不同 |

## 6. 本目录学习路线

1. **[01-原理与报文](01-原理与报文/)** — 封装/解封装流程、GRE 头部逐比特拆解（C/K/S 标志、Protocol Type）、建隧时序图、MTU 与递归路由机制。
2. **[02-实战与排错](02-实战与排错/)** — Wireshark `gre` 过滤、Linux `ip tunnel` 实操、隧道不通/MTU 黑洞/递归路由排查、与 IPSec/VXLAN 对比与面试速查。

> 建议：先在两台 Linux 虚机手搭一条 GRE 隧道，用 `tcpdump -i eth0 proto gre` 看外层封装，再回头读头部字段。

> ⚠️ 初学者最常踩的坑：以为"隧道接口显示 UP 就等于通了"。GRE 是**无状态**协议，接口 UP 并不反映对端死活，必须靠 Keepalive 或路由 Hello 探测；同样别指望 `Key` 能当密码用——它只是流标识、明文可伪造，要机密性必须叠 IPSec。
