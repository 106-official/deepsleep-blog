# -*- coding: utf-8 -*-
"""检查会计550题答案区完整结构 + 第三十章标题位置"""
import fitz, re

doc = fitz.open(r"D:\CPA备考全套\cpa注册会计师2026备考\8、CPA注册会计师（必刷550题）\25必刷550题-会计.pdf")
print("=== 全部含'第X章'或'答案'关键行的页 ===")
for p in range(doc.page_count):
    t = doc[p].get_text()
    hits = []
    for line in t.splitlines():
        s = line.strip()
        if re.match(r'^第[一二三四五六七八九十]+章', s):
            hits.append(s[:50])
        elif '参考答案' in s or '答案速查' in s or '第三十' in s:
            hits.append('[KEY]' + s[:50])
    if hits:
        print(f"p{p+1}: {hits[:3]}")
doc.close()
