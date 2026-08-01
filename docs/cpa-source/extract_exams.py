# -*- coding: utf-8 -*-
"""
CPA 历年真题提取脚本
将 D:\CPA备考全套\...\1、CPA注册会计师（历年真题）（2013-2025）\
下 6 科 143 个 PDF 提取为文本，输出到 docs/cpa-source/exams/{subject}/

文件命名：
- 题目（单套）  : {年份}_题目.txt
- 题目（两套）  : {年份}_题目_一.txt / {年份}_题目_二.txt
- 答案（单套）  : {年份}_答案.txt
- 答案（两套）  : {年份}_答案_一.txt / {年份}_答案_二.txt
- 全卷（题+答合并）: {年份}_全卷.txt（文件名同时含试题/真题 与 答案/解析）
"""

import fitz
import re
import sys
from pathlib import Path

# 科目中文关键词 → 英文目录名
SUBJECT_MAP = [
    ('会计', 'accounting'),
    ('审计', 'audit'),
    ('财务', 'fm'),          # 财务成本管理文件夹名"财务"
    ('战略', 'strategy'),
    ('经济法', 'economic-law'),
    ('税法', 'tax-law'),
]

EXAMS_ROOT = Path(r"D:\CPA备考全套\cpa注册会计师2026备考\1、CPA注册会计师（历年真题）（2013-2025）")
OUT_ROOT = Path(__file__).parent / 'exams'

YEAR_RE = re.compile(r'(20\d{2})')


def classify(filename: str) -> str:
    """按文件名分类：题目 / 答案 / 全卷。

    - "试题+参考答案及解析"（+号连接）   → 全卷（题目+答案合订）
    - "真题及答案解析"（及连接）         → 全卷（税法 2013-2015 合订）
    - "试题参考答案及解析"（无分隔符）   → 答案（2013-2021 分册版答案）
    - "试题.pdf" / "真题.pdf"           → 题目
    - "答案解析.pdf"                    → 答案
    """
    name = filename
    has_q = ('试题' in name) or ('真题' in name)
    has_a = ('答案' in name) or ('解析' in name)
    if has_q and has_a:
        if '+' in name:
            return '全卷'
        if '真题及' in name:
            return '全卷'
        return '答案'  # "试题参考答案及解析" → 答案分册
    if has_a:
        return '答案'
    if has_q:
        return '题目'
    return '题目'  # 兜底


def detect_set(filename: str) -> str:
    """检测套别（一/二套）。"""
    if any(k in filename for k in ('第一套', '（一）', '(一)', '（1）', '(1)')):
        return '一'
    if any(k in filename for k in ('第二套', '（二）', '(二)', '（2）', '(2)')):
        return '二'
    return ''


def extract_pdf(path: Path) -> str:
    doc = fitz.open(str(path))
    parts = []
    for page in doc:
        parts.append(page.get_text())
    doc.close()
    return '\n'.join(parts)


def main():
    print('=' * 70)
    print('CPA 历年真题提取')
    print(f'输入: {EXAMS_ROOT}')
    print(f'输出: {OUT_ROOT}')
    print('=' * 70)

    total_pdf = 0
    total_ok = 0
    failures = []

    for subj_cn, subj_en in SUBJECT_MAP:
        subj_dir = None
        for d in EXAMS_ROOT.iterdir():
            if d.is_dir() and subj_cn in d.name:
                subj_dir = d
                break
        if not subj_dir:
            print(f'  ✗ 未找到科目目录: {subj_cn}')
            continue

        out_dir = OUT_ROOT / subj_en
        out_dir.mkdir(parents=True, exist_ok=True)
        # 清理旧输出
        for old in out_dir.glob('*.txt'):
            old.unlink()

        pdfs = sorted(subj_dir.glob('*.pdf'))
        print(f'\n=== {subj_cn} ({subj_en}) — {len(pdfs)} 个 PDF ===')

        for pdf in pdfs:
            total_pdf += 1
            m = YEAR_RE.search(pdf.name)
            if not m:
                failures.append(f'{pdf.name}: 未识别年份')
                continue
            year = m.group(1)
            kind = classify(pdf.name)
            set_no = detect_set(pdf.name)

            try:
                text = extract_pdf(pdf)
            except Exception as e:
                failures.append(f'{pdf.name}: {e}')
                continue

            suffix = f'_{set_no}' if set_no else ''
            out_name = f'{year}_{kind}{suffix}.txt'
            out_path = out_dir / out_name
            out_path.write_text(text, encoding='utf-8')
            total_ok += 1
            size_kb = len(text.encode('utf-8')) / 1024
            print(f'    {out_name:<20} {size_kb:>7.1f}KB  <- {pdf.name}')

    print(f'\n{"=" * 70}')
    print(f'完成: {total_ok}/{total_pdf} 个 PDF 提取成功')
    if failures:
        print('失败项:')
        for f in failures:
            print(f'  - {f}')
    else:
        print('无失败项')


if __name__ == '__main__':
    main()
