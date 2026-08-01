# -*- coding: utf-8 -*-
"""检查各科目章节的「## 7. 同步练习」小节状态：是否存在、是否重复、是否有练习答案。"""
import re
from pathlib import Path

BASE = Path(r'c:\Users\26516\Desktop\n8n\blog-static\content\learn\cpa')
SUBJECTS = {
    '02-accounting': 'accounting',
    '03-audit': 'audit',
    '04-fm': 'fm',
    '05-strategy': 'strategy',
    '06-economic-law': 'economic-law',
    '07-tax-law': 'tax-law',
}

for subj_dir in SUBJECTS:
    d = BASE / subj_dir
    if not d.exists():
        continue
    print(f'\n=== {subj_dir} ===')
    for md in sorted(d.glob('[0-9][0-9]-*.md')):
        text = md.read_text(encoding='utf-8')
        n_sec = len(re.findall(r'^## 7\. 同步练习', text, re.M))
        has_ans = bool(re.search(r'\*\*练习答案\*\*', text))
        size = round(len(text.encode('utf-8')) / 1024, 1)
        flag = []
        if n_sec == 0:
            flag.append('!! 无同步练习小节')
        elif n_sec > 1:
            flag.append(f'!! 重复小节 x{n_sec}')
        if not has_ans and n_sec > 0:
            flag.append('无练习答案')
        if flag:
            print(f'  {md.name:45s} {size:>7.1f}KB  {"; ".join(flag)}')
    print('  (未列出的章节 = 正常：1 个同步练习 + 有练习答案)')
