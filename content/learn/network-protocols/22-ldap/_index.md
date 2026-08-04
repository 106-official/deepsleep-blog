---
title: "LDAP — 轻量目录访问协议"
description: "企业统一身份与组织架构的查询协议 / 应用层 / TCP 389(明文/StartTLS)、636(LDAPS) / RFC 4511（LDAPv3）"
layout: "learn"
category: "network-protocols"
layer: "应用层"
weight: 22
rfc: "RFC 4511"
port: "389"
keywords: ["LDAP", "轻量目录访问协议", "目录服务", "DN", "RDN", "Active Directory", "OpenLDAP", "Bind", "过滤器", "LDAPS"]
ShowToc: true
TocOpen: true
---

## 协议定位

| 项目 | 信息 |
|------|------|
| 所属层 | 应用层（Application Layer） |
| 英文全称 | Lightweight Directory Access Protocol（轻量目录访问协议） |
| 主要 RFC | **RFC 4511**（LDAPv3 协议本体）；RFC 4510（技术规范路线图）；RFC 4512（目录信息模型）；RFC 4513（认证方法与安全机制）；RFC 4514（DN 字符串表示）；**RFC 4515**（搜索过滤器字符串表示）；RFC 4516（LDAP URL）；RFC 4517-4519（语法/Schema）；RFC 2849（LDIF 格式） |
| 端口 | **TCP 389** — 明文 LDAP，也是 **StartTLS** 升级用的端口<br>**TCP 636** — LDAPS（隐式 TLS，事实标准，**未被 RFC 正式标准化**）<br>AD 全局编录：TCP **3268**（明文）/ **3269**（SSL） |
| 封装于 | TCP（面向连接，一条连接上可并发多个操作，靠 messageID 区分） |
| 典型应用 | 企业统一登录（SSO 后端）；Active Directory 域用户/组查询；OpenLDAP 账号中心；邮件系统的全局地址簿（GAL）；Linux 主机 `sssd`/`nslcd` 统一认证；GitLab / Jenkins / Jira / VPN 对接企业账号 |

## 一句话理解

**LDAP 是"为『读多写少的树形数据』量身定做的查询协议"**——它把企业的组织架构、账号、组、设备、打印机组织成一棵可继承、可委派的树，然后提供一套极高效的"按条件搜子树"的操作。它不是数据库，是**目录**。

## 生活化类比

LDAP 就像一本全公司共用的**电子通讯录 + 门禁名册**。通讯录本身是按"公司 → 部门 → 小组 → 人"一层层排的，你查一个人，可以从整个公司范围找，也可以只在某个部门里找。

更妙的是，它还兼职看门人：你报上名字和暗号，它帮你核对一下对不对——对了就放行。于是邮箱、VPN、代码仓库这些系统都不用自己再养一本名册，统一来问这一本就行了。

## 它解决什么问题

为什么没有它，网络就"缺了一块"：

企业里有一类数据具有非常鲜明的共同特征：

- **天然树形/层级**（公司 → 部门 → 小组 → 人）；
- **读操作占 99%**（登录验证、查通讯录、查权限），写操作稀少；
- **属性稀疏且多值**（一个人可以有 3 个邮箱、属于 5 个组，但大部分属性为空）；
- **需要被无数个系统共享**（邮件、VPN、OA、代码仓库都要认同一套账号）。

用关系数据库存这种数据会很别扭：树形要么用递归查询、要么用邻接表；稀疏多值属性要么疯狂加列、要么退化成 EAV 大宽表；而且每个应用都自己建一套用户表，导致**账号数据在 N 个系统里各存一份、离职了删不干净**。

LDAP 的解法：

1. **统一的层级命名空间**：每个条目有全局唯一的 **DN**（Distinguished Name），像文件路径一样定位。
2. **面向读优化**：目录服务器内部用倒排索引，`(&(objectClass=person)(department=研发部))` 这类查询能在几十万条目中毫秒返回。
3. **Schema 强约束**：objectClass 定义了"这类条目必须有哪些属性、可以有哪些属性"，保证跨系统数据一致。
4. **一次认证，处处可用**：应用不再自己存密码，而是把用户名密码拿去 LDAP 做 **Bind**，Bind 成功即认证通过。

> **名字里的"Lightweight"**：LDAP 是 X.500 目录服务（DAP，基于 OSI 全栈协议）的**轻量化版本**——它跑在 TCP/IP 上、只保留了 DAP 的常用操作、用简化的 BER 编码。这个"轻"是相对 1980 年代那套重量级 OSI 协议而言的。

## 核心特征

- **【树形骨架】DIT（Directory Information Tree，目录信息树）**：所有条目组成一棵树，根叫 **Base DN / Naming Context**（如 `dc=example,dc=com`）。
- **【一条记录】Entry（条目）**：树上的一个节点，等于"一条记录"。由若干 **属性（Attribute）** 组成，每个属性可以有**多个值**。
- **【唯一地址】DN / RDN**：
  - **RDN**（Relative Distinguished Name，相对可辨识名）：条目在**父节点下**的唯一名字，如 `cn=张三`。
  - **DN**（Distinguished Name，可辨识名）：从条目一路拼到根的完整路径，**全局唯一**，如 `cn=张三,ou=研发部,ou=用户,dc=example,dc=com`。**注意顺序是从叶到根，与文件路径相反**。
- **【条目类型】objectClass**：条目的"类型"，决定必需属性（MUST）与可选属性（MAY）。可多重继承，如 `top` → `person` → `organizationalPerson` → `inetOrgPerson`。
- **【操作集合】十种协议操作**：Bind / Unbind / Search / Modify / Add / Delete / ModifyDN / Compare / Abandon / Extended。**没有独立的 "Read" 操作，读单个条目也是用 Search（scope=base）**。
- **【查询语法】强大的过滤器语法**（RFC 4515）：前缀（波兰）表示法，`(&(objectClass=user)(|(dept=A)(dept=B))(!(disabled=TRUE)))`。
- **【读写失衡】读写严重不对称**：为读优化，写入（尤其是多主复制）代价高。**不要把 LDAP 当业务数据库用**。
- **【二进制编码】BER 编码的 ASN.1**：与 SNMP、X.509 同源，抓包是二进制 TLV。

## 与其他协议的关系

| 协议 / 技术 | 关系 |
|-------------|------|
| **X.500 / DAP** | LDAP 的前身。LDAP 继承了 X.500 的数据模型（DIT、DN、Schema），但抛弃了 OSI 协议栈，改跑 TCP/IP |
| **TLS** | 两种加密方式：**LDAPS**（636 端口，连接即握手，隐式 TLS，事实标准）与 **StartTLS**（389 端口，先明文连接再用扩展操作 OID `1.3.6.1.4.1.1466.20037` 升级，**RFC 推荐方式**） |
| **Kerberos** | 互补而非替代。AD 域中：**Kerberos 负责认证**（拿票据），**LDAP 负责授权与目录查询**（查组、查属性）。LDAP 的 SASL/GSSAPI 机制正是用 Kerberos 做 Bind |
| **SASL**（RFC 4422） | LDAP Bind 的可插拔认证框架，支持 GSSAPI（Kerberos）、DIGEST-MD5、EXTERNAL（客户端证书）等。**Simple Bind 是明文，SASL 才是安全方式** |
| **Active Directory** | 微软的目录服务实现，**LDAP 是 AD 的主要访问协议之一**。但 AD ≠ LDAP：AD 还包含 Kerberos（88）、DNS（53，用 SRV 记录定位 DC）、SMB（445，SYSVOL 组策略分发）、全局编录（3268） |
| **RADIUS / TACACS+** | 上层认证协议，后端常常就是查 LDAP。网络设备登录 → RADIUS → LDAP |
| **SAML / OAuth2 / OIDC** | 现代 Web SSO 协议。IdP（如 Keycloak、Okta、AD FS）**对内用 LDAP 读用户库，对外出 SAML/OIDC 令牌** |
| **SCIM**（RFC 7643/7644） | 云时代的用户同步协议（REST/JSON）。定位与 LDAP 重叠，但面向"跨组织的账号同步"，LDAP 面向"组织内的目录查询" |
| **DNS** | AD 客户端通过 DNS SRV 记录（`_ldap._tcp.dc._msdcs.example.com`）自动发现域控 |

## 本目录学习路线

1. **[01-原理与报文](01-原理与报文/)** — 目录信息树与 DN/RDN 命名、Schema 与 objectClass、LDAPMessage 报文结构、十种操作的字段、SearchRequest 的 scope 与过滤器语法、Bind 认证流程与 StartTLS 升级。
2. **[02-实战与排错](02-实战与排错/)** — `ldapsearch` / `ldapadd` / `ldapmodify` / `ldappasswd` 实操，LDIF 文件编写，Wireshark 观察明文 Simple Bind 的风险，`invalidCredentials` / `noSuchObject` / `sizeLimitExceeded` / referral 等错误码排查，与 AD 对接的坑，以及与 SQL、Kerberos 的对比。

> **学习建议**：LDAP 的最大门槛是**"树 + 过滤器"的心智模型**。建议用 Docker 起一个 OpenLDAP（`docker run -p 389:389 osixia/openldap`），亲手 `ldapadd` 几个条目，再用不同 scope（base / one / sub）搜同一个 Base DN，立刻就能看懂 scope 的差别。搞懂后再看 AD，会发现只是 objectClass 名字换成了 `user` / `group` 而已。
>
> 初学者最常踩的坑：① Bind 时填用户名而不是**完整 DN**（要写 `cn=admin,dc=example,dc=com`，不是 `admin`），结果一直报 `invalidCredentials(49)`；② scope 默认用了 `base` 或 `one`，搜不到深层条目还以为数据不存在——应用集成一律该用 `sub`；③ 忘了 **Simple Bind 传的是明文密码**，不加 StartTLS/LDAPS 就等于把口令裸奔在网上；④ AD 单次最多返回 **1000** 条，超了会返回**不完整**结果，必须用分页控制。
