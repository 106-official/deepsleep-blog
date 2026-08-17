"""诊断 accounting 第1-5章丢失 + strategy 第3章过大问题。"""
import re
from pathlib import Path

CHAPTER_RE = re.compile(r'^第([一二三四五六七八九十百零〇]+)章\s*(.*)')
PAGENUM_RE = re.compile(r'[\d\(（\[【]|G\d|C\d|B\d|D\d|R\d|GB|CB|G过|G3|C9|B日|D日|G阳|G38')
TOC_HINTS = ['…', '⋯', '...', '．．．', '。。。']


def is_toc_line(line):
    return any(h in line for h in TOC_HINTS)


def is_pure_title(title_part):
    if not title_part:
        return True
    return not bool(PAGENUM_RE.search(title_part))


def diagnose(subject, max_show=40):
    txt = Path(f'textbooks/{subject}.txt').read_text(encoding='utf-8').splitlines()
    print(f'\n{"="*70}')
    print(f'=== {subject}.txt ({len(txt)} lines) ===')

    # 找所有含"第X章"的行，标注是否页眉型
    print(f'\n前 {max_show} 个 "第X章" 匹配（标注纯标题/页眉型）:')
    hits = []
    for i, line in enumerate(txt):
        m = CHAPTER_RE.match(line.strip())
        if m:
            num = m.group(1)
            title = m.group(2).strip()
            pure = is_pure_title(title)
            toc = is_toc_line(line.strip())
            kind = 'TOC' if toc else ('PURE' if pure else 'HEAD')
            hits.append((i + 1, num, kind, title[:35], line.strip()[:55]))
    for ln, num, kind, title, content in hits[:max_show]:
        print(f'  L{ln:>6} [{kind:4}] 第{num}章 "{title}"  | {content}')

    # 统计每个章节号的 PURE/HEAD 分布
    print(f'\n各章节号 PURE/HEAD 分布:')
    stats = {}
    for ln, num, kind, title, content in hits:
        if num not in stats:
            stats[num] = {'PURE': 0, 'HEAD': 0, 'TOC': 0, 'first_line': ln, 'first_kind': kind}
        stats[num][kind] = stats[num].get(kind, 0) + 1
    for num in sorted(stats.keys(), key=lambda x: int(x.translate(str.maketrans('一二三四五六七八九十百零〇', '1234567891000')))):
        s = stats[num]
        print(f'  第{num}章: PURE={s.get("PURE",0)} HEAD={s.get("HEAD",0)} TOC={s.get("TOC",0)}  首次=L{s["first_line"]}({s["first_kind"]})')


# 中文数字排序辅助
def cn_sort_key(num_str):
    mapping = {'零':0,'〇':0,'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10}
    if num_str in mapping:
        return mapping[num_str]
    return 99


if __name__ == '__main__':
    diagnose('accounting', max_show=50)
    diagnose('strategy', max_show=50)
