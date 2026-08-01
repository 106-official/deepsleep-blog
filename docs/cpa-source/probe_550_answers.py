# -*- coding: utf-8 -*-
"""检查必刷550题-会计 答案区的章节标题格式（p205+）"""
import fitz, re

doc = fitz.open(r"D:\CPA备考全套\cpa注册会计师2026备考\8、CPA注册会计师（必刷550题）\25必刷550题-会计.pdf")
print(f"总页数: {doc.page_count}")
for p in range(203, doc.page_count):
    t = doc[p].get_text()
    hits = []
    for line in t.splitlines():
        s = line.strip()
        if re.match(r'^第[一二三四五六七八九十]+章', s) or '答案' in s[:8]:
            hits.append(s)
    if hits:
        print(f"p{p+1}: {hits[:4]}")
doc.close()
