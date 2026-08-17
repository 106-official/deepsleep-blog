# -*- coding: utf-8 -*-
"""检查必刷550题-会计中漏识别的章节标题实际格式"""
import fitz, re

doc = fitz.open(r"D:\CPA备考全套\cpa注册会计师2026备考\8、CPA注册会计师（必刷550题）\25必刷550题-会计.pdf")
# 找所有含"第X章"的行，打印上下文
for p in range(10, 120):
    t = doc[p].get_text()
    for line in t.splitlines():
        s = line.strip()
        if re.match(r'^第[一二三四五六七八九十]+章', s):
            # 打印该行及下一行
            lines = t.splitlines()
            idx = lines.index(line) if line in lines else -1
            nxt = lines[idx+1] if idx >= 0 and idx+1 < len(lines) else ''
            nxt2 = lines[idx+2] if idx >= 0 and idx+2 < len(lines) else ''
            print(f"p{p+1}: [{s}] | 下一行: [{nxt}] | 再下一行: [{nxt2}]")
doc.close()
