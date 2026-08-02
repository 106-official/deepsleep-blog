---
title: "MQTT — 消息队列遥测传输"
description: "物联网事实标准发布/订阅协议 / 应用层（物联网） / TCP 1883(明文)、8883(SSL/TLS) / OASIS MQTT v3.1.1、v5.0"
layout: "learn"
category: "network-protocols"
layer: "应用层"
weight: 25
rfc: "OASIS MQTT v3.1.1 / v5.0"
port: "1883"
keywords: ["MQTT", "消息队列遥测传输", "发布订阅", "Broker", "Topic", "QoS", "保留消息", "遗嘱消息", "物联网", "mosquitto"]
ShowToc: true
TocOpen: true
---

## 协议定位

| 项目 | 信息 |
|------|------|
| 所属层 | 应用层（Application Layer），构建于 TCP 之上；也有 UDP 变体 MQTT-SN（MQTT for Sensor Networks，规范 ISO/IEC 20922） |
| 英文全称 | Message Queuing Telemetry Transport（消息队列遥测传输） |
| 标准组织 | **OASIS**（结构化信息标准促进组织）；前身由 IBM 与 Cirrus Link（Arcom）于 1999 年设计，2013 年提交 OASIS |
| 主要规范 | **MQTT v3.1.1**（OASIS 标准，2014-10，ISO/IEC 20922）<br>**MQTT v5.0**（OASIS 标准，2019-03，引入大量新特性：原因码、用户属性、共享订阅、消息过期、载荷格式指示等）<br>注：MQTT 没有 IETF RFC 编号，规范文档即 OASIS 标准文本 |
| 端口 | **TCP 1883** — 明文 MQTT（Broker 监听）<br>**TCP 8883** — MQTT over SSL/TLS（MQTTs，即 MQTT + TLS）<br>WebSocket 上承载：TCP 80/443（路径如 `/mqtt`，便于穿透 Web 防火墙） |
| 封装于 | TCP → IP（可靠字节流；MQTT 自身不重传，依赖 TCP 保证投递） |
| 典型应用 | 车联网/充电桩遥测上报；智能家居设备状态同步；工业 PLC/传感器数据采集（IIoT）；移动 App 推送（低功耗长连接）；遥感、气象、农业物联网；MQTT 桥接打通边缘与云（EMQX/Mosquitto 桥接） |

## 一句话理解

**MQTT 是一个"报社 + 邮局"模型**：设备不直接互相通信，而是把消息**发布（Publish）**到 Broker（代理服务器）上的某个**主题（Topic）**；任何**订阅（Subscribe）**了该主题的设备，都会自动收到 Broker 转发来的消息——发布者与订阅者彼此**解耦**（不知道对方存在、不需要同时在线）。

## 它解决什么问题

- **设备多、网络差、电量少**：HTTP 这类"一问一答 + 重头部"的协议在百万级传感器、弱网、2G/NB-IoT 下太重。MQTT 头部最小仅 **2 字节**，采用长连接 + 心跳，极大节省带宽与电量。
- **多对多通信的拓扑爆炸**：若设备两两直连，连接数为 O(n²)。引入 Broker 后，每个设备只需一条到 Broker 的连接，拓扑变为星型，连接数降为 O(n)。
- **异步与离线投递**：发布者发完即可离线；订阅者上线后通过**保留消息（Retained）**拿到最新状态，通过**持久会话**拿到离线期间的消息。
- **一对多 / 多对一广播**：一个传感器读数可同时被大屏、告警引擎、数据库写入等多个消费者订阅（发布/订阅的天然 fan-out）。

## 核心特征

- **发布/订阅（Publish/Subscribe）解耦**：空间解耦（双方不知对方地址）、时间解耦（不需同时在线）、同步解耦（非阻塞）。
- **主题（Topic）层级命名**：以 `/` 分隔的字符串树（如 `factory/line1/temp`），支持通配符 `+`（单层）与 `#`（多层）。
- **QoS 三级投递保证**：
  - **QoS 0 — 至多一次（At most once）**：fire-and-forget，不确认、不重传，可能丢。
  - **QoS 1 — 至少一次（At least once）**：PUBACK 确认，可能重复。
  - **QoS 2 — 恰好一次（Exactly once）**：四次握手（PUBREC/PUBREL/PUBCOMP），不丢不重，开销最大。
- **保留消息（Retained Message）**：Broker 为某个 Topic 保存最后一条 retained 消息，新订阅者立刻拿到"当前值"。
- **遗嘱消息（Last Will and Testament, LWT）**：连接在 CONNECT 时声明遗嘱，客户端异常断线时 Broker 自动代发，告知其它订阅者"我挂了"。
- **Clean Session / 会话（MQTT 5 改为 Clean Start + Session Expiry）**：控制订阅关系与离线消息是否随断线清除。
- **Keep Alive 心跳**：客户端声明保活间隔，靠 PINGREQ/PINGRESP 维持长连接、探测假死。
- **轻量头部 + 可变长编码**：固定头仅 1 字节控制位 + 1~4 字节剩余长度，适合受限设备。

## 与其他协议的关系

| 关系类型 | 协议 / 技术 | 说明 |
|----------|-------------|------|
| **同领域对比** | **CoAP** | 同样面向 IoT，但基于 UDP + REST 风格（请求/响应），适合无 TCP 的极受限节点；MQTT 用 TCP 长连接，更适合需要可靠投递与广播的场景 |
| **同领域对比** | **AMQP** | 企业级消息队列协议（RabbitMQ 等），功能更重（事务、路由交换、多协议），头部与实现复杂度高于 MQTT；MQTT 更轻、更适合海量终端 |
| **互补** | **HTTP / HTTPS** | MQTT 负责设备↔云实时遥测；HTTP 常用于设备固件 OTA 下载、REST 配置接口，二者常并存 |
| **承载** | **TCP / TLS / WebSocket** | MQTT 依赖 TCP 提供可靠流；8883 是 TCP+TLS；WebSocket 让 MQTT 能走 80/443 穿透 Web 代理 |
| **变体** | **MQTT-SN** | 面向非 IP 的传感器网络（ZigBee、BLE），基于 UDP，Topic 用数字 ID 缩短 |
| **后端** | **Kafka / 数据库** | Broker（EMQX 等）常通过规则引擎把 MQTT 消息桥接/转发到 Kafka、InfluxDB、时序库做持久化与分析 |

## 本目录学习路线

建议按以下顺序阅读本目录中的三份文档：

1. 本页 **`_index.md`（协议概览）** — 建立发布/订阅、Broker、Topic、QoS 的整体心智模型。
2. **`01-原理与报文.md`（原理与报文结构）** — 深入 CONNECT/PUBLISH/SUBSCRIBE 等报文格式、QoS 握手流程、主题通配符、保留/遗嘱机制，配合 mermaid 时序图与思维导图。
3. **`02-实战与排错.md`（实战、抓包与排错）** — Wireshark 抓包过滤式、`mosquitto_pub/sub` 实操、Broker 配置、常见故障与排错、与 CoAP/AMQP 对比、速查表与面试题。

> 下一步：[01-原理与报文.md](01-原理与报文/) → [02-实战与排错.md](02-实战与排错/)
