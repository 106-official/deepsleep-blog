# -*- coding: utf-8 -*-
"""
必刷550题 章节切分脚本 v2
将 6 个 550 题 PDF 提取文本并按"第X章"切分为独立文件，输出到 docs/cpa-source/exercises/{subject}/

章节识别（题目区 / 答案区）：
- 题目区标题：行内或后 3 行含"历年分值/本章答案"，或为短行"第X章"
  - 独立行格式："第二章\n历年分值：2~4分本章答案：P214\n存 货"
  - 同行格式："第十一章历年分值：4~6分本章答案：P269"
- 答案区标题：行内或后 2 行含"参考答案及解析"或"答案速查"
  - 格式："第八章 负债 参考答案及解析"（OCR 常带 I 噪声：第八章I 负债参考答案及解析）
- 目录行：标题后跟页码，不含上述标记

输出：exercises/{subject}/NN-标题_题目.txt + NN-标题_答案.txt
"""

import fitz
import re
from pathlib import Path

SUBJECTS = [
    ('会计', 'accounting'),
    ('审计', 'audit'),
    ('财管', 'fm'),
    ('战略', 'strategy'),
    ('经济法', 'economic-law'),
    ('税法', 'tax-law'),
]

EX550_ROOT = Path(r"D:\CPA备考全套\cpa注册会计师2026备考\8、CPA注册会计师（必刷550题）")
OUT_ROOT = Path(__file__).parent / 'exercises'

CHAPTER_RE = re.compile(r'^第([一二三四五六七八九十百零〇]+)章\s*(.*)$')


def cn_to_int(cn: str) -> int:
    CN = {'一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10}
    if not cn:
        return 0
    if '十' in cn:
        parts = cn.split('十')
        tens = CN.get(parts[0], 1) if parts[0] else 1
        ones = CN.get(parts[1], 0) if len(parts) > 1 and parts[1] else 0
        return tens * 10 + ones
    return CN.get(cn, 0)


def clean_title(t: str) -> str:
    """清理章节标题：去 OCR 噪声（I/1/|）、参考答案后缀、页码、历年分值。"""
    t = re.sub(r'^\s*[I1|｜·]\s*', '', t)
    t = re.sub(r'[I1|｜]\s*$', '', t)
    t = re.sub(r'参考答案及解析.*$', '', t)
    t = re.sub(r'历年分值.*$', '', t)
    t = re.sub(r'本章答案.*$', '', t)
    t = re.sub(r'[\d\s|｜]+$', '', t)
    return t.strip()


def extract_pdf(path: Path) -> str:
    doc = fitz.open(str(path))
    parts = []
    for page in doc:
        parts.append(page.get_text())
    doc.close()
    return '\n'.join(parts)


def split_one(subject_cn: str, subject_en: str):
    pdf_path = None
    for f in EX550_ROOT.glob('*.pdf'):
        if subject_cn in f.name:
            pdf_path = f
            break
    if not pdf_path:
        print(f'  ✗ 未找到 {subject_cn} 550题 PDF')
        return

    print(f'\n=== {subject_cn} ({subject_en}) — {pdf_path.name} ===')
    text = extract_pdf(pdf_path)
    lines = text.splitlines()
    print(f'  共 {len(lines)} 行')

    toc_titles = {}      # 目录标题 num -> title
    questions = {}       # 题目区 num -> {start, title}
    answers = {}         # 答案区 num -> {start, title}

    for i, line in enumerate(lines):
        m = CHAPTER_RE.match(line.strip())
        if not m:
            continue
        num = cn_to_int(m.group(1))
        if num <= 0 or num > 60:
            continue
        title_part = m.group(2).strip()
        lookahead = ''.join(lines[i + 1:i + 3])

        is_answer = ('参考答案' in title_part) or ('答案速查' in title_part) or \
                    ('参考答案' in lookahead) or ('答案速查' in lookahead)
        is_body = (not is_answer) and (
            ('历年分值' in title_part) or ('本章答案' in title_part) or
            ('历年分值' in lookahead) or ('本章答案' in lookahead) or
            (not title_part)
        )

        if is_answer:
            if num not in answers:
                answers[num] = {'start': i, 'title': clean_title(title_part)}
        elif is_body:
            if num not in questions:
                questions[num] = {'start': i, 'title': clean_title(title_part)}
        elif title_part and not re.match(r'^[\d|｜I]+$', title_part):
            # 目录行
            title = clean_title(title_part)
            if title and num not in toc_titles:
                toc_titles[num] = title

    # 补齐章节名（优先目录标题，其次正文标题）
    for num, ch in questions.items():
        t = toc_titles.get(num, '') or ch['title']
        ch['title'] = t or '(待识别)'
    for num, ch in answers.items():
        if num in questions:
            ch['title'] = questions[num]['title']

    # 答案区起始（用于题目区最后章的边界）
    answer_start = min((a['start'] for a in answers.values()), default=len(lines))

    out_dir = OUT_ROOT / subject_en
    out_dir.mkdir(parents=True, exist_ok=True)
    for old in out_dir.glob('*.txt'):
        old.unlink()

    q_nums = sorted(questions.keys())
    print(f'  题目区 {len(q_nums)} 章 / 答案区 {len(answers)} 章 / 目录标题 {len(toc_titles)} 条')

    for j, num in enumerate(q_nums):
        ch = questions[num]
        start = ch['start']
        end = questions[q_nums[j + 1]]['start'] if j + 1 < len(q_nums) else answer_start
        ch_text = '\n'.join(lines[start:end])
        safe_title = re.sub(r'[\\/:*?"<>|\s]+', '', ch['title'])[:20] or 'untitled'
        q_name = f'{num:02d}-{safe_title}_题目.txt'
        (out_dir / q_name).write_text(ch_text, encoding='utf-8')

        # 答案部分
        if num in answers:
            a_start = answers[num]['start']
            a_nums = sorted(answers.keys())
            ai = a_nums.index(num)
            a_end = answers[a_nums[ai + 1]]['start'] if ai + 1 < len(a_nums) else len(lines)
            a_text = '\n'.join(lines[a_start:a_end])
            a_name = f'{num:02d}-{safe_title}_答案.txt'
            (out_dir / a_name).write_text(a_text, encoding='utf-8')
            a_size = len(a_text.encode('utf-8')) / 1024
        else:
            a_size = 0

        q_size = len(ch_text.encode('utf-8')) / 1024
        flag = ''
        if q_size < 3 and a_size < 3:
            flag = ' ⚠ 双小'
        print(f'    第{num:02d}章 {q_name:<32} 题{q_size:>6.1f}KB 答{a_size:>6.1f}KB{flag}')


def main():
    print('=' * 70)
    print('必刷550题 章节切分 v2')
    print(f'输入: {EX550_ROOT}')
    print(f'输出: {OUT_ROOT}')
    print('=' * 70)
    for cn, en in SUBJECTS:
        split_one(cn, en)


if __name__ == '__main__':
    main()
