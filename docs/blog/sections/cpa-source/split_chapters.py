"""
CPA 教材章节切分脚本 v4
将 docs/cpa-source/textbooks/<subject>.txt 按章节切分为独立文件。

v4 核心修复（解决 accounting 第1-5章丢失 + strategy 第3章过大）：
1. body_start 检测：用"目录序列"算法（相邻行号差<50 + 章节号递增）找目录区结束
   - v3 用"第一个页眉型标题"对 accounting 失效（其页眉是 PURE 型如"总""存"）
   - v4 目录序列：从第一个匹配开始，相邻差<50且章节号递增（允许跳跃）则为目录区
2. 目录标题字典：从目录区提取"章节号→标题"映射（如第三章→"战略选择"）
3. 标题相似度匹配：对每个章节号，在正文区找标题最匹配的出现作为起始
   - 解决 strategy OCR 误识别：第二章页眉"战略分析"被误识别为"第三章"，标题不匹配则跳过
4. 按位置排序确保单调，计算 end_line

历史问题：
- v1/v2：body_start 用第一个 Page 标记，fm 目录区在第1页内导致崩溃
- v3：body_start 用第一个页眉型标题，accounting 页眉 PURE 型导致第1-5章丢失
- v4：body_start 用目录序列检测，标题匹配解决 OCR 误识别
"""

import re
import json
from pathlib import Path

CN_NUM = {
    '零': 0, '〇': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
    '百': 100, '千': 1000,
}

SUBJECT_DIR = {
    'accounting': '02-accounting',
    'audit': '03-audit',
    'fm': '04-fm',
    'strategy': '05-strategy',
    'economic-law': '06-economic-law',
    'tax-law': '07-tax-law',
}

CHAPTER_RE = re.compile(r'^第([一二三四五六七八九十百零〇]+)章\s*(.*)')
# 目录行特征：省略号（含 U+00B7 间隔号"·"连续2个以上）
TOC_HINTS = ['…', '⋯', '...', '．．．', '。。。', '··']
# 页码标记特征：数字、半角/全角括号、方括号、OCR 乱码页码前缀
PAGENUM_RE = re.compile(r'[\d\(（\[【]|G\d|C\d|B\d|D\d|R\d|GB|CB|G过|G3|C9|B日|D日|G阳|G38')


def cn_to_int(cn: str) -> int:
    """中文数字转阿拉伯数字。支持 1-99。"""
    if not cn:
        return 0
    if cn[0] == '十':
        return 10 if len(cn) == 1 else 10 + cn_to_int(cn[1:])
    if '十' in cn:
        parts = cn.split('十')
        tens = cn_to_int(parts[0]) if parts[0] else 1
        ones = cn_to_int(parts[1]) if len(parts) > 1 and parts[1] else 0
        return tens * 10 + ones
    if '百' in cn:
        parts = cn.split('百')
        hundreds = cn_to_int(parts[0]) if parts[0] else 1
        rest = parts[1] if len(parts) > 1 else ''
        return hundreds * 100 + (cn_to_int(rest) if rest else 0)
    result = 0
    for ch in cn:
        if ch in CN_NUM:
            result = result * 10 + CN_NUM[ch] if ch in '一二三四五六七八九零〇' else result + CN_NUM[ch]
    return result


def is_toc_line(line: str) -> bool:
    """判断是否为目录行（含省略号）。"""
    return any(h in line for h in TOC_HINTS)


def is_pure_title(title_part: str) -> bool:
    """判断标题部分是否为纯标题（不含页码标记）。"""
    if not title_part:
        return True
    return not bool(PAGENUM_RE.search(title_part))


def clean_title(title_part: str) -> str:
    """清理页眉标题，去掉尾部页码标记，保留纯标题。

    "财务管理概述 ( 3"      -> "财务管理概述"
    "价值评估基础0 83"       -> "价值评估基础"
    "战略分析j 75"          -> "战略分析"
    "战略选择"              -> "战略选择"（纯标题不变）
    """
    if not title_part:
        return ''
    # 从右往左找最后一个中文字符，保留到该位置
    m = re.search(r'^(.*?[\u4e00-\u9fff])\s*[^\u4e00-\u9fff\s]*\s*$', title_part)
    if m:
        return m.group(1).strip()
    return title_part.strip()


def clean_toc_title(title_part: str) -> str:
    """清理目录标题，去掉省略号（含 U+00B7 间隔号"·"、U+22EF ⋯）和尾部页码。

    "审计概述 ⋯ ⋯ ⋯"             -> "审计概述"（先去空格使⋯连续）
    "总论·········(I"              -> "总论"
    "固定资产····················"  -> "固定资产"
    "战略选择"                      -> "战略选择"（纯标题不变）
    """
    if not title_part:
        return ''
    # 先去空格，使分散的省略号字符连续（audit 目录 "⋯ ⋯ ⋯" -> "⋯⋯⋯"）
    t = re.sub(r'\s+', '', title_part)
    # 去掉省略号序列（… ⋯ · . ． 等连续2个以上）
    t = re.sub(r'[…⋯·\.．]{2,}', '', t)
    # 去掉残留的单个间隔号
    t = re.sub(r'[·]+', '', t)
    # 去掉尾部页码、括号、数字
    t = re.sub(r'[\d\(（\[【】)\]I]+$', '', t)
    return t.strip()


def title_similarity(t1: str, t2: str) -> float:
    """计算两个标题的相似度（0-1）。

    - 完全相同：1.0
    - 包含关系：1.0
    - 共同字符比例：common/max_len
    """
    if not t1 or not t2:
        return 0
    # 去掉空格和标点
    t1_clean = re.sub(r'[\s…⋯\.．。、]', '', t1)
    t2_clean = re.sub(r'[\s…⋯\.．。、]', '', t2)
    if not t1_clean or not t2_clean:
        return 0
    if t1_clean == t2_clean:
        return 1.0
    # 包含关系（短标题是长标题的子串，处理"总"匹配"总论"）
    if t1_clean in t2_clean or t2_clean in t1_clean:
        return 1.0
    # 共同字符比例
    common = sum(1 for c in t1_clean if c in t2_clean)
    return common / max(len(t1_clean), len(t2_clean))


def find_body_start(lines: list) -> int:
    """找正文起始位置（目录区结束后）。

    混合策略：
    1. 若 TOC 章节标题行（含省略号）>= 5，body_start = 最后一个 TOC 行 + 1
       - 适用 accounting/strategy/audit/economic-law/tax-law（TOC 型目录）
       - 能容忍目录区内章节号重复或乱序（如 accounting 第十二章出现两次）
    2. 否则用目录序列算法（相邻 gap<50 + 章节号递增）
       - 适用 fm（PURE 型目录，无省略号）
    """
    # 1. 收集 TOC 章节标题行
    toc_lines = []
    for i, line in enumerate(lines):
        line_stripped = line.strip()
        m = CHAPTER_RE.match(line_stripped)
        if m and is_toc_line(line_stripped):
            num = cn_to_int(m.group(1))
            if 1 <= num <= 50:
                toc_lines.append(i)

    if len(toc_lines) >= 5:
        return toc_lines[-1] + 1

    # 2. 退化为目录序列算法（fm 场景）
    matches = []
    for i, line in enumerate(lines):
        m = CHAPTER_RE.match(line.strip())
        if m:
            num = cn_to_int(m.group(1))
            if 1 <= num <= 50:
                matches.append((i, num))

    if not matches:
        return 0

    last_toc_end = matches[0][0]
    prev_num = matches[0][1]
    prev_idx = matches[0][0]
    for idx, num in matches[1:]:
        gap = idx - prev_idx
        if gap < 50 and num > prev_num:
            last_toc_end = idx
            prev_num = num
            prev_idx = idx
        else:
            break
    return last_toc_end + 1


def extract_toc_titles(lines: list, body_start: int) -> dict:
    """从目录区（body_start 之前）提取章节号→标题字典。

    目录标题通常更完整准确（如"总论"vs页眉"总"、"战略选择"vs误识别"战略分析"）。
    """
    toc_titles = {}
    for i, line in enumerate(lines):
        if i >= body_start:
            break
        line_stripped = line.strip()
        m = CHAPTER_RE.match(line_stripped)
        if not m:
            continue
        num = cn_to_int(m.group(1))
        if num <= 0 or num > 50:
            continue
        title_raw = m.group(2).strip()
        title = clean_toc_title(title_raw)
        if title and len(title) >= 1 and num not in toc_titles:
            toc_titles[num] = title
    return toc_titles


def find_chapters(lines: list) -> list:
    """找出所有章节的最佳起始位置。

    v4 改进：用目录标题字典 + 标题相似度匹配，解决 OCR 章节号误识别。
    """
    body_start = find_body_start(lines)
    toc_titles = extract_toc_titles(lines, body_start)

    # 1. 收集正文区内的章节匹配
    occurrences = {}
    for i, line in enumerate(lines):
        if i < body_start:
            continue
        line_stripped = line.strip()
        m = CHAPTER_RE.match(line_stripped)
        if not m:
            continue
        ch_num_str = m.group(1)
        title_raw = m.group(2).strip()
        ch_num_int = cn_to_int(ch_num_str)
        if ch_num_int <= 0 or ch_num_int > 50:
            continue
        if is_toc_line(line_stripped):
            continue  # 跳过目录行（正文区一般无，保险起见）

        if ch_num_int not in occurrences:
            occurrences[ch_num_int] = []
        occurrences[ch_num_int].append({
            'idx': i,
            'title_raw': title_raw,
            'title_cleaned': clean_title(title_raw),
            'is_pure': is_pure_title(title_raw),
        })

    # 2. 对每个章节号，用标题匹配找最佳出现
    chapters = []
    for ch_num_int in sorted(occurrences.keys()):
        occs = occurrences[ch_num_int]
        expected_title = toc_titles.get(ch_num_int, '')

        best = None
        if expected_title:
            # 找标题最匹配的出现
            best_score = -1
            for occ in occs:
                score = title_similarity(expected_title, occ['title_cleaned'])
                if score > best_score:
                    best_score = score
                    best = occ
            # 若最佳相似度过低（<0.3），退化为取最早出现
            if best_score < 0.3:
                best = occs[0]
        else:
            # 无目录标题，取最早出现
            best = occs[0]

        # 标题选择：优先用目录标题（更完整），否则用清理后的页眉标题
        title = expected_title if expected_title else best['title_cleaned']

        # 若标题过短（<2字）且 OCR 拆行，尝试拼接下一行
        if len(title) < 2 and best['idx'] + 1 < len(lines):
            next_line = lines[best['idx'] + 1].strip()
            if next_line and not next_line.startswith('=====') and not CHAPTER_RE.match(next_line):
                next_clean = clean_title(next_line)
                if next_clean and len(next_clean) <= 20:
                    title = title + next_clean if title else next_clean

        chapters.append({
            'ch_num': ch_num_int,
            'title': title or '(标题待识别)',
            'toc_title': expected_title,
            'start_line': best['idx'] + 1,  # 1-based
            'occurrence_count': len(occs),
            'match_score': round(title_similarity(expected_title, best['title_cleaned']), 2) if expected_title else None,
        })

    # 3. 按位置排序（确保单调递增），计算 end_line
    chapters.sort(key=lambda c: c['start_line'])
    result = []
    for j, ch in enumerate(chapters):
        end = chapters[j + 1]['start_line'] if j + 1 < len(chapters) else len(lines) + 1
        ch['end_line'] = end
        ch['line_count'] = end - ch['start_line']
        result.append(ch)
    return result


def get_existing_chapters(subject: str, content_root: Path) -> list:
    """获取现有 .md 章节文件列表。"""
    subj_dir = SUBJECT_DIR[subject]
    subj_path = content_root / 'learn' / 'cpa' / subj_dir
    if not subj_path.exists():
        return []
    result = []
    for md_file in sorted(subj_path.glob('[0-9][0-9]-*.md')):
        m = re.match(r'^(\d+)-(.+)\.md$', md_file.name)
        if m:
            result.append({
                'weight': int(m.group(1)),
                'filename': md_file.name,
                'slug': m.group(2),
            })
    return result


def split_subject(subject: str, textbooks_dir: Path, content_root: Path, out_root: Path) -> dict:
    """切分单科教材。"""
    txt_file = textbooks_dir / f'{subject}.txt'
    if not txt_file.exists():
        print(f'  ✗ {subject}.txt not found')
        return None

    print(f'\n=== {subject} ===')
    lines = txt_file.read_text(encoding='utf-8').splitlines()
    print(f'  Total lines: {len(lines)}')

    body_start = find_body_start(lines)
    print(f'  正文起始（目录区结束）: L{body_start + 1}')

    chapters = find_chapters(lines)
    toc_count = sum(1 for c in chapters if c.get('toc_title'))
    print(f'  Found {len(chapters)} chapters (目录标题匹配 {toc_count}/{len(chapters)}):')

    out_dir = out_root / subject
    out_dir.mkdir(parents=True, exist_ok=True)

    # 清理旧文件
    for old in out_dir.glob('*.txt'):
        old.unlink()

    for ch in chapters:
        nn = f'{ch["ch_num"]:02d}'
        out_file = out_dir / f'{nn}.txt'
        ch_lines = lines[ch['start_line'] - 1: ch['end_line'] - 1]
        ch_text = '\n'.join(ch_lines)
        out_file.write_text(ch_text, encoding='utf-8')
        ch['size_kb'] = round(len(ch_text.encode('utf-8')) / 1024, 1)
        flag = ''
        if ch['size_kb'] < 1:
            flag = ' ⚠ 过小'
        elif ch['size_kb'] > 400:
            flag = ' ⚠ 过大'
        score_str = f' [score={ch["match_score"]}]' if ch.get('match_score') is not None and ch['match_score'] < 0.5 else ''
        print(f'    第{ch["ch_num"]:02d}章 {nn}.txt  {ch["size_kb"]:>8.1f}KB  (出现{ch["occurrence_count"]}次){flag}{score_str}  {ch["title"][:40]}')

    existing = get_existing_chapters(subject, content_root)
    print(f'  Existing .md chapters: {len(existing)}')

    return {
        'subject': subject,
        'subject_dir': SUBJECT_DIR[subject],
        'source_file': f'{subject}.txt',
        'source_lines': len(lines),
        'body_start_line': body_start + 1,
        'extracted_chapters': chapters,
        'existing_md_chapters': existing,
    }


def main():
    base = Path(__file__).parent
    textbooks_dir = base / 'textbooks'
    content_root = base.parent.parent / 'content'
    out_root = textbooks_dir

    print('=' * 70)
    print('CPA 教材章节切分 v4')
    print(f'输入: {textbooks_dir}')
    print(f'输出: {out_root}/<subject>/NN.txt')
    print(f'内容根: {content_root}')
    print('=' * 70)

    all_maps = {}
    for subject in SUBJECT_DIR:
        result = split_subject(subject, textbooks_dir, content_root, out_root)
        if result:
            all_maps[subject] = result

    map_file = base / 'chapter_map.json'
    with open(map_file, 'w', encoding='utf-8') as f:
        json.dump(all_maps, f, ensure_ascii=False, indent=2)
    print(f'\n{"=" * 70}')
    print(f'章节对齐表: {map_file}')
    print(f'共 {sum(len(m["extracted_chapters"]) for m in all_maps.values())} 章切分完成')

    print(f'\n{"=" * 70}')
    print('章节对齐预览（JC 教材章数 vs 现有 .md 章数）:')
    for subj, m in all_maps.items():
        jc_count = len(m['extracted_chapters'])
        md_count = len(m['existing_md_chapters'])
        diff = '✓' if jc_count == md_count else f'⚠ 差 {jc_count - md_count}'
        sizes = [c['size_kb'] for c in m['extracted_chapters']]
        small = sum(1 for s in sizes if s < 1)
        big = sum(1 for s in sizes if s > 400)
        warn = f' [过小:{small} 过大:{big}]' if small or big else ''
        print(f'  {subj:15s}  JC教材 {jc_count:3d} 章  vs  现有 .md {md_count:3d} 章  {diff}{warn}')


if __name__ == '__main__':
    main()
