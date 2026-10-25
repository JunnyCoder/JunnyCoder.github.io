#!/usr/bin/env python3
"""Check a Safari PDF made from the disposable document.md / resume fixture.

Requires Poppler. This checks content and page bounds; also inspect page PNGs.
"""
import argparse
import json
from pathlib import Path
import re
import subprocess
import xml.etree.ElementTree as ET


def output(*args):
    return subprocess.run(args, check=True, capture_output=True, text=True,
                          timeout=30).stdout


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf", type=Path)
    parser.add_argument("--pages", required=True, type=int)
    parser.add_argument("--image", action="store_true")
    args = parser.parse_args()
    file = str(args.pdf.resolve(strict=True))
    text = output("pdftotext", "-layout", file, "-")
    pages = ET.fromstring(output("pdftotext", "-bbox", file, "-")).findall(".//{*}page")
    assert len(pages) == args.pages, f"Expected {args.pages} pages, got {len(pages)}"
    for number, page in enumerate(pages, 1):
        width, height = float(page.attrib["width"]), float(page.attrib["height"])
        assert abs(width - 595.276) < 1 and abs(height - 841.89) < 1, "Select A4 paper"
        words = page.findall("{*}word")
        assert words, f"Unexpected blank page: {number}"
        for word in words:
            bounds = {k: float(word.attrib[k]) for k in ("xMin", "xMax", "yMin", "yMax")}
            assert bounds["xMin"] >= -1 and bounds["yMin"] >= -1, (number, word.text)
            assert bounds["xMax"] <= width + 1 and bounds["yMax"] <= height + 1, (number, word.text)
    records = [int(n) for n in re.findall(r'Record (\d+)', text)]
    assert records == list(range(1, 66)), "Code lines were lost, duplicated or reordered"
    for marker in ("QA Document", "한글 문서 검증", "Validation", "Merged cells", "END OF QA DOCUMENT."):
        assert marker in text, f"Missing content: {marker}"
    assert "PDF Maker" not in text, "Editor controls leaked into print"
    image_count = sum(bool(re.match(r"\s*\d+\s+\d+\s+image\s", line))
                      for line in output("pdfimages", "-list", file).splitlines())
    if args.image:
        assert image_count > 0 and "Embedded image fixture" in text, "Embedded image was lost"
    result = {"pdf": file, "pages": len(pages), "code_lines": len(records),
              "images": image_count, "a4": True, "blank_pages": 0, "text_within_page": True}
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
