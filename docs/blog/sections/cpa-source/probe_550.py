# -*- coding: utf-8 -*-
"""提取必刷550题-会计 全文，查看章节标题格式，用于设计切分逻辑"""
import fitz

doc = fitz.open(r"D:\CPA备考全套\cpa注册会计师2026备考\8、CPA注册会计师（必刷550题）\25必刷550题-会计.pdf")
# 找目录页（内容提要之后通常有目录）
for i in range(5, 15):
    t = doc[i].get_text()
    if '第一章' in t or '第1章' in t or '第 一 章' in t:
        print(f"===== p{i+1} 目录页 =====")
        print(t[:3000])
        break

print(f"\n===== 总页数 {doc.page_count}，采样正文页 p15 =====")
print(doc[15].get_text()[:1500])
doc.close()
