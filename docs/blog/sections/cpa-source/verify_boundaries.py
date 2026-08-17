"""验证 strategy 第3章 + accounting 第27章边界，检查省略号字符码点。"""
import json
from pathlib import Path

chapter_map = json.loads(Path('chapter_map.json').read_text(encoding='utf-8'))

# 1. strategy 第3章边界
print('=== strategy 章节边界 ===')
for ch in chapter_map['strategy']['extracted_chapters']:
    print(f'  第{ch["ch_num"]:02d}章  L{ch["start_line"]}-L{ch["end_line"]}  {ch["size_kb"]:>7.1f}KB  {ch["title"][:30]}')

# 2. accounting 第27章边界
print('\n=== accounting 第23-30章边界 ===')
for ch in chapter_map['accounting']['extracted_chapters']:
    if 23 <= ch['ch_num'] <= 30:
        print(f'  第{ch["ch_num"]:02d}章  L{ch["start_line"]}-L{ch["end_line"]}  {ch["size_kb"]:>7.1f}KB  (出现{ch["occurrence_count"]}次)  {ch["title"][:35]}')

# 3. 检查省略号字符码点
print('\n=== 省略号字符码点检查 ===')
# audit 目录标题
audit_txt = Path('textbooks/audit.txt').read_text(encoding='utf-8').splitlines()
for i, line in enumerate(audit_txt[:300]):
    if '第一章' in line and '审计概述' in line:
        print(f'audit L{i+1}: {repr(line[:50])}')
        for ch in line:
            if ord(ch) > 0x2000:
                print(f'  字符 {repr(ch)} = U+{ord(ch):04X}')
        break

# accounting 目录标题
acc_txt = Path('textbooks/accounting.txt').read_text(encoding='utf-8').splitlines()
for i, line in enumerate(acc_txt[:400]):
    if '第一章' in line and '总论' in line:
        print(f'\naccounting L{i+1}: {repr(line[:50])}')
        for ch in line:
            if ord(ch) > 0x2000:
                print(f'  字符 {repr(ch)} = U+{ord(ch):04X}')
        break

# 4. 检查 strategy 第3章实际内容首尾
print('\n=== strategy 第3章内容首尾预览 ===')
strat_txt = Path('textbooks/strategy.txt').read_text(encoding='utf-8').splitlines()
ch3 = next(c for c in chapter_map['strategy']['extracted_chapters'] if c['ch_num'] == 3)
ch4 = next(c for c in chapter_map['strategy']['extracted_chapters'] if c['ch_num'] == 4)
print(f'第3章: L{ch3["start_line"]}-L{ch3["end_line"]}')
print(f'第4章: L{ch4["start_line"]}-L{ch4["end_line"]}')
print(f'\n第3章起始 (L{ch3["start_line"]}):')
for i in range(ch3['start_line']-1, min(ch3['start_line']+5, len(strat_txt))):
    print(f'  L{i+1}: {strat_txt[i][:70]}')
print(f'\n第3章结束/第4章起始 (L{ch4["start_line"]-3} - L{ch4["start_line"]+2}):')
for i in range(max(0, ch4['start_line']-4), min(ch4['start_line']+3, len(strat_txt))):
    marker = '>>>' if i == ch4['start_line']-1 else '   '
    print(f'  {marker} L{i+1}: {strat_txt[i][:70]}')
