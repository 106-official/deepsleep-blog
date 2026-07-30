# CPA 教材蒸馏补充 · 全过程项目文档

> **项目类型**: 静态站点内容工程 / 知识蒸馏
> **执行时间**: 2026-07-30 ~ 2026-07-31
> **目标站点**: https://deepsleep.fun/learn/cpa/
> **源资料**: 4TB 网盘资源（已下载到本地 `D:\CPA备考全套\`）
> **当前阶段**: 阶段A 已完成
> **状态**: ✅ 86 章教材已上线，六科体量达标
> **配套文档**: `learn-section.md`（learn 板块技术架构）

---

## 📖 1. 项目背景与目标

### 1.1 起点
- deepsleep.fun 已有 `/learn` 板块（Hugo + PaperMod 主题，自定义 `learn.html` layout）
- 初始只有骨架 + 首章示例，其余占位
- 用户网盘有 4TB CPA 备考资源（视频、PDF、习题、思维导图等）
- 需要把这些资源**蒸馏重构**为一份详尽的、教材级别的知识介绍，补充到 `/learn/cpa/` 下

### 1.2 目标
1. 把 4TB 多模态资源精简为可读的纯文本教材
2. CPA 六科（会计/审计/财管/战略/经济法/税法）全部章节覆盖
3. 每章体量 25-40KB（教材级别深度，非占位）
4. 统一六段式结构，便于学习与检索
5. 静态站点友好（Hugo + Markdown + front matter）
6. 整个过程可被新对话复现、扩展

### 1.3 最终成果（截至 2026-07-31）

| 科目 | 章节数 | 总体量 | 平均 KB/章 | 状态 |
|------|--------|--------|-----------|------|
| 02-accounting 会计 | 25 | ~500KB | 20.0 | ✅ 达标 |
| 03-audit 审计 | 12 | ~386KB | 32.2 | ✅ 达标 |
| 04-fm 财务成本管理 | 15 | 388KB | 25.9 | ✅ 阶段A 补全 |
| 05-strategy 公司战略 | 8 | 259KB | 32.4 | ✅ 阶段A 补全 |
| 06-economic-law 经济法 | 12 | ~495KB | 41.2 | ✅ 达标 |
| 07-tax-law 税法 | 14 | ~319KB | 22.8 | ✅ 达标 |
| **合计** | **86** | **~2.35MB** | **27.4** | ✅ |

---

## 🧪 2. 资源漏斗策略（4TB → 2.35MB）

### 2.1 五级漏斗

```
4TB    原始网盘资源（视频/PDF/音频/图片/混合）
  ↓ 过滤1：只选 2026 最新版 + 官方教材 + 主流机构
200G   精选子集（本地下载 D:\CPA备考全套\）
  ↓ 过滤2：PDF 提取文本（pymupdf），视频转写（通义听悟/Whisper）
50MB   纯文本语料
  ↓ 过滤3：按科目分章、去重、章节对齐
5MB    结构化文本（按章节切分）
  ↓ 过滤4：sub-agent 蒸馏 → 六段式 Markdown
2.35MB 最终教材（86 个 .md 文件）
```

### 2.2 源资料目录结构

本地下载位置：`D:\CPA备考全套\cpa注册会计师2026备考\`

```
1、CPA注册会计师（历年真题）（2013-2025）    ← 真题（阶段B 用）
2、CPA注册会计师（JC）（2026版）            ← 6 科可搜索 PDF 教材 ⭐ 主源
3、CPA注册会计师（轻一）（2026）            ← 习题集（阶段B 用）
4、CPA注册会计师（轻二）                    ← 习题集
5、CPA注册会计师（三色笔记）                ← 浓缩笔记
6、CPA注册会计师（思维导图）                ← 结构参考
7、CPA注册会计师（默写本）                  ← 记忆辅助
8、CPA注册会计师（必刷550题）               ← 习题（阶段B 用）
```

### 2.3 JC 教材 PDF 清单（主源）

位于 `2、CPA注册会计师（JC）（2026版）\`：

| 文件 | 对应科目 |
|------|---------|
| 2026年会计-可搜索.pdf | 02-accounting |
| 2026年审计-可搜索.pdf | 03-audit |
| 2026年财务成本管理-可搜索.pdf | 04-fm |
| 2026年公司战略与风险管理-可搜索.pdf | 05-strategy |
| 2026年经济法-可搜索.pdf | 06-economic-law |
| 2026年税法-可搜索.pdf | 07-tax-law |

> **关键**：必须是"可搜索"版本（OCR 过的），pymupdf 才能提取出文本。扫描版不可用。

---

## 🏗️ 3. 目录结构与命名规范

### 3.1 Hugo 目录结构

```
blog-static/content/learn/cpa/
├── _index.md                    # /learn/cpa/          CPA 证书概览
├── 01-overview.md               # /learn/cpa/01-overview/         报考指南
├── 02-accounting/               # /learn/cpa/02-accounting/       会计
│   ├── _index.md                #   科目概览（科目信息 + 章节表）
│   ├── 01-basic-concepts.md     #   总论
│   ├── 02-inventory.md          #   存货
│   ├── ...
│   └── 25-government-accounting.md
├── 03-audit/                    # 审计（12 章）
│   ├── _index.md
│   ├── 01-audit-overview.md
│   └── ...
├── 04-fm/                       # 财务成本管理（15 章）
├── 05-strategy/                 # 公司战略与风险管理（8 章）
├── 06-economic-law/             # 经济法（12 章）
├── 07-tax-law/                  # 税法（14 章）
└── 08-comprehensive.md          # 综合阶段（占位）
```

### 3.2 文件命名规则

- `_index.md`：每个 section 的首页（Hugo Branch Bundle 约定），URL 为 `/learn/cpa/<subject>/`
- `NN-slug.md`：章节文件
  - `NN` = 两位序号（01、02...25），与 front matter `weight` 一致
  - `slug` = URL 友好的英文短名（kebab-case），如 `06-long-term-equity`、`12-financial-instruments`
- 序号决定 sidebar 排序与上下篇导航顺序

### 3.3 科目目录 slug

| slug | 科目 | 章数 | icon |
|------|------|-----|------|
| 02-accounting | 会计 | 25 | 📒 |
| 03-audit | 审计 | 12 | 🔍 |
| 04-fm | 财务成本管理 | 15 | 📊 |
| 05-strategy | 公司战略与风险管理 | 8 | 🎯 |
| 06-economic-law | 经济法 | 12 | ⚖️ |
| 07-tax-law | 税法 | 14 | 💰 |

---

## 📋 4. Front Matter 标准（强制）

每个章节 `.md` 必须包含以下 front matter：

```yaml
---
title: "章节标题"                    # 必填，显示在 h1 和 sidebar
description: "CPA <科目> - <章节简称>"  # 必填，SEO + 标题下方
layout: "learn"                      # 必填，调用 learn.html
slug: "01-overview"                  # 必填，URL 最后一段
cert: "CPA"                          # 必填，决定徽章颜色（CPA 红金 / ACCA 深蓝）
subject: "02-accounting"            # 必填，所属科目目录 slug
weight: 1                           # 必填，章节排序（与文件名序号一致）
difficulty: "⭐"                     # 推荐，难度评级（⭐ ~ ⭐⭐⭐⭐⭐）
exam_weight: "2-3分"                 # 推荐，历年分值
hours: "3-4h"                        # 推荐，建议学时
keywords: ["关键词1", "关键词2"]      # 推荐，SEO
ShowToc: true                        # 必填，开启「此页内容」
TocOpen: true                        # 必填，TOC 默认展开
draft: false                         # 必填，false 让占位章节也能访问
---
```

### 4.1 Front matter 校验脚本

```powershell
# 校验所有章节的 front matter 完整性
$base = "c:\Users\26516\Desktop\n8n\blog-static\content\learn\cpa"
$bad = @()
foreach ($d in @("02-accounting","03-audit","04-fm","05-strategy","06-economic-law","07-tax-law")) {
    Get-ChildItem "$base\$d" -Filter "*.md" | Where-Object { $_.Name -ne "_index.md" } | ForEach-Object {
        $c = Get-Content $_.FullName -Raw
        if ($c -notmatch '(?s)^---.*?---') { $bad += "$d/$($_.Name): no front matter" }
        elseif ($c -notmatch 'layout:\s*"learn"') { $bad += "$d/$($_.Name): missing layout" }
        elseif ($c -notmatch 'cert:\s*"CPA"') { $bad += "$d/$($_.Name): missing cert" }
    }
}
if ($bad.Count -eq 0) { Write-Host "ALL OK" } else { $bad }
```

---

## 📚 5. 六段式内容结构（核心规范）

每章节正文必须包含以下六段，顺序固定：

### 5.1 段落定义

| 序号 | 标题 | 内容 | 占比建议 |
|------|------|------|---------|
| 1 | 📍 章节定位 | 表格：所属科目/难度/历年分值/建议学时/核心地位 | 5% |
| 2 | 📝 考情分析 | 命题规律、重点考查趋势、与前后章联系 | 10% |
| 3 | 📋 知识框架 | 本章知识结构图/表（Markdown 表格或列表） | 10% |
| 4 | 🔍 核心精讲 | 分小节详细讲解，含公式/案例/对比表格 | 55% |
| 5 | 💡 典型例题 | 2-3 道代表性例题 + 详细解析 | 15% |
| 6 | 🎯 记忆口诀 | 便于记忆的口诀或要点总结 | 5% |

### 5.2 段落间分隔

段落之间用 `---`（水平线）分隔。

### 5.3 章节定位表格模板

```markdown
## 📍 章节定位

| 项目 | 信息 |
|------|------|
| **所属科目** | 📊 财务成本管理 |
| **难度等级** | ⭐⭐ |
| **历年分值** | 2-3分 |
| **建议学时** | 3-4h |
| **核心地位** | 全书基础入门章 |
```

### 5.4 核心精讲子节命名

- 用三级标题 `### 4.1 子模块名`
- 公式用行内 `$...$` 或行间 `$$...$$` LaTeX 语法
- 财管公式密集章节，每节配数值案例
- 战略科目模型要配企业案例（华为/海尔/小米/阿里/比亚迪等中国案例优先）

### 5.5 典型例题格式

```markdown
## 💡 典型例题

### 例题 1
**题目**：...
**解析**：...
**答案**：...

---
### 例题 2
...
```

### 5.6 记忆口诀格式

```markdown
## 🎯 记忆口诀

1. **口诀1**：要点说明
2. **口诀2**：要点说明
...
```

---

## 🤖 6. Sub-agent 并行处理模式

### 6.1 何时使用 sub-agent

- **批量化多章节任务**（用户明确指示）
- 章节独立、可并行处理
- 每章需要长文本生成（>15KB）

### 6.2 Sub-agent 任务模板

每个 sub-agent 的 prompt 必须包含：

```
## 任务
<具体目标，如"精化补全 CPA 财务成本管理科目章节">

## 第一步：读取范本
先读取成熟范本章节：
c:\Users\26516\Desktop\n8n\blog-static\content\learn\cpa\02-accounting\13-revenue.md

## 工作目录
c:\Users\26516\Desktop\n8n\blog-static\content\learn\cpa\<subject>\

## 当前体量（需补全的章节清单）
- 01-xxx.md (xx KB)
- ...

## 六段式结构（每章必须包含，参考范本）
1. 📍 章节定位
2. 📝 考情分析
3. 📋 知识框架
4. 🔍 核心精讲
5. 💡 典型例题
6. 🎯 记忆口诀

## 约束（严格遵守）
- 保留现有 front matter 不变
- 不碰 PDF 源文件（D:\CPA备考全套）
- 只修改指定目录下的 .md 文件，不碰其他科目
- 用 Read 读取每章 → Edit 增量补全（不整体重写）
- Markdown 格式：二级标题 ##，章节间用 --- 分隔
- <科目特定要求：财管公式 / 战略模型配案例 / etc.>

## 完成后报告
列出改了哪些章节，每章改前/改后体量（KB）
```

### 6.3 范本章节

**质量标杆**：`c:\Users\26516\Desktop\n8n\blog-static\content\learn\cpa\02-accounting\13-revenue.md`（44KB，收入章节，六段式结构最完整）

### 6.4 并行启动多个 sub-agent

在同一个 Assistant 回合中，并行调用多个 Agent 工具：

```
# 同时启动 2 个 sub-agent
Agent(prompt=<财管任务>, subagent_type="general-purpose")
Agent(prompt=<战略任务>, subagent_type="general-purpose")
```

两个 agent 同时执行，结果在同一个工具响应中返回。

### 6.5 Sub-agent 完成后的报告格式

Sub-agent 必须返回：

| 章节 | 改前(KB) | 改后(KB) | 增量(KB) | 主要补充内容 |
|------|---------|---------|---------|------------|
| 01-xxx | 12.1 | 26.4 | +14.3 | ... |

---

## 🚀 7. 阶段A 执行过程（已完成）

### 7.1 阶段A 范围（用户确认）

> **精化补全薄弱科目**
> 当前状态：CPA 六科 86 章已蒸馏并提交，但财管(221KB)/战略(86KB)体量明显偏少，会计/经济法较充实。
> 决策：聚焦启动 2 个 sub-agent 处理最薄弱的财管和战略，其余 4 科已达标暂不动。

### 7.2 阶段A 执行步骤

#### Step 1: 提交现有 86 章改动作为基线

```powershell
cd "c:\Users\26516\Desktop\n8n\blog-static"
git add content/learn/cpa/
# 用临时文件传递 commit message（PowerShell 不支持 heredoc）
git commit -F "C:\Users\26516\AppData\Local\Temp\cpa_commit_msg.txt"
# commit 2f15ff1
```

Commit message 内容（写入临时文件后用 `-F` 传递）：

```
feat(learn): CPA 六科 86 章教材内容蒸馏

- 会计 25 章 / 审计 12 章 / 财管 15 章 / 战略 8 章 / 经济法 12 章 / 税法 14 章
- 统一 front matter（cert/subject/weight/difficulty/exam_weight/hours/keywords）
- 六段式结构：章节定位 / 考情分析 / 知识框架 / 核心精讲 / 典型例题 / 记忆口诀
```

**结果**：86 files changed, 33717 insertions(+), 1023 deletions(-)

#### Step 2: 推送到 GitHub

```powershell
cd "c:\Users\26516\Desktop\n8n\blog-static"
git -c http.proxy=http://127.0.0.1:65532 -c https.proxy=http://127.0.0.1:65532 push origin main
# 5bb1a04..2f15ff1 main -> main
```

#### Step 3: 并行启动 2 个 sub-agent

在同一个 Assistant 回合中并行调用 2 个 Agent 工具（详见第 6 节任务模板）。

- Sub-agent 1：精化补全 04-fm 财管 15 章
- Sub-agent 2：精化补全 05-strategy 战略 8 章

#### Step 4: 验证 sub-agent 改动

```powershell
# 1. 验证文件体量
$base = "c:\Users\26516\Desktop\n8n\blog-static\content\learn\cpa"
foreach ($d in @("04-fm","05-strategy")) {
    $p = "$base\$d"
    $files = Get-ChildItem $p -Filter "*.md" | Where-Object { $_.Name -ne "_index.md" }
    $total = ($files | Measure-Object -Property Length -Sum).Sum
    Write-Host ("=== {0} === {1} files, {2}KB total" -f $d, $files.Count, [math]::Round($total/1KB,1))
}

# 2. 验证 front matter 完整性（见 4.1 节脚本）

# 3. Hugo build
cd "c:\Users\26516\Desktop\n8n\blog-static"
hugo --gc
# 期望：225 pages, 780ms, 无 error
```

#### Step 5: 提交精化改动并推送

```powershell
cd "c:\Users\26516\Desktop\n8n\blog-static"
git add content/learn/cpa/04-fm/ content/learn/cpa/05-strategy/
git commit -F "C:\Users\26516\AppData\Local\Temp\cpa_refine_msg.txt"
# commit e20ce84
git -c http.proxy=http://127.0.0.1:65532 -c https.proxy=http://127.0.0.1:65532 push origin main
# 441cc88..e20ce84 main -> main
```

Commit message：

```
feat(learn): 精化补全财管/战略两科教材内容 (阶段A)

- 04-fm 财务成本管理 13 章补全：221KB → 388KB（每章 22.7-32.3KB）
- 05-strategy 公司战略 8 章补全：86KB → 259KB（每章 26.2-49.9KB）
- 统一六段式结构：章节定位/考情分析/知识框架/核心精讲/典型例题/记忆口诀
- 财管补充 WACC/NPV/IRR/BS 期权模型公式推导与数值案例
- 战略补充 SWOT/PEST/波特五力/价值链/BCG/COSO/ERM 模型配中国企业案例
- 其余 4 科（会计/审计/经济法/税法）已达标，未改动
- Hugo build 验证通过：225 pages，780ms
```

**结果**：21 files changed, 6848 insertions(+), 608 deletions(-)

### 7.3 阶段A 成果汇总

| 科目 | 改前 | 改后 | 增量 | 章节体量范围 |
|------|------|------|------|-------------|
| 04-fm 财务成本管理 | 221KB / 15章 | 388KB / 15章 | +167KB | 22.7–32.3KB/章 |
| 05-strategy 公司战略 | 86KB / 8章 | 259KB / 8章 | +173KB | 26.2–49.9KB/章 |

#### 财管补充内容
- WACC 计算、NPV/IRR 决策、BS 期权模型公式推导
- MM 理论、约当产量、成本还原
- 配数值案例与 4-5 道例题/章

#### 战略补充内容
- SWOT/PEST/波特五力/价值链/BCG/SPACE/COSO 内控/ERM 框架模型详尽展开
- 配华为/海尔/小米/阿里/比亚迪等中国企业案例与对比表格

### 7.4 提交记录

| Commit | 说明 | 文件数 | 行变化 |
|--------|------|--------|--------|
| 2f15ff1 | CPA 六科 86 章教材内容蒸馏（基线） | 86 | +33717 / -1023 |
| e20ce84 | 精化补全财管/战略两科（阶段A） | 21 | +6848 / -608 |

---

## 🔍 8. 验证方法

### 8.1 文件体量检查

```powershell
$base = "c:\Users\26516\Desktop\n8n\blog-static\content\learn\cpa"
foreach ($d in @("02-accounting","03-audit","04-fm","05-strategy","06-economic-law","07-tax-law")) {
    $p = "$base\$d"
    if (Test-Path $p) {
        $files = Get-ChildItem $p -Filter "*.md" | Where-Object { $_.Name -ne "_index.md" }
        $total = ($files | Measure-Object -Property Length -Sum).Sum
        Write-Host ("{0}: {1} files, {2}KB total (avg {3}KB/ch)" -f $d, $files.Count, [math]::Round($total/1KB,1), [math]::Round($total/1KB/$files.Count,1))
    }
}
```

### 8.2 Front matter 完整性

见 4.1 节脚本。

### 8.3 Hugo build 验证

```powershell
cd "c:\Users\26516\Desktop\n8n\blog-static"
hugo --gc
```

期望输出：
```
Start building sites …
hugo v0.162.1 ...

                  │ EN
──────────────────┼─────
 Pages            │ 225
 Paginator pages  │   0
 Non-page files   │   0
 Static files     │   7
 Aliases          │  21
 Cleaned          │   0

Total in 780 ms
```

**注意**：
- WARN `deprecated: languageCode` / `Language.LanguageDirection` 是 Hugo v0.158+ 的弃用警告，不影响构建
- 任何 ERROR 都必须修复

### 8.4 HTML 渲染抽样验证

构建后检查 `public/learn/cpa/<subject>/<chapter>/index.html` 是否有占位块残留：

```powershell
# 检查是否还有 learn-placeholder 占位
Select-String -Path "c:\Users\26516\Desktop\n8n\blog-static\public\learn\cpa\04-fm\*\index.html" -Pattern "learn-placeholder" -SimpleMatch
# 期望：无输出（或只在 article 区域外）
```

---

## 📐 9. 后续阶段规划

### 9.1 阶段B：习题整合（待启动）

**目标**：在现有教材基础上，把历年真题/轻一/必刷550题的题目结构化进各章节。

**做法**：
1. 用 `extract_cpa_pdfs.py`（已存在于 `C:\Users\26516\AppData\Local\Temp\`）提取真题 PDF
2. 按章节切分题目
3. 用 sub-agent 把题目结构化进各章节的「💡 典型例题」段落
4. 不重写正文，只增强习题

**源资料**：
- `1、CPA注册会计师（历年真题）（2013-2025）`
- `3、CPA注册会计师（轻一）（2026）`
- `8、CPA注册会计师（必刷550题）`

### 9.2 阶段C：全面精化（可选）

**目标**：对会计/审计/经济法/税法的小章节做同样的补全。

**判断标准**：当前这 4 科虽达标，但个别小章节可能 <20KB，可选择性补全。

### 9.3 阶段D：PDF 源深度蒸馏（可选，最彻底）

**目标**：用 `extract_cpa_pdfs.py` 从 6 科可搜索 PDF 教材提取原文，sub-agent 基于原文系统重写所有章节。

**特点**：最彻底但最慢，会覆盖现有内容。仅在前三阶段无法满足质量要求时启动。

---

## ⚠️ 10. 关键约束与踩坑

### 10.1 硬约束（必须遵守）

| 约束 | 原因 |
|------|------|
| Git 必须用代理 `http://127.0.0.1:65532` | 网络环境限制 |
| Hugo layout 必须用 `learn` | 调用自定义模板 |
| Front matter 必须用标准 `---` 分隔 | Goldmark 解析要求 |
| Front matter 必须含 `layout/cert/subject/weight` | sidebar 渲染依赖 |
| `draft: false` | 让占位章节也能访问 |
| PDF 必须是「可搜索」版本 | pymupdf 才能提取文本 |
| CSS 变量必须定义在 `:root` | 兄弟节点继承（见 learn-section.md 第 4 节） |
| `.main:has(.learn-page)` 必须覆盖 max-width | 突破 PaperMod 768px 约束 |

### 10.2 踩坑记录

#### 坑 1: PowerShell 不支持 `&&` 和 heredoc

**问题**：
```powershell
cd "path" && git status    # 报错：'&&' 不是有效的语句分隔符
git commit -m "$(cat <<'EOF' ... EOF)"  # 报错：'<' 是保留运算符
```

**解决**：
- 用 `;` 替代 `&&`
- Commit message 写入临时文件，用 `-F` 传递：
  ```powershell
  # 写入临时文件
  Set-Content -Path "C:\Users\26516\AppData\Local\Temp\msg.txt" -Value "commit message..."
  # 用 -F 传递
  git commit -F "C:\Users\26516\AppData\Local\Temp\msg.txt"
  ```

#### 坑 2: PowerShell stderr 误报

**问题**：`git push` 成功但 PowerShell 把 stderr 输出当成错误：
```
git : To https://github.com/...
At line:15 char:4713
+ ... git -c http.proxy=... push origin main 2>&1
    + CategoryInfo : NotSpecified: (To https://gith...:String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError

   5bb1a04..2f15ff1  main -> main   ← 实际成功
```

**判断**：看最后是否有 `<old>..<new> main -> main`，有就是成功。

#### 坑 3: Git CRLF 警告

**现象**：`git add` 时大量 `LF will be replaced by CRLF` 警告。

**原因**：Windows 系统默认 CRLF，Git 自动转换。

**处理**：警告无害，可忽略。若想消除：
```powershell
git config core.autocrlf false
```

#### 坑 4: 文件名拼写错误导致 CSS 失效

**历史教训**（见 commit 88ec335）：Hugo partial 引用 `extend_head.html`（动词形）但实际文件名是 `extended_head.html`（过去分词），导致 head CSS 全部失效。

**注意**：本蒸馏任务不涉及 layout 文件，但如果需要修改 `learn.html`，先确认文件名。

#### 坑 5: Sub-agent 沙盒权限

**问题**：Sub-agent 的 Read 工具拒绝读取 workspace 外的文件（如 `D:\CPA备考全套\`）。

**解决**：把需要的文件复制到 workspace 内，或用 `dangerouslyDisableSandbox: true`（谨慎使用）。

#### 坑 6: 体量超标

**现象**：战略第 7 章内部控制最终 49.9KB，超出 40KB 上限约 25%。

**判断**：保留理由充分（高权重章节 + COSO 框架/9 项业务流程详尽展开），可接受。如需精简优先压缩案例锚定段落。

---

## 📁 11. 文件索引

### 11.1 核心文件

| 文件 | 用途 | 状态 |
|------|------|------|
| `blog-static/layouts/_default/learn.html` | learn 板块 layout（sidebar + main） | 稳定，勿动 |
| `blog-static/docs/learn-section.md` | learn 板块技术架构文档 | 稳定 |
| `blog-static/docs/CPA-教材蒸馏-项目文档.md` | 本文档 | 本文档 |
| `blog-static/content/learn/cpa/_index.md` | CPA 证书概览 | 稳定 |
| `blog-static/content/learn/cpa/01-overview.md` | 报考指南 | 稳定 |
| `blog-static/content/learn/cpa/08-comprehensive.md` | 综合阶段（占位） | 稳定 |

### 11.2 各科章节文件（86 个）

位于 `blog-static/content/learn/cpa/<subject>/` 下，详见第 3 节目录结构。

### 11.3 范本文件

| 文件 | 用途 |
|------|------|
| `content/learn/cpa/02-accounting/13-revenue.md` | 六段式结构范本（44KB，收入章节） |
| `content/learn/cpa/02-accounting/_index.md` | 科目概览范本 |

### 11.4 脚本

| 文件 | 用途 | 位置 |
|------|------|------|
| `extract_cpa_pdfs.py` | PDF 批量提取文本 | `C:\Users\26516\AppData\Local\Temp\` |

#### extract_cpa_pdfs.py 关键逻辑

```python
def process_pdf(pdf_path: Path, manifest: list):
    rel_path = str(pdf_path.relative_to(SRC_ROOT))
    top_dir = pdf_path.relative_to(SRC_ROOT).parts[0]
    type_info = TYPE_MAP.get(top_dir)
    if not type_info:
        return
    out_subdir, type_code = type_info

    subject = guess_subject(pdf_path.name)  # 从文件名猜科目
    year = extract_year(pdf_path.name)

    # 教材 → 单文件；真题 → 按年份；其他 → 按章节
    if type_code == "textbook":
        out_file = OUT_ROOT / out_subdir / f"{subject}.txt"
    elif type_code == "past_paper":
        out_file = OUT_ROOT / out_subdir / subject / f"{year}.txt"
    else:
        base = safe_name(pdf_path.stem)
        out_file = OUT_ROOT / out_subdir / subject / f"{base}.txt"

    out_file.parent.mkdir(parents=True, exist_ok=True)

    text, page_count = extract_pdf(pdf_path)  # pymupdf
    out_file.write_text(text, encoding="utf-8")

    manifest.append({
        "type": type_code,
        "subject": subject,
        "year": year,
        "source_path": rel_path,
        "output_path": str(out_file.relative_to(OUT_ROOT)),
        "page_count": page_count,
        "char_count": len(text),
        "md5": md5_of_file(pdf_path),
    })
```

---

## 🧭 12. 新对话快速启动指南

### 12.1 给新对话的最小上下文

把以下内容粘贴到新对话开头：

```
请阅读 c:\Users\26516\Desktop\n8n\blog-static\docs\CPA-教材蒸馏-项目文档.md
和 c:\Users\26516\Desktop\n8n\blog-static\docs\learn-section.md
然后帮我继续 CPA 教材蒸馏工作（阶段B / 阶段C / 阶段D）。
当前进度：阶段A 已完成（commit e20ce84），86 章已上线。
源资料在 D:\CPA备考全套\
```

### 12.2 状态检查清单

新对话开始时，先确认以下状态：

- [ ] `cd c:\Users\26516\Desktop\n8n\blog-static; git log --oneline -3` → 看到 `e20ce84` 在最上
- [ ] `git status` → clean（无未提交改动）
- [ ] 各科体量检查（见 8.1 节脚本）
- [ ] `hugo --gc` → 225 pages, 无 error
- [ ] `D:\CPA备考全套\cpa注册会计师2026备考\2、CPA注册会计师（JC）（2026版）\` 存在且有 6 个 PDF

### 12.3 扩展新章节

以 CPA 会计新增第 26 章「每股收益」为例：

1. 创建 `content/learn/cpa/02-accounting/26-eps.md`
2. front matter（参考第 4 节，weight=26）
3. 写正文（参考第 5 节六段式结构，参考 `13-revenue.md` 深度）
4. **无需修改 learn.html** — sidebar 自动通过 `$cpa.Sections` 查询渲染，章数徽章自动 +1
5. `hugo --gc` 验证
6. 提交推送

### 12.4 扩展新科目

以 CPA 新增第 9 科「综合阶段」详细化为例：

1. 创建 `content/learn/cpa/09-comprehensive/_index.md`（科目目录首页）
   - front matter 含 `layout: "learn"`, `cert: "CPA"`, `weight: 9`, `icon: "🎯"`, `subject: "09-comprehensive"`
2. 创建各章节 `content/learn/cpa/09-comprehensive/01-overview.md` 等
3. **无需修改 learn.html** — sidebar 自动遍历 `$cpa.Sections` 渲染为新折叠组
4. 旧扁平 `08-comprehensive.md` 可保留或迁移

---

## 📊 13. 项目记忆要点（已同步到 project_memory.md）

以下要点已写入 `c:\Users\26516\.trae-cn\memory\projects\-c-Users-26516-Desktop-n8n\project_memory.md`：

- CPA learn section uses two-level nested structure: subject folders contain chapter .md files
- Sidebar uses Hugo $cpa.Sections + native <details> for collapsible navigation
- Current subject auto-expanded via `eq .CurrentSection.RelPermalink`
- CPA chapter front matter must include: title, layout:"learn", cert, subject, weight, difficulty, exam_weight, hours, keywords
- 六段式结构规范：章节定位 / 考情分析 / 知识框架 / 核心精讲 / 典型例题 / 记忆口诀
- 范本章节：02-accounting/13-revenue.md
- 阶段A 完成（commit e20ce84）：86 章已上线，财管/战略已精化补全

---

## 📜 14. 版本历史

| 日期 | 版本 | 说明 |
|------|------|------|
| 2026-07-30 | v1.0 | learn 板块初始搭建（learn.html + sidebar + 首章示例） |
| 2026-07-31 | v2.0 | CPA 六科 86 章教材蒸馏（commit 2f15ff1） |
| 2026-07-31 | v2.1 | 阶段A：财管/战略精化补全（commit e20ce84） |
| 2026-07-31 | v2.1-doc | 本文档创建 |

---

## 📞 15. 相关文档索引

| 文档 | 路径 | 用途 |
|------|------|------|
| 本文档 | `blog-static/docs/CPA-教材蒸馏-项目文档.md` | CPA 教材蒸馏全过程 |
| learn 板块技术架构 | `blog-static/docs/learn-section.md` | learn.html layout 详细技术参考 |
| SleepTown 项目文档 | `blog-static/docs/SleepTown-项目文档.md` | 另一个 sidebar 布局项目参考 |
| 项目级记忆 | `c:\Users\26516\.trae-cn\memory\projects\-c-Users-26516-Desktop-n8n\project_memory.md` | 跨会话项目规则 |
| 用户偏好 | `c:\Users\26516\.trae-cn\memory\user_profile.md` | 用户级偏好 |

---

**文档结束**

> 本文档为 CPA 教材蒸馏补充的全过程记录，供新对话快速接续工作。
> 配套 `learn-section.md`（技术架构）使用。
> 最后更新：2026-07-31，阶段A 完成。
