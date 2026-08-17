# DeepSleep 项目文档中心

n8n 工作区所有项目/子项目文档的统一归档(2026-08-14 起整合)。

> 之前文档散落在 `blog-static/`、`waline-deepsleep/`、`docs/superpowers/` 等处,现全部集中到此目录;各项目目录内不再保留文档。

## 目录结构

```
docs/
├── README.md                        # 本索引
├── blog/                            # DeepSleep Blog 博客项目
│   ├── README.md                    # 博客快速上手 (v5.17)
│   ├── PROJECT_CONTEXT.md           # 项目上下文 / 快速上手指南
│   ├── PROJECT_DOCUMENTATION.md     # 完整技术文档 (2300+ 行)
│   └── sections/                    # 板块文档
│       ├── CardArena-项目文档.md
│       ├── CPA-教材蒸馏-项目文档.md
│       ├── SleepTown-项目文档.md
│       ├── SleepTown-动效参考集.md
│       ├── SleepTown-动效demo.html
│       ├── learn-section.md
│       └── cpa-source/              # CPA 处理脚本与数据
├── community/                       # 社区系统
│   ├── README.md                    # 当前版 (腾讯云 SCF)
│   └── vercel-legacy.md             # 废弃版 (Vercel,备用)
├── scf-lixin-ask/
│   └── README.md                    # 立信 LLM 问答接口 (SCF)
├── remote-control/
│   └── README.md                    # 远程接管 MCP 服务器
├── waline/
│   └── README.md                    # 评论系统 (waline-deepsleep)
└── superpowers/                     # 设计文档 (原样保留)
    ├── plans/                       # 实现计划
    └── specs/                       # 设计规格
```

## 项目速览

| 项目 | 目录 | 部署 | 文档 |
|------|------|------|------|
| DeepSleep Blog | `blog-static/` | GitHub Pages | `blog/` |
| 评论系统 | `waline-deepsleep/` | Vercel | `waline/` |
| 社区论坛 | `scf-community-deepsleep/` | 腾讯云 SCF | `community/` |
| 立信 LLM API | `scf-lixin-ask/` | 腾讯云 SCF | `scf-lixin-ask/` |
| 远程控制 MCP | `remote-control/` | 本机 | `remote-control/` |

> 已删除:`dify/`(2026-08-14,不再使用)。

## 新文档约定

- 新项目文档一律放入 `docs/<项目名>/README.md`
- 板块/专题文档放 `docs/blog/sections/`(随博客演进同步更新)
- 设计/实现计划放 `docs/superpowers/`(plans 计划、specs 规格)

## 协作约定

- **多设备 / 并行更新**:本项目由**两个设备 + 同一 GitHub 账号**共同维护,且工作区常有并行会话同时操作同一工作树。git 推送与共享文件写入可能产生冲突(互相覆盖 / 推送被拒 / 内容丢失)。完整方案(同步流程、推送被拒处置、提交铁律、共享文件并发写规范、分支隔离建议)见 **[`COLLABORATION.md`](COLLABORATION.md)**。
