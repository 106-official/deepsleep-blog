---
title: "SMB — 服务器消息块协议"
description: "Windows 世界的文件/打印共享标准 / 应用层 / TCP 445(直接) 、139(NetBIOS) / MS-SMB2 规范，SMB1/2/3，CIFS"
layout: "learn"
category: "network-protocols"
layer: "应用层"
weight: 24
rfc: "MS-SMB2（微软开放规范，非 RFC）"
port: "445"
keywords: ["SMB", "CIFS", "服务器消息块", "SMB2", "SMB3", "NetBIOS", "Samba", "445 端口", "EternalBlue", "Oplock"]
ShowToc: true
TocOpen: true
---

## 协议定位

| 项目 | 信息 |
|------|------|
| 所属层 | 应用层（Application Layer） |
| 英文全称 | Server Message Block（服务器消息块）；SMB1 的商业名称为 **CIFS**（Common Internet File System，通用互联网文件系统） |
| 主要规范 | **无 IETF RFC**。由微软以**开放规范**形式发布：**[MS-SMB2]**（SMB 2.x/3.x 协议）、[MS-SMB]（SMB1）、[MS-CIFS]（CIFS 参考）、[MS-SMBD]（SMB Direct/RDMA）。SMB1 曾有 IETF 草案 `draft-heizer-cifs-v1-spec-00`（**已过期，从未成为 RFC**）；NetBIOS over TCP 部分见 **RFC 1001 / RFC 1002** |
| 端口 | **TCP 445** —— **Direct Hosting**（现代方式，SMB 直接跑在 TCP 上）<br>**TCP 139** —— NetBIOS Session Service（旧方式，SMB over NBT）<br>配套：**UDP 137**（NetBIOS 名称服务）、**UDP 138**（NetBIOS 数据报服务） |
| 封装于 | TCP（445 直连）或 NetBIOS over TCP/IP（139）；SMB3 还可跑在 **RDMA（SMB Direct）** 与 **QUIC（SMB over QUIC，Windows Server 2022+）** 上 |
| 典型应用 | Windows 文件共享（`\\server\share`）与打印共享；AD 域的 **SYSVOL/NETLOGON**（组策略分发）；Hyper-V 虚拟机文件存放在 SMB3 共享；`IPC$` 命名管道承载 RPC（远程管理、PsExec）；Linux/NAS 通过 **Samba** 对 Windows 提供共享 |

## 一句话理解

**SMB 是"把 Windows 的文件系统 API 搬到网络上"的协议**——`CreateFile`、`ReadFile`、`WriteFile`、`FindFirstFile` 这些 Win32 调用，几乎一一对应 SMB2 的 `CREATE`、`READ`、`WRITE`、`QUERY_DIRECTORY` 命令。它不只共享文件，还共享打印机、命名管道（`IPC$`）和邮槽，**是 Windows 网络的"总线"**。

## 生活化类比

把 SMB 想象成**公司里的"内部物流 + 门禁 + 收发室"总台**：你（应用）不用关心货（文件）实际在哪个仓库，只要跟总台说"我要打开 3 号柜的蓝色文件夹"，总台就帮你办门禁卡（会话 SessionId）、开柜子（树连接 TreeId）、递出文件标签（FileId）。而且这个总台很"轴"——**只要有人正拿着文件看，别人想抢着改就会被拦下（强制锁 / ShareAccess）**，这点和 NFS 那种"随便看、最后才发现不一致"的松散风格完全不同。

再换个角度：如果说 NFS 是"远程书架代取代存"，SMB 更像**带前台接待的银行柜台**——每次操作你都要先取号认证（SESSION_SETUP）、说明办哪项业务（命令）、柜台内部严格按权限和系统记录办事，还能顺手帮你办打印、查目录、跑后台管理（IPC$ 命名管道）。它不是只管存文件，而是 Windows 这台机器对外服务的"统一前台"。

## 它解决什么问题

**为什么没有它，网络就"缺了一块"**：在没有 SMB 之前，DOS/Windows 机器之间想共享磁盘和打印机几乎没有标准办法。更重要的是，Windows 有一整套和 Unix 不一样的文件语义——文件被打开时别人不能删、有强制锁、有 ACL 权限、不区分大小写——这些"Windows 规矩"必须有一个能完整翻译到网络上的协议来承载，否则应用就得为网络访问大改特改。SMB 补上的正是这块：让 Windows 程序"像访问本地磁盘一样"访问远程文件，同时还顺带把打印、远程管理都一起解决了。

1983 年 IBM 设计 SMB 时的目标是让 DOS 机器共享磁盘和打印机。微软接手后不断扩展，最终 SMB 成了 Windows 网络的基础设施。它要解决的核心问题比 NFS 更复杂：

| 问题 | SMB 的解法 |
|------|-----------|
| 远程访问文件要和本地一样 | 完整映射 Win32 文件语义：共享模式（`FILE_SHARE_READ/WRITE/DELETE`）、属性、备用数据流（ADS）、**不区分大小写但保留大小写** |
| **Windows 的强制文件锁怎么跨网络实现** | 打开文件时携带 `ShareAccess` 与 `DesiredAccess`，服务器做冲突检测。这是与 NFS（咨询锁）最大的语义差异 |
| 网络往返太多导致性能差 | **Oplock / Lease（机会锁/租约）** 让客户端安全地本地缓存读写；SMB2 的 **复合请求（Compounding）** 把多个命令打包进一条 TCP 报文 |
| 认证与授权 | 内置 **NTLM / Kerberos**（通过 **SPNEGO/GSS-API** 协商），权限直接用 **NTFS ACL**，与 AD 域账号天然打通 |
| 不只是文件 | 共享类型除 `DISK` 外还有 `PRINTQ`（打印队列）、**`IPC`（进程间通信，命名管道）**。大量 Windows 远程管理（服务控制、注册表、WMI、DCOM）实际是**跑在 SMB 的 `IPC$` 命名管道之上的 MSRPC** |
| 局域网里怎么找到服务器 | 早期靠 **NetBIOS 名称广播**（UDP 137）+ 浏览器服务；现代靠 **DNS + AD** |

## 核心特征

- 【有状态】**有状态、面向连接**：与 NFSv3 的无状态完全相反。SMB 维护三层会话状态：
  - **Session（会话）**：一次认证对应一个 `SessionId`
  - **Tree Connect（树连接）**：连接到某个共享（`\\server\share`）对应一个 `TreeId`
  - **File（文件句柄）**：打开的文件对应一个 `FileId`（SMB2 是 128 位的 `{Persistent, Volatile}` 二元组）
- 【版本跨度】**版本演进跨度极大**（SMB1 与 SMB2 几乎是两个协议）：

| 版本 | 首发系统 | 关键特性 |
|------|---------|---------|
| **SMB 1.0 / CIFS** | DOS / LAN Manager / Win NT | 命令繁多（100+）、极其啰嗦、无签名默认、**已被微软宣布弃用（deprecated）**，Windows 10/11 默认不安装 |
| **SMB 2.0.2** | Vista / Server 2008 | **推倒重来**：命令精简到 19 个、64 字节固定头、复合请求、**信用（Credit）流控**、大 MTU |
| **SMB 2.1** | Win7 / Server 2008 R2 | **Lease（租约）**取代 Oplock、大 MTU 支持、断线重连（Durable Handle v1） |
| **SMB 3.0** | Win8 / Server 2012 | **端到端加密（AES-128-CCM）**、**多通道（Multichannel）**、**SMB Direct（RDMA）**、透明故障转移、横向扩展文件共享、VSS for SMB |
| **SMB 3.0.2** | Win8.1 / Server 2012 R2 | 可单独禁用 SMB1、性能改进 |
| **SMB 3.1.1** | Win10 / Server 2016 | **预认证完整性（Pre-Authentication Integrity，SHA-512）**防降级攻击、**AES-128-GCM** 加密、加密/签名算法协商（后续版本增加 AES-256-GCM/CCM、AES-128-GMAC 签名） |

- 【流控】**信用机制（Credit）**：SMB2 特有的流控——服务器授予客户端"信用额度"，客户端每发一个请求消耗信用。这让服务器能精确控制并发，是 SMB2 相对 SMB1（固定窗口）的重要改进。
- 【内建安全】**安全内建**：签名（防篡改）+ 加密（防窃听）+ Kerberos/NTLM 认证，**不依赖外部协议**（对比 NFS 需要额外部署 Kerberos）。
- 【历史包袱】**与 NetBIOS 的关系是"历史包袱"**：SMB 最初跑在 NetBIOS 之上（139），Windows 2000 起支持 **Direct Hosting（445）** 直接跑在 TCP 上。**现代环境应彻底禁用 137/138/139**。

## 与其他协议的关系

| 协议 | 关系 |
|------|------|
| **NetBIOS over TCP/IP（RFC 1001/1002）** | SMB 的**旧承载层**。NBT 提供名称服务（UDP 137）、数据报（UDP 138）、会话（TCP 139）。**Windows 2000 起被 445 直连取代**，但为兼容仍保留。NBT-NS 是内网渗透中 **Responder 投毒攻击**的主要入口 |
| **TCP 445** | 现代 SMB 的直接承载。**这个端口暴露公网 = 灾难**（WannaCry、NotPetya 都走它） |
| **Kerberos（88）/ NTLM** | SMB 的认证机制，通过 **SPNEGO**（GSS-API 协商，[MS-SPNG]）在 `SESSION_SETUP` 阶段协商。域环境优先 Kerberos，工作组或 IP 直连时回落 NTLM |
| **LDAP（389）/ DNS（53）** | AD 域中互补：DNS 定位域控、LDAP 查目录、Kerberos 发票据、**SMB 拉取 SYSVOL 里的组策略文件** |
| **MSRPC / DCERPC** | **大量 Windows 远程管理协议跑在 SMB 的 `IPC$` 命名管道上**：`svcctl`（服务控制，PsExec 原理）、`winreg`（远程注册表）、`samr`（SAM 数据库）、`lsarpc`、`atsvc`（计划任务） |
| **NFS** | 竞争协议。SMB 面向 Windows 语义（ACL、不区分大小写、强制锁），NFS 面向 POSIX 语义。详见下方对比与 [NFS 目录](../23-nfs/) |
| **Samba** | Linux/Unix 上的 SMB **开源实现**，既能做服务端（`smbd`）也能做 AD 域控（`samba-ad-dc`）。绝大多数 NAS 用它提供 Windows 共享 |
| **WebDAV（HTTP）** | Windows 的 `\\server\share` 在 445 不通时会**自动回落尝试 WebDAV**（HTTP 80/443），这是一个常被忽视的攻击面 |
| **QUIC** | **SMB over QUIC**（Windows Server 2022+）：把 SMB 跑在 QUIC/UDP 443 上，实现"无 VPN 的安全远程文件访问"，规避 445 端口封锁 |
| **RDMA（InfiniBand/RoCE/iWARP）** | **SMB Direct**（[MS-SMBD]）：SMB3 绕过 TCP 栈直接走 RDMA，用于 Hyper-V 和 SQL Server 的高性能存储场景 |

## 本目录学习路线

1. **[01-原理与报文](01-原理与报文/)** — NetBIOS 与 Direct Hosting 的封装差异、SMB2 的 64 字节头部逐字段解析、19 个命令、Session/Tree/File 三层状态、协商与认证时序、Oplock/Lease 缓存机制、信用流控、签名与加密算法。
2. **[02-实战与排错](02-实战与排错/)** — `smbclient` / `mount.cifs` / `net use` / `Get-SmbConnection` 实操，`smb.conf` 配置，Wireshark 观察协商降级与 NTLM 挑战响应，`STATUS_ACCESS_DENIED` / `STATUS_LOGON_FAILURE` / 版本协商失败 / 性能问题排错，SMB1 与 EternalBlue 的安全加固，以及与 NFS 的详细对比。

> **学习建议**：SMB 的复杂度主要来自**历史包袱**（SMB1 vs SMB2+、NetBIOS vs 445、NTLM vs Kerberos）。建议**只学 SMB2/3**，把 SMB1 当作"必须禁用的历史遗留"来认识。动手时用 `smbclient -L //host -m SMB3` 和 Wireshark 的 `smb2` 过滤式，从 NEGOTIATE → SESSION_SETUP → TREE_CONNECT → CREATE → READ 这条主线走一遍即可掌握。

> **初学者最常踩的坑**：
> 1. **把 SMB 当"只共享文件"的协议，忘了 `IPC$` 才是攻击面**——只要 445 开着且 `IPC$` 可访问，攻击者就能通过 `svcctl`/`samr`/`winreg` 等命名管道做服务控制、枚举用户、读注册表。仅仅关掉文件共享远远不够，445 绝不能出内网边界。
> 2. **权限报错只查一层**——Windows/Samba 是**两层权限取交集**：共享级（TREE_CONNECT 检查）和 NTFS/POSIX 级（CREATE 检查）。`TREE_CONNECT` 就 `ACCESS_DENIED` 是共享级问题，连上了但 `CREATE` 才拒是文件系统权限问题（Samba 上还常是 SELinux 的 `samba_share_t` 上下文没设）。抓包一眼就能分。
> 3. **为连老设备重新启用 SMB1**——Windows 10/11 默认不装 SMB1，连老 NAS 失败很常见，但**千万别为兼容而重开 SMB1**：它是 EternalBlue（MS17-010）等勒索软件的传播通道。正确做法是升级 NAS 固件、把老设备隔离到独立网段。
