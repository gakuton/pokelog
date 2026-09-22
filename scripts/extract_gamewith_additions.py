#!/usr/bin/env python3
"""
gamewith.jp の「内定ポケモン一覧」ページから、指定レギュレーションで
新規追加されたポケモン名を抽出する。

使い方:
    python3 scripts/extract_gamewith_additions.py <レギュレーション文字 例: C> [gamewith URL]

デフォルトURL: https://gamewith.jp/pokemon-champions/546414
(このURLはgamewithの記事IDなので、将来変わっていたらWebSearchで
「ポケモンチャンピオンズ 内定ポケモン一覧」を検索して最新のURLを渡すこと)

ページ内の該当レギュレーションの追加セクションは `id="new<文字>"`
(例: M-Cなら id="newC") というアンカーの後のテーブルに、
`<a href='...'>...alt='ポケモン名'...</a>` の形で並んでいる。
"""
import re
import subprocess
import sys


def fetch(url: str) -> str:
    result = subprocess.run(
        ["curl", "-s", "-A", "Mozilla/5.0", url],
        capture_output=True, text=True, timeout=60,
    )
    if result.returncode != 0 or not result.stdout:
        raise RuntimeError(f"fetch failed: {url}")
    return result.stdout


def extract(html: str, reg_letter: str) -> list[str]:
    anchor = f'id="new{reg_letter}"'
    start = html.find(anchor)
    if start == -1:
        raise RuntimeError(
            f"anchor {anchor} not found — page structure may have changed. "
            f"Fall back to fetching the yakkun.com reg_m{reg_letter.lower()} zukan page instead."
        )
    end = html.find("<h2>関連ページ</h2>", start)
    section = html[start: end if end != -1 else start + 40000]

    blocks = re.findall(r"<a href='[^']*' >(.*?)</a>", section, re.S)
    names = []
    for b in blocks:
        alts = re.findall(r"alt='([^']*)'", b)
        if alts:
            names.append(alts[0])
    return names


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    reg_letter = sys.argv[1].upper()
    url = sys.argv[2] if len(sys.argv) > 2 else "https://gamewith.jp/pokemon-champions/546414"

    html = fetch(url)
    names = extract(html, reg_letter)

    print(f"# {len(names)} entries found for M-{reg_letter} (includes mega forms; dedupe/filter manually)",
          file=sys.stderr)
    for n in names:
        print(n)


if __name__ == "__main__":
    main()
