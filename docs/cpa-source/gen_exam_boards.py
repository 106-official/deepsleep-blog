# -*- coding: utf-8 -*-
"""生成 09-exams 历年真题板块骨架。

结构:
09-exams/
  _index.md                    板块概览（weight 9）
  YYYY-exam/
    _index.md                  年份概览（weight = 年份序号 1-13）
    {subject}.md               科目真题页骨架（题目 + 答案小节）

题源提示：扫描 docs/cpa-source/exams/<subject>/ 实际文件，写入科目页头部，
供 sub-agent 定位题源。
"""
from pathlib import Path

BASE = Path(r'c:\Users\26516\Desktop\n8n\blog-static\content\learn\cpa\09-exams')
EXAMS_SRC = Path(r'c:\Users\26516\Desktop\n8n\blog-static\docs\cpa-source\exams')

SUBJECTS = [
    ('accounting', '会计'),
    ('audit', '审计'),
    ('fm', '财务成本管理'),
    ('strategy', '公司战略与风险管理'),
    ('economic-law', '经济法'),
    ('tax-law', '税法'),
]
SUBJECT_DESC = {
    'accounting': 'CPA 六科之基，难度最大、内容最多',
    'audit': '理论性强，需建立审计思维',
    'fm': '计算量大，公式密集',
    'strategy': '相对简单，记忆为主',
    'economic-law': '法条记忆 + 案例分析',
    'tax-law': '政策变动频繁，需关注新规',
}

# 各科真题题型结构（与真实试卷一致）
QUESTION_SECTIONS = {
    'accounting': ['一、单项选择题', '二、多项选择题', '三、计算分析题', '四、综合题'],
    'audit': ['一、单项选择题', '二、多项选择题', '三、简答题', '四、综合题'],
    'fm': ['一、单项选择题', '二、多项选择题', '三、计算分析题', '四、综合题'],
    'strategy': ['一、单项选择题', '二、多项选择题', '三、简答题', '四、综合题'],
    'economic-law': ['一、单项选择题', '二、多项选择题', '三、案例分析题'],
    'tax-law': ['一、单项选择题', '二、多项选择题', '三、计算问答题', '四、综合题'],
}

YEARS = list(range(2013, 2026))  # 2013-2025


def find_sources(subject: str, year: int) -> list:
    """列出该科该年实际题源文件（相对 docs/cpa-source/exams/<subject>/）。"""
    subj_dir = EXAMS_SRC / subject
    if not subj_dir.exists():
        return []
    files = sorted(p.name for p in subj_dir.glob(f'{year}_*.txt'))
    return files


def fm_year_index(year: int, subject_key: str) -> str:
    """科目页 front matter。"""
    title_cn = dict(SUBJECTS)[subject_key]
    return f'''---
title: "{year}年 · {title_cn}"
description: "CPA {year}年《{title_cn}》真题 — 题目与参考答案"
layout: "learn"
cert: "CPA"
subject: "09-exams"
weight: {year - 2012}
ShowToc: true
TocOpen: true
---
'''


def subject_page(year: int, subject_key: str, subject_cn: str) -> str:
    sources = find_sources(subject_key, year)
    src_lines = '\n'.join(f'- `docs/cpa-source/exams/{subject_key}/{f}`' for f in sources)
    if not src_lines:
        src_lines = '- （该年该科题源缺失，可用相近年份或教材/550题补）'

    sections = '\n\n'.join(
        f'## {sec}\n\n（待结构化填充）' for sec in QUESTION_SECTIONS[subject_key]
    )
    return f'''{fm_year_index(year, subject_key)}
# {year}年 {subject_cn}

> 题源文件（sub-agent 依据以下文本结构化）：
{src_lines}

{sections}

## 参考答案与解析

（待结构化填充）
'''


def year_index_page(year: int) -> str:
    idx = year - 2012
    links = '\n'.join(
        f'- [{cn}]({key}/) — {SUBJECT_DESC[key]}'
        for key, cn in SUBJECTS
    )
    return f'''---
title: "{year}年真题"
description: "CPA {year}年专业阶段真题 — 六科完整试卷与参考答案"
layout: "learn"
cert: "CPA"
subject: "09-exams"
weight: {idx}
ShowToc: true
TocOpen: true
---

# {year}年真题

> CPA {year}年专业阶段考试真题汇编，按科目整理，题目与参考答案同页呈现。

## 科目试卷

{links}

## 使用说明

- 每科独立成页，题型结构与真实试卷一致（单选、多选、简答/计算、综合）。
- 部分年份题目与答案分文件存储，已按题目/答案区整合到对应小节。
'''

def board_index_page() -> str:
    # 13 年 → 表格 2 列（左 2013-2019，右 2020-2025）
    rows = []
    for i in range(7):
        left = YEARS[i]
        right = YEARS[i + 7] if i + 7 < len(YEARS) else None
        l_cell = f'[{left}年]({left}-exam/)'
        r_cell = f'[{right}年]({right}-exam/)' if right else ''
        rows.append(f'| {l_cell} | {r_cell} |')
    year_table = '\n'.join(rows)

    subj_lines = '\n'.join(
        f'- **{cn}**（`{key}/`）：{SUBJECT_DESC[key]}' for key, cn in SUBJECTS
    )
    return f'''---
title: "历年真题"
description: "CPA 专业阶段历年真题（2013-2025）— 六科完整试卷与参考答案"
layout: "learn"
cert: "CPA"
subject: "09-exams"
weight: 9
ShowToc: true
TocOpen: true
---

# 历年真题

> CPA 专业阶段历年真题汇编（2013-2025），按年份、科目组织，收录题目原文与参考答案，适合考前刷题与命题规律研究。

## 使用说明

- **按年份浏览**：从下表选择目标年份，进入该年六科试卷集合。
- **题目与答案**：每科独立成页，题目按题型组织，参考答案与解析附于页末。
- **题源说明**：真题源自历年官方试卷及权威机构整理版，仅用于学习交流。

## 年份索引

| 年份 | 年份 |
|------|------|
{year_table}

## 科目说明

{subj_lines}
'''


def main():
    if BASE.exists():
        print(f'清理旧目录: {BASE}')
        import shutil
        shutil.rmtree(BASE)
    (BASE / '2013-exam').parent.mkdir(parents=True, exist_ok=True)

    board = BASE / '_index.md'
    board.write_text(board_index_page(), encoding='utf-8')
    print(f'  ✓ {board.relative_to(BASE.parent.parent.parent)}')

    for year in YEARS:
        ydir = BASE / f'{year}-exam'
        ydir.mkdir(parents=True, exist_ok=True)
        (ydir / '_index.md').write_text(year_index_page(year), encoding='utf-8')
        print(f'  ✓ {year}-exam/_index.md')
        for key, cn in SUBJECTS:
            f = ydir / f'{key}.md'
            f.write_text(subject_page(year, key, cn), encoding='utf-8')
            print(f'    ✓ {key}.md')

    total = 1 + len(YEARS) * (1 + len(SUBJECTS))
    print(f'\n完成: 共 {total} 个文件')


if __name__ == '__main__':
    main()
