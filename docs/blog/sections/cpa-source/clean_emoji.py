"""
批量清理 CPA 顶层文件和 _index.md 的 emoji + icon 字段 + 难度星级。

处理内容：
1. 去掉 front matter 中的 icon 字段
2. 去掉正文所有 emoji（📒📊📚🎯📖📕📗📘📙📝⭐✅❌⚠️ 等）
3. 难度星级 ⭐⭐⭐⭐⭐ -> 5，⭐⭐ -> 2 等
4. ✅ -> 是，❌ -> 否，⚠️ -> 注意：
5. 清理多余空格和空行
"""

import re
from pathlib import Path

# emoji Unicode 范围
EMOJI_RE = re.compile(
    '['
    '\U0001F1E6-\U0001F1FF'  # 旗帜
    '\U0001F300-\U0001F9FF'  # 符号和象形文字
    '\U00002600-\U000026FF'  # 杂项符号（含 ⭐）
    '\U00002700-\U000027BF'  # 印刷符号
    '\U0000FE00-\U0000FE0F'  # 变体选择符
    '\U0001F000-\U0001F02F'  # 麻将牌
    '\U0001F0A0-\U0001F0FF'  # 扑克牌
    ']'
)

# 要处理的文件列表
CPA_ROOT = Path(r'c:\Users\26516\Desktop\n8n\blog-static\content\learn\cpa')
TARGET_FILES = [
    CPA_ROOT / '_index.md',
    CPA_ROOT / '01-overview.md',
    CPA_ROOT / '08-comprehensive.md',
    CPA_ROOT / '02-accounting' / '_index.md',
    CPA_ROOT / '03-audit' / '_index.md',
    CPA_ROOT / '04-fm' / '_index.md',
    CPA_ROOT / '05-strategy' / '_index.md',
    CPA_ROOT / '06-economic-law' / '_index.md',
    CPA_ROOT / '07-tax-law' / '_index.md',
]


def clean_content(text: str) -> str:
    """清理文件内容：去 emoji、icon 字段、星级转数字。"""
    # 1. 分离 front matter 和正文
    fm_match = re.match(r'^(---\n.*?\n---\n)(.*)$', text, re.DOTALL)
    if not fm_match:
        # 无 front matter，直接清理正文
        return clean_body(text)

    front_matter = fm_match.group(1)
    body = fm_match.group(2)

    # 2. 去掉 front matter 中的 icon 字段
    front_matter = re.sub(r'^icon:\s*".*"\s*$\n', '', front_matter, flags=re.MULTILINE)
    front_matter = re.sub(r'^icon:\s*\S+\s*$\n', '', front_matter, flags=re.MULTILINE)

    # 3. 清理正文
    body = clean_body(body)

    return front_matter + body


def clean_body(body: str) -> str:
    """清理正文：难度星级转数字、去 emoji、清理空格。"""
    # 1. 难度星级转数字（先处理，因为 ⭐ 在 emoji 范围内）
    def stars_to_num(m):
        count = m.group(0).count('⭐')
        return str(count)
    body = re.sub(r'⭐+', stars_to_num, body)

    # 2. 特殊符号替换
    body = body.replace('✅', '是')
    body = body.replace('❌', '否')
    body = body.replace('⚠️', '注意：')
    body = body.replace('⚠', '注意：')

    # 3. 去掉所有 emoji
    body = EMOJI_RE.sub('', body)

    # 4. 清理 emoji 删除后留下的多余空格
    # "##  科目信息" -> "## 科目信息"
    body = re.sub(r'^(#{1,6})\s+', r'\1 ', body, flags=re.MULTILINE)
    # "> **会计** ... " 多余空格
    body = re.sub(r'  +', ' ', body)
    # 行首空格后的多余空格
    body = re.sub(r'^ +', '', body, flags=re.MULTILINE)

    # 5. 清理多余空行（3+ 连续空行 -> 2 空行）
    body = re.sub(r'\n{3,}', '\n\n', body)

    # 6. 清理行尾空格
    body = re.sub(r' +\n', '\n', body)

    return body


def main():
    print('=' * 60)
    print('CPA 文件 emoji 清理')
    print('=' * 60)

    total_changes = 0
    for f in TARGET_FILES:
        if not f.exists():
            print(f'  ✗ {f.name} 不存在，跳过')
            continue

        original = f.read_text(encoding='utf-8')
        emoji_count = len(EMOJI_RE.findall(original)) + original.count('⭐') + original.count('✅') + original.count('❌') + original.count('⚠')
        has_icon = bool(re.search(r'^icon:\s*', original, re.MULTILINE))

        cleaned = clean_content(original)

        if cleaned != original:
            f.write_text(cleaned, encoding='utf-8')
            changes = f'去 emoji {emoji_count} 个' + ('，去 icon 字段' if has_icon else '')
            print(f'  ✓ {f.relative_to(CPA_ROOT)}  ({changes})')
            total_changes += 1
        else:
            print(f'  - {f.relative_to(CPA_ROOT)}  (无需修改)')

    print(f'\n共修改 {total_changes} 个文件')


if __name__ == '__main__':
    main()
