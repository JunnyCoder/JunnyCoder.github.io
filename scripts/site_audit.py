#!/usr/bin/env python3
"""Crawl every generated page, resource and local link, then check HTTP routing."""
from collections import Counter
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import threading
import urllib.error
import urllib.request
from urllib.parse import unquote, urljoin, urlsplit

sys.dont_write_bytecode = True
from pages import QA, ROOT, SITE, SiteHandler, exact_path, inventory
from http.server import ThreadingHTTPServer

ORIGIN = "https://junny.dev/"
OPTIONAL = {"/assets/resume/resume_ko.jpdf.json", "/assets/resume/resume_en.jpdf.json"}
CSS_URL = re.compile(r"url\(\s*['\"]?([^\s'\")]+)['\"]?\s*\)|@import\s+['\"]([^'\"]+)['\"]", re.I)
JS_PATH = re.compile(r'''(['"`])((?:(?:\.\./|\./|/)?)(?:assets|tools|ssafy|css|js)/[^'"`<>\s${}]+\.(?:html|css|js|json|png|jpe?g|svg|webp|gif|woff2?)(?:\?[^'"`<>\s${}]*)?)\1''')
errors, warnings, refs, external, pages, inline_scripts = [], [], set(), set(), {}, []
script_owners = {}


def reference(owner, value, kind):
    if not value or value.startswith(("data:", "blob:", "mailto:", "tel:", "javascript:", "about:")):
        return
    resolved = urlsplit(urljoin(ORIGIN + owner, value))
    if resolved.scheme not in ("http", "https"):
        return
    if resolved.netloc not in ("junny.dev", "www.junny.dev", "junnycoder.github.io"):
        external.add(resolved.geturl())
        return
    refs.add((owner, resolved.path, resolved.fragment, kind))


class Page(HTMLParser):
    def __init__(self, name):
        super().__init__(convert_charrefs=True)
        self.name, self.ids = name, []
        self.lang = self.title = self.viewport = False
        self.in_style = self.in_script = False
        self.script_type, self.script_src, self.script_data = "", "", []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get("id"):
            self.ids.append(attrs["id"])
        if tag == "html":
            self.lang = bool(attrs.get("lang"))
        if tag == "title":
            self.title = True
        if tag == "meta" and attrs.get("name") == "viewport":
            self.viewport = True
        for attr in ("src", "href", "poster", "action"):
            if attrs.get(attr):
                reference(self.name, attrs[attr], f"{tag}[{attr}]")
        if attrs.get("srcset") and not attrs["srcset"].startswith("data:"):
            for item in attrs["srcset"].split(","):
                reference(self.name, item.strip().split()[0], f"{tag}[srcset]")
        for match in CSS_URL.finditer(attrs.get("style", "")):
            reference(self.name, match[1] or match[2], "inline CSS")
        if tag == "style":
            self.in_style = True
        if tag == "script":
            self.in_script = True
            self.script_data = []
            self.script_type, self.script_src = attrs.get("type", ""), attrs.get("src", "")
            if self.script_src:
                src = urlsplit(urljoin(ORIGIN + self.name, self.script_src))
                if src.netloc == "junny.dev":
                    script_owners.setdefault(unquote(src.path).lstrip("/"), set()).add(self.name)

    def handle_data(self, data):
        if self.in_style:
            for match in CSS_URL.finditer(data):
                reference(self.name, match[1] or match[2], "CSS")
        if self.in_script:
            self.script_data.append(data)

    def handle_endtag(self, tag):
        if tag == "style":
            self.in_style = False
        if tag == "script" and self.in_script:
            source = "".join(self.script_data)
            if not self.script_src and self.script_type in ("", "text/javascript", "module", "application/javascript"):
                inline_scripts.append((self.name, source, self.script_type))
                for match in JS_PATH.finditer(source):
                    reference(self.name, match[2], "inline JavaScript")
            self.in_script = False


def resolve(route):
    target = exact_path(SITE, route)
    if target is not None and target.is_dir():
        target = exact_path(SITE, route.rstrip("/") + "/index.html")
    return target if target is not None and target.is_file() else None


def main():
    if not (SITE / "index.html").is_file():
        raise RuntimeError("Build first: python3 scripts/pages.py build")
    files = inventory(SITE)
    print(f"Scanning {len(files)} generated files...", flush=True)
    # Reading only a subset of routes can hide leaked source/development files.
    for entry in files:
        name = entry["path"]
        path = SITE / name
        if name.split("/")[0] in ("tests", "scripts", "docs", "node_modules", ".pages-qa") or \
                any(part.startswith(".") for part in Path(name).parts) or \
                path.suffix in (".md", ".cjs", ".py", ".lock", ".log") or \
                path.name in ("README.html", "log.html", "Gemfile", "package.json", "package-lock.json"):
            errors.append(f"Development file published: {name}")
        if path.suffix == ".html":
            source = path.read_text()
            if re.search(r"\{%\s*(?:include|assign|for|if)\b", source):
                errors.append(f"Unrendered Liquid: {name}")
            parser = Page(name)
            parser.feed(source)
            pages[name] = parser
            for field in ("lang", "title", "viewport"):
                if not getattr(parser, field):
                    errors.append(f"Missing {field}: {name}")
            for id_, count in Counter(parser.ids).items():
                if count > 1:
                    errors.append(f"Duplicate id #{id_}: {name}")
        elif path.suffix == ".css":
            source = re.sub(r"/\*.*?\*/", "", path.read_text(), flags=re.S)
            for match in CSS_URL.finditer(source):
                reference(name, match[1] or match[2], "CSS")
        elif path.suffix == ".json":
            try:
                json.loads(path.read_text())
            except (ValueError, UnicodeError) as error:
                errors.append(f"Invalid JSON {name}: {error}")
    for script, owners in script_owners.items():
        if not (SITE / script).is_file():
            continue
        for match in JS_PATH.finditer((SITE / script).read_text()):
            for owner in owners:
                reference(owner, match[2], f"JavaScript: {script}")
    for owner, route, fragment, kind in sorted(refs):
        target = resolve(route)
        if target is None:
            if route in OPTIONAL:
                warnings.append(f"Optional resume not supplied: {route}")
            else:
                errors.append(f"Missing/case-mismatched {kind}: {owner} -> {route}")
        elif fragment and target.suffix == ".html":
            page = pages.get(target.relative_to(SITE).as_posix())
            if page and unquote(fragment) not in page.ids and not fragment.startswith(":~:text="):
                errors.append(f"Missing anchor: {owner} -> {route}#{fragment}")
    for route in sorted(OPTIONAL):
        if resolve(route) is None:
            warnings.append(f"Optional resume not supplied: {route}")

    syntax_count = 0
    print(f"Checking {len(refs)} references and JavaScript syntax...", flush=True)
    with tempfile.TemporaryDirectory(prefix="syntax-", dir=QA) as scratch:
        to_check = [(p.relative_to(SITE).as_posix(), p) for p in SITE.rglob("*.js")]
        for index, (owner, source, type_) in enumerate(inline_scripts):
            path = Path(scratch) / f"inline-{index}{'.mjs' if type_ == 'module' else '.js'}"
            path.write_text(source)
            to_check.append((f"{owner} inline script {index}", path))
        for owner, path in to_check:
            result = subprocess.run(["node", "--check", str(path)], capture_output=True, text=True, timeout=15)
            syntax_count += 1
            if result.returncode:
                errors.append(f"JavaScript syntax: {owner}\n{result.stderr}")

    # Exercise the same handler used for Safari. It rejects case mismatches on
    # macOS, returns real 404 responses, and never falls back to the home page.
    class QuietHandler(SiteHandler):
        quiet = True
    print(f"Checking HTTP responses ({syntax_count} scripts passed syntax checks)...", flush=True)
    with ThreadingHTTPServer(("127.0.0.1", 0), QuietHandler) as server:
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        origin = f"http://127.0.0.1:{server.server_port}"
        http_count = 0
        def status(route):
            nonlocal http_count
            http_count += 1
            try:
                with urllib.request.urlopen(origin + route, timeout=5) as response:
                    response.read()
                    return response.status, response.headers.get_content_type()
            except urllib.error.HTTPError as error:
                return error.code, error.headers.get_content_type()
        for entry in files:
            code, mime = status("/" + entry["path"])
            if http_count % 40 == 0:
                print(f"HTTP checks: {http_count}/{len(files)} files", flush=True)
            if code != 200:
                errors.append(f"HTTP {code}: /{entry['path']}")
            if entry["path"].endswith(".js") and mime not in ("text/javascript", "application/javascript"):
                errors.append(f"Incorrect JavaScript MIME: {entry['path']} ({mime})")
        for route in ("/", "/tools/", "/tools", "/ssafy/", "/ssafy", "/tools/markdown-editor.html?qa=1"):
            if status(route)[0] != 200:
                errors.append(f"Direct entry failed: {route}")
        for route in ("/missing-qa-page", "/tools/missing-qa-page.html", "/INDEX.html", "/Tools/", "/.git/config", "/%2e%2e/index.html"):
            if status(route)[0] != 404:
                errors.append(f"Expected 404: {route}")
        server.shutdown()
        thread.join(timeout=5)
    report = {"files": len(files), "html_pages": len(pages), "references": len(refs),
              "javascript_checks": syntax_count, "http_checks": http_count,
              "routes": sorted("/" + p for p in pages),
              "external_urls": sorted(external), "warnings": sorted(set(warnings)), "errors": errors}
    (QA / "audit.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(f"Checked {len(files)} files, {len(pages)} pages, {len(refs)} references, {syntax_count} scripts, {http_count} HTTP routes.")
    for warning in report["warnings"]:
        print("NOTE:", warning)
    for error in errors:
        print("FAIL:", error)
    if errors:
        sys.exit(1)
    print("PASS: complete artifact crawl, local links/anchors, case-sensitive routing, syntax and deployment exclusions.")


if __name__ == "__main__":
    main()
