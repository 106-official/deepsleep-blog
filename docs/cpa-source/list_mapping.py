# -*- coding: utf-8 -*-
"""列出 550题章节 与 现有章节 对照表（用于建立映射）"""
import re, json
from pathlib import Path

BASE = Path(__file__).parent
CONTENT = BASE.parent.parent / 'content' / 'learn' / 'cpa'
EX = BASE / 'exercises'

SUBJ_DIR = {
    'accounting': '02-accounting',
    'audit': '03-audit',
    'fm': '04-fm',
    'strategy': '05-strategy',
    'economic-law': '06-economic-law',
    'tax-law': '07-tax-law',
}

for en, dirname in SUBJ_DIR.items():
    print(f"\n{'='*60}\n{en} ({dirname})\n{'='*60}")
    # 现有章节
    md_dir = CONTENT / dirname
    md_chapters = {}
    if md_dir.exists():
        for f in sorted(md_dir.glob('[0-9][0-9]-*.md')):
            m = re.match(r'^(\d+)-(.+)\.md$', f.name)
            if m:
                # 读取 title
                title = ''
                try:
                    for line in f.read_text(encoding='utf-8').splitlines()[:8]:
                        if line.startswith('title:'):
                            title = line[6:].strip().strip('"').strip("'")
                            break
                except Exception:
                    pass
                md_chapters[int(m.group(1))] = f'{m.group(1)}. {m.group(2)} ({title})'
    # 550章节
    ex_dir = EX / en
    ex_chapters = {}
    if ex_dir.exists():
        for f in sorted(ex_dir.glob('*_题目.txt')):
            m = re.match(r'^(\d+)-(.+)_题目\.txt$', f.name)
            if m:
                ex_chapters[int(m.group(1))] = f'{m.group(1)}. {m.group(2)}'

    print('--- 现有 .md 章节 ---')
    for k in sorted(md_chapters):
        print(f'  {md_chapters[k]}')
    print('--- 550题 章节 ---')
    for k in sorted(ex_chapters):
        print(f'  {ex_chapters[k]}')
