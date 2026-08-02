---
title: "ICMP — 互联网控制报文协议"
description: "为 IP 提供差错报告与网络诊断 / 网络层 / 无端口（IP Protocol = 1）/ RFC 792"
layout: "learn"
category: "network-protocols"
layer: "网络层"
weight: 1
rfc: "RFC 792（ICMPv4）/ RFC 4443（ICMPv6）"
port: "无（IP Protocol = 1，ICMPv6 = 58）"
keywords: ["ICMP", "ping", "traceroute", "目的不可达", "TTL超时", "重定向", "Type Code", "RFC 792", "ICMPv6"]
ShowToc: true
TocOpen: true
---

## 1. 协议定位

| 项目 | 信息 |
|------|------|
| 所属层 | 网络层（与 IP 同层，但**封装在 IP 数据报内**，是 IP 的"随身信使"） |
| 英文全称 | Internet Control Message Protocol |
| 主要 RFC | **RFC 792**（ICMPv4，1981，STD 5）；相关：RFC 1122（主机要求）、RFC 1191（PMTUD）、RFC 1812（路由器要求）、**RFC 4443**（ICMPv6）、RFC 4884（多部分扩展） |
| 端口 | **无**。ICMP 不使用端口，靠 **Type（类型）+ Code（代码）** 区分报文语义；查询类报文用 Identifier + Sequence Number 做会话配对 |
| 封装于 | IP 数据报，**IPv4 Protocol = 1**；**ICMPv6 Next Header = 58** |
| 典型应用 | `ping`（连通性）、`traceroute`（路径追踪）、PMTUD（路径 MTU 发现）、路由不可达告警、ICMP 重定向；IPv6 下还承载 **NDP、MLD、PMTUD** 等核心功能 |

## 2. 一句话理解

**ICMP 是 IP 网络的"报错回执与体检工具"**：IP 只管闷头投递、丢了不吭声，ICMP 补上了"为什么没送到""路太长了""包太大了""换条路走"这些反馈，同时顺带提供了 ping 和 traceroute 这两把全世界网络工程师最常用的诊断刀。

## 3. 它解决什么问题

IP 是**尽力而为**的：包被丢弃时不通知任何人。这在实际网络中不可接受，会带来三类问题：

1. **故障不可见**：主机不知道包为什么没到——是目标关机？路由缺失？防火墙拦截？还是端口没人监听？ICMP 用 **Type 3 Destination Unreachable** 的不同 Code 精确区分这些原因。
2. **无法探测与诊断**：需要一种轻量方式验证"某个 IP 是否可达""路径经过哪些跳"。ICMP 提供 **Echo Request/Reply（Type 8/0）** 与 **Time Exceeded（Type 11）**，直接催生了 `ping` 与 `traceroute`。
3. **参数无法协商**：路径中最小 MTU 是多少？下一跳应该走谁更优？ICMP 用 **Type 3 Code 4（分片需求）** 支撑 PMTUD，用 **Type 5（重定向）** 提示更优下一跳。

> **注意 ICMP 的边界**：它只做**报告**，不做**纠正**。ICMP 告诉你"包丢了"，但不会替你重传——那是 TCP 的职责。ICMP 本身也是不可靠的，其报文同样可能丢失。

## 4. 核心特征

- **依附于 IP**：ICMP 报文封装在 IP 数据报中（Protocol=1），但在概念上属于网络层而非传输层。
- **Type + Code 二级分类**：Type 定类别（不可达/超时/回显…），Code 定细因（网络不可达/主机不可达/端口不可达…）。
- **差错报文携带"案发现场"**：差错类报文会附带**原始 IP 头 + 前 8 字节数据**，接收方据此定位是哪个连接出的错（前 8 字节恰好含 TCP/UDP 的源/目的端口，足以匹配到具体套接字）。
- **两大类报文**：**差错报告类**（Type 3/4/5/11/12）与**查询/信息类**（Type 0/8/13/14 等）。
- **严格的抑制规则**（RFC 1122）：为防止风暴，以下情况**不产生** ICMP 差错报文——① 对 ICMP 差错报文本身；② 对目的地址为广播/组播的包；③ 对非第一个分片；④ 对源地址非单播的包。
- **不可靠、无重传**：ICMP 报文丢失就丢失，不会重发。
- **IPv6 中地位跃升**：ICMPv6（RFC 4443）不仅报错，还承载 **NDP**（邻居/路由器发现）、**MLD**（组播成员管理）、**PMTUD**——**完全禁用 ICMPv6 会导致 IPv6 网络直接瘫痪**。

## 5. 与其他协议的关系

| 相关协议 | 关系说明 |
|---------|---------|
| **IP** | ICMP 是 IP 的配套控制协议，封装于 IP 内（Protocol=1），同时又为 IP 转发提供反馈闭环 |
| **TCP** | TCP 可利用 ICMP 软错误（如 Type 3 Code 4）调整 MSS 实现 PMTUD；也可能因收到硬错误（Code 3 端口不可达）而快速失败 |
| **UDP** | UDP 无连接无反馈，**完全依赖 ICMP Port Unreachable（Type 3 Code 3）** 告知"对端没人监听"。`traceroute` 的默认实现正是靠它判定终点 |
| **ICMPv6（RFC 4443）** | IPv6 版本，并**吸收了 ARP（→NDP）与 IGMP（→MLD）的职责**，重要性远超 ICMPv4 |
| **NDP（RFC 4861）** | 基于 ICMPv6 Type 133–137（RS/RA/NS/NA/Redirect）实现地址解析、路由器发现、DAD |
| **MLD（RFC 2710/3810）** | 基于 ICMPv6 Type 130–132/143，取代 IPv4 的 IGMP |
| **路由协议** | ICMP Redirect 只在同一网段内提示更优下一跳，**不是路由协议**，不传播路由信息，且因安全原因常被关闭 |
| **防火墙 / 安全设备** | ICMP 是双刃剑：可被用于扫描（ping sweep）、Smurf 放大攻击、隐蔽信道（ICMP tunnel），但**粗暴全禁会破坏 PMTUD**，正确做法是按 Type/Code 精细放行 |

## 6. 本目录学习路线

1. **[01-原理与报文](./01-原理与报文.md)** — ICMP 报文通用格式、完整 Type/Code 对照表、差错报文为何携带原始 IP 头+8 字节、ping 与 traceroute 的报文级原理（含 mermaid 时序）、PMTUD、重定向、抑制规则、ICMPv6 差异。
2. **[02-实战与排错](./02-实战与排错.md)** — Wireshark 过滤式、`ping` / `traceroute` / `mtr` / `hping3` / `tcpdump` 实操、"ping 不通""能 ping 不能连""大包不通"等故障排查与 ICMP 安全策略建议。

> **学习建议**：ICMP 的报文格式极简，真正的价值在于**把 Type/Code 与故障现象建立条件反射**。看到 `Type 3 Code 1` 立刻想到"路由器 ARP 不到目标主机"，看到 `Type 3 Code 4` 立刻想到"MTU 问题"，看到 `Type 11 Code 0` 立刻想到"环路或 traceroute"——这套映射是网络排错的核心肌肉记忆。
