"""诊断 fm.txt 的章节标记分布。"""
import re
from pathlib import Path

CHAPTER_RE = re.compile(r'^第([一二三四五六七八九十百零〇]+)章\s*(.*)')

txt = Path('textbooks/fm.txt').read_text(encoding='utf-8').splitlines()
print(f'fm.txt 总行数: {len(txt)}')

# 找正文起始
body_start = 0
for i, line in enumerate(txt):
    if '===== Page' in line and '/' in line:
        body_start = i
        break
print(f'正文起始行（第一个Page标记）: L{body_start + 1}')
print(f'目录区前5行预览:')
for i in range(min(5, body_start)):
    print(f'  L{i+1}: {txt[i][:80]}')

print()
print(f'目录区所有含"第X章"的行（L1-L{body_start}）:')
for i in range(body_start):
    m = CHAPTER_RE.match(txt[i].strip())
    if m:
        print(f'  L{i+1:>5}: {txt[i].strip()[:70]}')

print()
print(f'正文区前60个含"第X章"的行:')
hits = []
for i in range(body_start, len(txt)):
    m = CHAPTER_RE.match(txt[i].strip())
    if m:
        hits.append((i + 1, txt[i].strip(), m.group(1), m.group(2).strip()))
    if len(hits) >= 60:
        break
for ln, content, num, title in hits:
    print(f'  L{ln:>6} [第{num}章] title="{title[:40]}"  | {content[:60]}')

# 统计每个章节号在正文区的出现次数
print()
print('各章节号在正文区出现次数:')
counts = {}
for i in range(body_start, len(txt)):
    m = CHAPTER_RE.match(txt[i].strip())
    if m:
        num = m.group(1)
        counts[num] = counts.get(num, 0) + 1
for num, c in counts.items():
    print(f'  第{num}章: {c}次')
