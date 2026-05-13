#!/usr/bin/env python3
"""
subset-font.py — Noto Sans TC 字型子集化腳本

對應 AIRE Phase 1 Group 8.1 — 把完整版 Noto Sans TC（~14MB）子集化為
「不動產說明書常用 5000 字」（目標 < 2MB），讓 PDF 嵌入字型體積可控。

使用前置：
    pip install fonttools[woff]
或
    pip install brotli zopfli fonttools

使用：
    # 1) 下載 Noto Sans TC Regular
    curl -L -o /tmp/NotoSansTC-Regular.otf \
        "https://github.com/notofonts/noto-cjk/raw/main/Sans/OTF/TraditionalChinese/NotoSansCJKtc-Regular.otf"

    # 2) 跑子集化（用 chars 清單檔）
    python3 scripts/subset-font.py \
        --input /tmp/NotoSansTC-Regular.otf \
        --output src/resources/fonts/NotoSansTC-Subset.ttf \
        --chars scripts/real-estate-chars.txt

    # 3) 確認大小 < 2MB
    ls -lh src/resources/fonts/NotoSansTC-Subset.ttf

字元集來源（scripts/real-estate-chars.txt）：
- 常用繁中 3500 字（依教育部統計）
- 不動產說明書專業詞彙 ~1000 字（地號、地段、權狀、坪、樓、棟、戶、區、市、縣 等）
- 數字 0-9、英數字、標點符號 ~500 字
- 總計 ~5000 字

備註：
- 若 fonttools 不可用，可改用 https://transfonter.org 線上子集化
- 子集化後的 TTF 給 pdf-lib `embedFont(subsetBytes)` 用
"""

import argparse
import sys
import pathlib


def main() -> int:
    parser = argparse.ArgumentParser(description="Noto Sans TC 子集化")
    parser.add_argument("--input", required=True, help="原始 OTF/TTF 路徑")
    parser.add_argument("--output", required=True, help="輸出子集化 TTF 路徑")
    parser.add_argument(
        "--chars",
        required=True,
        help="字元清單 txt 檔（UTF-8、可含換行與空白，會自動 dedupe）",
    )
    args = parser.parse_args()

    try:
        from fontTools.subset import Subsetter, Options
        from fontTools.ttLib import TTFont
    except ImportError:
        print(
            "✗ fontTools 未安裝，請先 `pip install fonttools[woff] brotli zopfli`",
            file=sys.stderr,
        )
        return 1

    input_path = pathlib.Path(args.input)
    output_path = pathlib.Path(args.output)
    chars_path = pathlib.Path(args.chars)

    if not input_path.exists():
        print(f"✗ 找不到輸入字型: {input_path}", file=sys.stderr)
        return 1
    if not chars_path.exists():
        print(f"✗ 找不到字元清單: {chars_path}", file=sys.stderr)
        return 1

    chars_text = chars_path.read_text(encoding="utf-8")
    chars = sorted(set(c for c in chars_text if c.strip()))
    print(f"字元數: {len(chars)}")

    font = TTFont(str(input_path))
    options = Options()
    options.flavor = None  # TTF（不壓縮）；如要 woff2 改 'woff2'
    options.layout_features = ["*"]  # 保留所有 OpenType features
    options.notdef_outline = True
    options.recalc_bounds = True
    options.recalc_timestamp = False

    subsetter = Subsetter(options=options)
    subsetter.populate(text="".join(chars))
    subsetter.subset(font)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    font.save(str(output_path))

    size_mb = output_path.stat().st_size / 1024 / 1024
    print(f"✓ 輸出: {output_path} ({size_mb:.2f} MB)")
    if size_mb > 2.0:
        print(f"⚠ 大於 2MB 目標，請審視 chars 清單", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
