#!/usr/bin/env python3
"""
全国図鑑(タイプ・種族値)キャッシュを再取得して scripts/data/national_dex_cache.json を更新する。

yakkun.com は Cloudflare で直接の curl/fetch をブロックするため、
r.jina.ai のリーダープロキシ経由で取得する。

使い方:
    python3 scripts/refresh_national_dex_cache.py

ネットワークアクセスが必要。取得できない場合は既存のキャッシュをそのまま使うこと。
"""
import json
import re
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

SOURCE_URL = "https://yakkun.com/ch/zukan/reg_mc/"  # どのレギュレーションページでも全国図鑑データは同じ
PROXY_URL = f"https://r.jina.ai/{SOURCE_URL}"
CACHE_PATH = Path(__file__).parent / "data" / "national_dex_cache.json"


def fetch(url: str) -> str:
    result = subprocess.run(
        ["curl", "-s", "-A", "Mozilla/5.0", url],
        capture_output=True, text=True, timeout=60,
    )
    if result.returncode != 0 or not result.stdout:
        raise RuntimeError(f"fetch failed: {url}")
    return result.stdout


def parse(markdown: str) -> dict:
    entries = re.findall(
        r"\*   (\d+):\s*\n\n(.*?)\n\n(\d+-\d+-\d+-\d+-\d+-\d+)", markdown
    )
    d = defaultdict(list)
    for num, types_raw, stats in entries:
        types = re.findall(r"!\[Image \d+: ([^\]]+?)タイプ\]", types_raw)
        h, a, b, c, dd, s = map(int, stats.split("-"))
        d[num].append(
            {"types": types, "base": {"hp": h, "atk": a, "def": b, "spa": c, "spd": dd, "spe": s}}
        )
    return d


def main():
    print(f"fetching {PROXY_URL} ...", file=sys.stderr)
    markdown = fetch(PROXY_URL)
    entries = parse(markdown)
    if len(entries) < 900:
        print(f"warning: only {len(entries)} dex numbers parsed (expected ~1025). "
              f"Site structure may have changed — check before overwriting cache.", file=sys.stderr)
        sys.exit(1)
    out = {
        "source": "yakkun.com national dex (via r.jina.ai proxy)",
        "entries": entries,
    }
    CACHE_PATH.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"wrote {len(entries)} dex numbers to {CACHE_PATH}", file=sys.stderr)


if __name__ == "__main__":
    main()
