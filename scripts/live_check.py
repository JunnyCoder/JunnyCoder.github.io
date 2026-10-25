#!/usr/bin/env python3
"""Read-only checks of the deployed domain and public portfolio references."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import subprocess
import sys

sys.dont_write_bytecode = True
from pages import QA, ROOT

ROUTES = ["/", "/tools", "/tools/", "/tools/markdown-editor.html",
          "/tools/pdf-maker.html", "/tools/self-testing-quiz-bank.html",
          "/ssafy", "/ssafy/", "/ssafy/lunchmate.html"]
URL_PATTERN = re.compile(r"https?://[^\s\"'<>`\\]+")


def check(item):
    url, expected = item
    result = subprocess.run(["curl", "--silent", "--show-error", "--location",
        "--max-time", "20", "--max-redirs", "8", "--proto", "=http,https",
        "--output", "/dev/null", "--write-out",
        "%{http_code}\n%{url_effective}\n%{num_redirects}\n%{content_type}\n%{ssl_verify_result}",
        url], capture_output=True, text=True, timeout=25)
    values = result.stdout.splitlines() + [""] * 5
    status = int(values[0]) if values[0].isdigit() else 0
    verdict = "pass" if result.returncode == 0 and status == expected else "fail"
    # Access restrictions do not prove that a public social/profile link is dead.
    if expected == 200 and status in (401, 403, 429, 999):
        verdict = "restricted"
    return {"url": url, "status": status, "expected": expected,
            "final_url": values[1], "redirects": values[2], "content_type": values[3],
            "tls_verify_result": values[4], "verdict": verdict,
            "error": result.stderr.strip() if result.returncode else ""}


def main():
    urls = {"https://junny.dev" + route: 200 for route in ROUTES}
    urls.update({"http://junny.dev/": 200, "https://junnycoder.github.io/": 200,
                 "https://junny.dev/qa-missing-page": 404})
    for url in URL_PATTERN.findall((ROOT / "index.html").read_text()):
        urls.setdefault(url, 200)
    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(check, sorted(urls.items())))
    QA.mkdir(parents=True, exist_ok=True)
    report = {"checked_at": datetime.now(timezone.utc).isoformat(),
              "scope": "Current public deployment; does not deploy local changes.", "results": results}
    (QA / "live.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    for row in results:
        print(f"{row['verdict'].upper()}: {row['status']} {row['url']} -> {row['final_url']}")
    print(f"Evidence: {QA / 'live.json'}")
    if any(row["verdict"] == "fail" for row in results):
        sys.exit(1)


if __name__ == "__main__":
    main()
