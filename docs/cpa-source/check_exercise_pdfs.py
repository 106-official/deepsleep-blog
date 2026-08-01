# -*- coding: utf-8 -*-
"""抽查：必刷550题内部章节结构 + 早期真题可搜索性"""
import fitz, re

# 1. 必刷550题-会计 内部章节结构（提取前几页文本找章节标题）
print("=== 必刷550题-会计 内部结构 ===")
doc = fitz.open(r"D:\CPA备考全套\cpa注册会计师2026备考\8、CPA注册会计师（必刷550题）\25必刷550题-会计.pdf")
print(f"总页数: {doc.page_count}")
toc = doc.get_toc()
if toc:
    print(f"内置书签 {len(toc)} 条，前 25 条：")
    for lvl, title, page in toc[:25]:
        print(f"  {'  '*lvl}{title} (p{page})")
else:
    print("无内置书签，采样前 4 页文本：")
    for i in range(min(4, doc.page_count)):
        t = doc[i].get_text()
        print(f"--- p{i+1} ---")
        print(t[:600])
doc.close()

# 2. 抽查早期真题可搜索性
print("\n=== 早期真题可搜索性 ===")
samples = [
    ("会计2013", r"D:\CPA备考全套\cpa注册会计师2026备考\1、CPA注册会计师（历年真题）（2013-2025）\CPA注册会计师历年真题（会计）（2013-2025）\2013年度注会《会计》试题.pdf"),
    ("会计2015", r"D:\CPA备考全套\cpa注册会计师2026备考\1、CPA注册会计师（历年真题）（2013-2025）\CPA注册会计师历年真题（会计）（2013-2025）\2015年度注会《会计》试题.pdf"),
    ("经济法2016", r"D:\CPA备考全套\cpa注册会计师2026备考\1、CPA注册会计师（历年真题）（2013-2025）\CPA注册会计师历年真题（经济法）（2013-2025）\2016年度注会《经济法》试题.pdf"),
]
for name, path in samples:
    try:
        d = fitz.open(path)
        chars = [len(d[i].get_text().strip()) for i in [0, d.page_count//2, d.page_count-1]]
        status = "可搜索" if any(c > 100 for c in chars) else "纯扫描(需OCR)"
        print(f"[{name}] 页数={d.page_count} 采样字符={chars} → {status}")
        d.close()
    except Exception as e:
        print(f"[{name}] 失败: {e}")
