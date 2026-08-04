---
title: "NFS — 网络文件系统"
description: "类 Unix 世界的远程文件共享标准 / 应用层 / TCP 2049 / RFC 7530（NFSv4.0）、RFC 1813（v3）、RFC 8881（v4.1）"
layout: "learn"
category: "network-protocols"
layer: "应用层"
weight: 23
rfc: "RFC 7530"
port: "2049"
keywords: ["NFS", "网络文件系统", "ONC RPC", "XDR", "文件句柄", "NFSv3", "NFSv4", "mount", "showmount", "exports"]
ShowToc: true
TocOpen: true
---

## 协议定位

| 项目 | 信息 |
|------|------|
| 所属层 | 应用层（Application Layer，构建于 ONC RPC 之上） |
| 英文全称 | Network File System（网络文件系统） |
| 主要 RFC | **RFC 7530**（NFSv4.0，取代 RFC 3530）；**RFC 1813**（NFSv3）；RFC 1094（NFSv2，历史）；**RFC 8881**（NFSv4.1 + pNFS，取代 RFC 5661）；RFC 7862（NFSv4.2）；RFC 5531（ONC RPC v2）；RFC 4506（XDR）；RFC 2203（RPCSEC_GSS） |
| 端口 | **TCP 2049** —— NFS 主端口（v4 **只需要这一个**）<br>v3 还需要：**111**（rpcbind/portmapper，TCP+UDP）、mountd、statd（NLM）、lockd、rquotad —— 这些默认**动态分配端口**，是防火墙噩梦 |
| 封装于 | ONC RPC（Open Network Computing Remote Procedure Call）→ TCP（现代默认）或 UDP（v2/v3 可选，v4 **强制 TCP**） |
| 典型应用 | Linux/Unix 服务器间共享目录；Kubernetes 的 NFS PersistentVolume；虚拟化平台（VMware NFS Datastore）；HPC 集群共享 home 与数据集；容器镜像/日志集中存储；NAS 设备对 Linux 客户端的服务 |

## 一句话理解

**NFS 让远程目录"长"在本地文件系统树上**——挂载之后，`/mnt/data/report.txt` 用起来和本地文件毫无区别，`cat`、`vim`、`cp` 都照常工作。**应用程序完全不知道自己在访问网络**，这一切由内核 VFS 层把文件系统调用翻译成 RPC 请求完成。

## 💡 生活化类比

把 NFS 想象成**给办公室装了一套"远程书架"**：你座位上摆了一个标着 `/mnt/data` 的"虚拟书架"，看起来和普通书架没两样，书（文件）却实际存放在楼下的中央书库（服务器）。你伸手拿书、放回书，动作和本地一模一样，只是背后有人（内核 VFS）默默跑腿去书库取送。

再换个角度：它像**外卖柜的"代取代存"服务**——你不用自己跑腿搬整个冰箱（像 FTP 整文件拷贝），而是想吃哪瓶饮料就让人递哪瓶（一次 `READ(offset, count)`），吃完了再让人把空瓶送回去（一次 `WRITE`）。目录在哪、书叫什么名字，由书库用一串"取件码"（文件句柄）帮你记着。

## 它解决什么问题

**为什么没有它，网络就"缺了一块"**：在 NFS 之前，多台机器之间"共享一份文件"这件事几乎没有优雅解法。文件要么锁死在某台机器的磁盘里，要么靠 FTP 来回拷——拷来拷去就出现了 N 个版本、改了不同步、每台机器都重复占一份磁盘。NFS 补上的正是这一块：让"远程文件"对程序而言**和本地文件没有区别**，共享从此变成基础设施而不是麻烦。

1980 年代，Sun Microsystems 面对的问题是：一个实验室里几十台工作站，每台都有自己的磁盘，用户在 A 机器上的文件在 B 机器上看不到。当时的解法是 FTP 来回拷贝——**文件有 N 个版本、改了不同步、磁盘各自浪费**。

NFS（1984 年，Sun）用一个关键思路解决了它：**不发明新的文件访问方式，而是把已有的 Unix 文件系统调用透明地转发到网络上**。

| 问题 | NFS 的解法 |
|------|-----------|
| 应用要改代码才能访问远程文件 | **VFS 层拦截**：应用照常调 `open()`/`read()`/`write()`，内核判断这是 NFS 挂载点后转成 RPC |
| 不同机器的字节序/数据表示不同 | **XDR**（External Data Representation，外部数据表示，RFC 4506）统一编码，大端序 + 4 字节对齐 |
| 网络调用怎么写才像本地函数 | **ONC RPC**（RFC 5531）：定义程序号/版本号/过程号三元组，客户端像调本地函数一样发请求 |
| 服务器崩溃重启后客户端怎么办 | **v2/v3 无状态设计**：服务器不记住任何客户端信息，每个请求自带全部上下文（文件句柄 + 偏移量），重启后客户端重试即可恢复 |
| 磁盘空间浪费在每台机器 | 集中存储，统一备份、统一扩容 |

## 核心特征

- 【分层承载】**构建于 ONC RPC + XDR 之上**：NFS 本身只定义"有哪些远程过程"（LOOKUP、READ、WRITE…），传输、编码、认证都交给下层 RPC 框架。这也是为什么抓包里看到的是 `RPC` 和 `NFS` 两层。
- 【远程 inode】**文件句柄（File Handle）是核心**：客户端不能用路径名直接访问文件，必须先 `LOOKUP` 拿到一个**不透明的二进制句柄**（v3 最长 64 字节，v4 最长 128 字节），后续所有 READ/WRITE 都用句柄寻址。句柄内部通常编码了文件系统 ID + inode 号 + generation 号。
- 【状态演进】**v3 无状态 vs v4 有状态**——这是理解 NFS 演进的主线：
  - **v3（无状态）**：服务器不保存打开的文件、不保存锁。**优点**是服务器重启后客户端自动恢复（表现为暂时 hang 住然后继续）；**缺点**是文件锁必须靠**外挂的 NLM/statd 协议**，且**没有缓存一致性保证**。
  - **v4（有状态）**：引入 open/close 状态、**租约（Lease）**、**委托（Delegation）**，锁被整合进主协议，缓存一致性大幅改善，且**只用一个端口**。
- 【复合操作】**v4 的 COMPOUND 复合操作**：把多个操作（PUTFH + LOOKUP + GETATTR + READ）打包进一次 RPC 往返，**极大减少了广域网下的 RTT 开销**——这是 v4 相对 v3 最重要的性能改进。
- 【认证弱点】**默认认证极弱（AUTH_SYS）**：客户端**自称** UID/GID，服务器直接信任。任何人在自己的机器上 `sudo useradd -u 1001` 就能冒充服务器上 UID 1001 的用户。安全环境必须用 **Kerberos（RPCSEC_GSS，`sec=krb5/krb5i/krb5p`）**。
- 【伪根】**v4 的伪文件系统（Pseudo Filesystem）**：把服务器上多个导出目录挂在一棵虚拟根（`/`）下，客户端挂 `server:/` 就能看到所有导出，不再需要 MOUNT 协议。

## 与其他协议的关系

| 协议 | 关系 |
|------|------|
| **ONC RPC（RFC 5531）** | NFS 的**承载框架**。同族的还有 NIS/YP、rquotad、NLM。抓包时 NFS 报文外面必然套一层 RPC 头 |
| **XDR（RFC 4506）** | RPC 的**数据编码规则**。大端序、所有字段 4 字节对齐、变长数据前置长度 |
| **rpcbind / portmapper（111）** | v3 的**服务发现**：客户端先问 111 端口"mountd 在哪个端口"，再去连。**v4 彻底废弃了它** |
| **MOUNT 协议（RFC 1813 附录）** | v3 独立的挂载协议，负责把路径名换成根文件句柄。`showmount -e` 查的就是它。**v4 用 PUTROOTFH + LOOKUP 取代** |
| **NLM（Network Lock Manager）/ NSM（statd）** | v3 的**外挂锁协议**，因为 v3 无状态自己管不了锁。NSM 负责崩溃后通知对端重新申请锁。**v4 已整合进主协议** |
| **TCP / UDP** | v2/v3 可选 UDP（低延迟局域网）；**v4 强制 TCP**。现代部署一律 TCP（UDP 在丢包时重传整个 RPC，大 I/O 下表现极差） |
| **Kerberos（RFC 4120）+ RPCSEC_GSS（RFC 2203）** | NFS 的强认证方案。`sec=krb5`（认证）/ `krb5i`（+完整性）/ `krb5p`（+加密） |
| **LDAP / NIS** | 提供**统一的 UID/GID 映射**。NFS 传的是数字 UID，两端 UID 不一致就会出现"文件属主显示成陌生数字"的经典问题 |
| **SMB/CIFS** | 竞争协议。**NFS 面向 Unix 语义**（POSIX 权限、硬链接、区分大小写），**SMB 面向 Windows 语义**（ACL、不区分大小写、文件锁强制性）。详见 [SMB 目录](../24-smb/)对比 |
| **pNFS（Parallel NFS，v4.1）** | NFS 的横向扩展方案：元数据走 MDS，数据直连多个存储节点并行读写 |
| **iSCSI / FC** | 层次不同：NFS 是**文件级**共享（服务器管理文件系统），iSCSI 是**块级**共享（客户端自己格式化） |

## 本目录学习路线

1. **[01-原理与报文](01-原理与报文/)** — ONC RPC/XDR 分层、文件句柄机制、v3 的 22 个过程、v4 的 COMPOUND 与状态模型、挂载流程时序图、租约与委托、WRITE 的三种稳定性语义与 COMMIT。
2. **[02-实战与排错](02-实战与排错/)** — `mount` / `showmount` / `rpcinfo` / `exportfs` / `nfsstat` 实操，`/etc/exports` 完整选项详解，Wireshark 观察 RPC+NFS 两层结构，`Permission denied` / `Stale file handle` / 进程 D 状态 hang 死 / UID 错乱 / 性能调优等排错，以及与 SMB 的详细对比。

> **学习建议**：NFS 的坑几乎全部集中在**三件事**上——① `no_root_squash` / UID 映射导致的权限问题；② `hard` vs `soft` 挂载导致的进程 hang 死；③ v3 的动态端口穿不过防火墙。建议直接从 **NFSv4** 学起（单端口、无 rpcbind、有状态），把 v3 当作"需要兼容的历史包袱"来理解。

> **⚠️ 初学者最常踩的坑**：
> 1. **`/etc/exports` 里客户端与 `(选项)` 之间多了一个空格**——`/export 192.168.1.0/24 (rw)` 里那个空格会让选项对**所有人**生效、对该网段反而退回默认（`ro` + `root_squash`），是经典的安全事故和"配了却不生效"的根源。要写成 `192.168.1.0/24(rw)` 紧贴括号。
> 2. **把 `hard` 挂载误当成 bug**——服务器一挂，访问挂载点的进程全部进入 D 状态、`kill -9` 都杀不掉、`df`/`ls` 也 hang 死。这不是死机，是 `hard` 在"无限重试保数据"。**千万别为了"解 hang"而改 `soft`**，那会换来更隐蔽的静默数据损坏。正确做法是上 autofs / `x-systemd.automount` + 监控。
> 3. **UID 不一致却以为是 NFS 坏了**——NFSv3 传的是**数字 UID**，客户端和服务端的 `zhangsan` 数字 UID 不一样，文件属主就会显示成陌生数字、权限全乱。这是"地图（UID 映射）没对齐"，不是协议问题，根治靠 LDAP/NIS 或 NFSv4 的 `idmapd`。
