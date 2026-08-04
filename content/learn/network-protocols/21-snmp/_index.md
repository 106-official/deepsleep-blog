---
title: "SNMP — 简单网络管理协议"
description: "网络设备监控与管理的事实标准 / 应用层 / UDP 161(Agent)、162(Trap) / RFC 1157(v1)、RFC 3411-3418(v3)"
layout: "learn"
category: "network-protocols"
layer: "应用层"
weight: 21
rfc: "RFC 1157"
port: "161"
keywords: ["SNMP", "简单网络管理协议", "MIB", "OID", "Trap", "SNMPv3", "USM", "网络监控", "snmpwalk"]
ShowToc: true
TocOpen: true
---

## 协议定位

| 项目 | 信息 |
|------|------|
| 所属层 | 应用层（Application Layer） |
| 英文全称 | Simple Network Management Protocol（简单网络管理协议） |
| 主要 RFC | **RFC 1157**（SNMPv1，Historic）；RFC 1901 + RFC 3416/3417（SNMPv2c）；**RFC 3411–3418（STD 62，SNMPv3）**；RFC 2578-2580（SMIv2, STD 58）；RFC 1213（MIB-II, STD 17）；RFC 3826（AES 加密）；RFC 7860（HMAC-SHA-2 认证） |
| 端口 | **UDP 161** — Agent 监听（GET/SET 请求）<br>**UDP 162** — Manager/Trap 接收端监听（Trap / Inform）<br>可选：TCP 161/162（RFC 3430，实验性）；DTLS/TLS 10161/10162（RFC 6353） |
| 封装于 | UDP → IP（默认；无连接、无重传，靠应用层超时重试） |
| 典型应用 | Zabbix / Prometheus snmp_exporter / Nagios / Cacti 采集设备指标；交换机路由器端口流量监控；打印机耗材、UPS 电量、机房温湿度告警；网络拓扑自动发现 |

## 一句话理解

**SNMP 就是给网络设备装了一个"标准化的仪表盘 + 遥控器"**：管理端（Manager）用统一的"变量地址"（OID）去读设备上的任意一个计数器或状态（GET），也能反过来改配置（SET）；设备出事了还能主动"打电话"报警（Trap）。

## 💡 生活化类比

把机房里成百上千台设备想象成一栋大楼里的所有电表、水表、烟感器。以前每家厂商的表盘刻度、读法都不一样，抄表员得学几十套规矩；SNMP 做的事，就是给所有表统一贴上编号（OID），规定"读第 3 号表的读数"这句话在任何品牌的表上说法都一模一样。

于是抄表员（Manager）只要拿一本编号手册，挨家挨户念编号就能抄完全楼；而烟感器一旦冒烟，它还会自己按响门铃通知物业——那就是 Trap。

## 它解决什么问题

为什么没有它，网络就"缺了一块"：

在 SNMP 出现前（1988 年之前），网管面对的是：思科交换机用 CLI、华为设备用另一套 CLI、打印机用私有协议、UPS 用串口——**每种设备一套管理方式，无法统一采集**。

SNMP 用三个关键抽象一次性解决了这个问题：

1. **统一的数据模型（MIB/SMI）**：把"设备上所有可管理的东西"抽象成一棵全球唯一的树，每个叶子是一个可读/可写的变量。第 3 端口的入方向字节数，在任何厂商的设备上都叫 `1.3.6.1.2.1.2.2.1.10.3`。
2. **极简的操作集**：只有 get / getnext / getbulk / set / trap / inform 六种操作。设备端实现代价极低——一台几十元的家用路由器都能跑 SNMP Agent。
3. **UDP 无连接**：不占用设备的 TCP 连接资源，网络拥塞时管理报文也能挤出去；轮询上千台设备时开销可控。

**代价**：UDP 不可靠（丢包即丢数据点）、v1/v2c 明文传输 community 字符串（等同明文密码）、大表遍历慢。这三点正是后面 SNMPv3、gNMI/NETCONF/Telemetry 要解决的。

## 核心特征

- **【两端架构】Manager / Agent 模型**：Agent 常驻被管设备（网络设备、服务器、打印机），维护本地 MIB；Manager（NMS，网管系统）主动轮询或被动接收告警。
- **【数据字典】MIB（Management Information Base，管理信息库）**：Agent 上所有可管理对象的集合，用 **SMI**（Structure of Management Information，管理信息结构，ASN.1 子集）语法定义。MIB 文件本身只是"数据字典"，真正的数据在设备内存里。
- **【变量地址】OID（Object Identifier，对象标识符）**：一串点分数字，唯一定位 MIB 树上的一个节点。标量对象访问时要加 `.0` 后缀（如 `sysDescr.0`）；表格对象用索引后缀（如 `ifDescr.3` 表示第 3 号接口）。
- **【安全演进】三个版本的安全演进**：
  - **v1 / v2c**：Community String（团体字符串）作为唯一凭据，**明文传输**，抓包即得。`public` 只读、`private` 读写是臭名昭著的默认值。
  - **v3**：引入 **USM**（User-based Security Model，基于用户的安全模型，RFC 3414）提供认证与加密，**VACM**（View-based Access Control Model，基于视图的访问控制模型，RFC 3415）提供细粒度授权。
- **【二进制编码】五种编码在 UDP 之上**：报文用 **BER**（Basic Encoding Rules，基本编码规则）序列化 ASN.1 结构，因此抓包看到的是 TLV（Tag-Length-Value）二进制流，需要解码器。
- **【拉主推辅】拉（Polling）为主、推（Trap）为辅**：绝大多数指标靠 Manager 定期 GET；只有异常事件才由 Agent 主动推 Trap。

## 与其他协议的关系

| 协议 | 关系 |
|------|------|
| **UDP** | SNMP 的承载协议。UDP 不可靠导致 SNMP 必须自己做超时重传，也导致 Trap 可能永久丢失（Inform 就是为解决这个而生的带确认的 Trap） |
| **ASN.1 / BER** | SNMP 报文的语法与编码规则，与 LDAP、X.509 证书、SSL 握手共用同一套编码体系 |
| **ICMP** | 互补：ICMP（ping）只能判断"设备活着吗"，SNMP 能回答"设备第 3 口现在跑了多少流量、CPU 多少" |
| **Syslog（UDP 514）** | 互补：Syslog 推送**文本日志**，SNMP Trap 推送**结构化事件**（带 OID 和变量绑定）。生产环境通常两者并用 |
| **NetFlow / sFlow / IPFIX** | 互补：SNMP 给的是**接口级聚合计数**（这个口跑了多少字节），NetFlow 给的是**流级明细**（谁跟谁在通信）。排查"带宽被谁占了"必须用 NetFlow |
| **NETCONF（RFC 6241）/ RESTCONF / gNMI** | 替代者：SNMP 在**配置下发（SET）**上极其笨拙且事务性差，现代设备的配置管理已转向 NETCONF/YANG；流式遥测（Streaming Telemetry, gNMI）也在替代 SNMP 轮询。但 SNMP 在**存量设备监控**领域仍不可替代 |
| **SSH / TLS** | SNMPv3 之外的传输安全方案：RFC 5592（SSH Transport Model）、RFC 6353（TLS/DTLS Transport Model），实际部署较少 |

## 本目录学习路线

1. **[01-原理与报文](01-原理与报文/)** — 先搞清 MIB 树与 OID 寻址、SNMP 报文的三段式结构（version / community / PDU）、六种 PDU 的字段差异、getnext 如何实现"遍历"、v3 的 USM 认证加密流程。
2. **[02-实战与排错](02-实战与排错/)** — 用 `snmpwalk` / `snmpget` / `snmptrap` 动手采集，Wireshark 观察明文 community 的风险，处理"超时无响应""OID 不存在""Trap 收不到"等典型故障，以及与 NETCONF、NetFlow 的选型对比。

> **学习建议**：SNMP 的难点不在协议报文（结构很简单），而在 **MIB 树的心智模型**。务必先用 `snmpwalk` 把一台真实设备（或本机 `net-snmp`）的 `1.3.6.1.2.1.2.2`（接口表）走一遍，看到"表格是如何用 OID 后缀展开成行"，后面一切就通了。
>
> ⚠️ 初学者最常踩的坑：① 读标量对象忘了加 `.0` 后缀（`sysName` ✗ / `sysName.0` ✓），结果一直提示对象不存在；② 以为 `Timeout: No Response` 就是网络不通，其实**绝大多数 Agent 对错误的 community 是静默丢弃、不回错误的**，表现和网络不通一模一样；③ 千兆以上接口还在用 32 位的 `ifInOctets`，Counter32 在 1 Gbps 满速下约 34 秒就回绕一次，流量图必然失真。
