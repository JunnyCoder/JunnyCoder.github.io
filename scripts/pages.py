#!/usr/bin/env python3
"""Build with the deployed Pages image and serve only its generated artifact."""
import argparse
import hashlib
import http.server
import json
import mimetypes
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import time
from urllib.parse import quote, unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
# Repeated delete/rebuild operations in iCloud Desktop/Documents can resurrect
# conflict copies and block reads. Keep macOS artifacts outside synced folders.
DEFAULT_QA = (Path(tempfile.gettempdir()) / "junny-pages-qa" /
              hashlib.sha256(str(ROOT).encode()).hexdigest()[:12]
              if sys.platform == "darwin" else ROOT / ".pages-qa")
QA = Path(os.environ.get("PAGES_QA_DIR", str(DEFAULT_QA))).expanduser().resolve()
if QA == ROOT or QA in ROOT.parents:
    raise RuntimeError("PAGES_QA_DIR must be a dedicated build directory, not a source directory.")
SITE = QA / "site"
CONFIG = json.loads((ROOT / "scripts/pages-image.json").read_text())


def run(command, **kwargs):
    return subprocess.run(command, check=True, cwd=ROOT, **kwargs)


def inventory(root):
    return [{"path": p.relative_to(root).as_posix(), "bytes": p.stat().st_size,
             "sha256": hashlib.sha256(p.read_bytes()).hexdigest()}
            for p in sorted(root.rglob("*")) if p.is_file()]


def check_sync_copies(paths):
    """Stop ambiguous numbered siblings before they become public URLs."""
    names = {Path(os.fsdecode(raw)) for raw in paths if raw}
    conflicts = []
    for rel in sorted(names):
        match = re.fullmatch(r"(.+) ([2-9][0-9]*|1[0-9]+)(\.[^.]+)", rel.name)
        if not match:
            continue
        canonical = rel.with_name(match[1] + match[3])
        if canonical in names and (ROOT / rel).is_file() and (ROOT / canonical).is_file():
            conflicts.append(rel.as_posix())
    if conflicts:
        raise RuntimeError("Possible synchronization conflict copies in deployment inputs: " +
                           ", ".join(conflicts) +
                           ". Preserve and review them outside the repository before building; "
                           "rename deliberately distinct files so their purpose is clear.")


def build():
    paths = run(["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"],
                stdout=subprocess.PIPE).stdout.split(b"\0")
    check_sync_copies(paths)
    QA.mkdir(parents=True, exist_ok=True)
    snapshot = QA / "source"
    for generated in (snapshot, SITE):
        if generated.exists():
            shutil.rmtree(generated)
        generated.mkdir()
    # A checkout contains tracked files; include nonignored new files so a local
    # change can be verified before committing it. Never copy ignored local gems,
    # stale _site, node_modules, or earlier QA artifacts into the build input.
    copied = set()
    for raw in paths:
        if not raw:
            continue
        rel = Path(os.fsdecode(raw))
        if rel.is_absolute() or ".." in rel.parts:
            raise RuntimeError(f"Unsafe source path: {rel}")
        source = ROOT / rel
        if source.is_symlink():
            raise RuntimeError(f"Resolve symlink before building: {rel}")
        if not source.is_file() or rel in copied:
            continue  # A tracked deletion is not part of the candidate checkout.
        dest = snapshot / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, dest)
        copied.add(rel)
    if not (snapshot / "index.html").is_file() or not (snapshot / "_config.yml").is_file():
        raise RuntimeError("index.html and _config.yml must be deployment inputs; check .gitignore.")
    revision = subprocess.run(["git", "rev-parse", "HEAD"], cwd=ROOT,
                              capture_output=True, text=True)
    revision = revision.stdout.strip() if revision.returncode == 0 else "local-uncommitted"
    source_manifest = inventory(snapshot)
    (QA / "source-manifest.json").write_text(json.dumps(source_manifest, indent=2) + "\n")
    command = ["docker", "run", "--rm", "--platform", CONFIG["platform"],
               "--mount", f"type=bind,source={snapshot},target=/github/workspace",
               "--mount", f"type=bind,source={SITE},target=/github/workspace/_site"]
    environment = {
        "GITHUB_WORKSPACE": "/github/workspace",
        "GITHUB_REPOSITORY": CONFIG["repository"],
        "GITHUB_API_URL": "https://api.github.com",
        "INPUT_SOURCE": ".", "INPUT_DESTINATION": "_site",
        "INPUT_VERBOSE": "true", "INPUT_FUTURE": "false",
        "INPUT_BUILD_REVISION": revision, "INPUT_TOKEN": "",
    }
    for key, value in environment.items():
        command += ["--env", f"{key}={value}"]
    command.append(CONFIG["image"])
    started = time.monotonic()
    print(f"Building {len(source_manifest)} source files with {CONFIG['image']}", flush=True)
    with (QA / "build.log").open("w") as log:
        try:
            run(command, stdout=log, stderr=subprocess.STDOUT, timeout=600)
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
            print((QA / "build.log").read_text())
            raise
    output_manifest = inventory(SITE)
    if not (SITE / "index.html").is_file():
        raise RuntimeError("The Pages build produced no index.html; see .pages-qa/build.log")
    (QA / "site-manifest.json").write_text(json.dumps(output_manifest, indent=2) + "\n")
    (QA / "build.json").write_text(json.dumps({**CONFIG, "revision": revision,
        "source_files": len(source_manifest), "output_files": len(output_manifest),
        "seconds": round(time.monotonic() - started, 2)}, indent=2) + "\n")
    print(f"PASS: Pages built {len(output_manifest)} files in {time.monotonic()-started:.1f}s. Log: {QA / 'build.log'}", flush=True)


def exact_path(root, url_path):
    """Case-sensitive lookup even on the default macOS filesystem."""
    try:
        decoded = unquote(url_path, errors="strict")
    except UnicodeError:
        return None
    if "\0" in decoded or "\\" in decoded:
        return None
    parts = decoded.split("/")
    if any(part in (".", "..") or part.startswith(".") for part in parts if part):
        return None
    current = root
    for part in filter(None, parts):
        if not current.is_dir() or part not in {p.name for p in current.iterdir()}:
            return None
        current = current / part
        if current.is_symlink():
            return None
    return current


class SiteHandler(http.server.BaseHTTPRequestHandler):
    root = SITE
    quiet = False
    resume_fixture = None

    def log_message(self, fmt, *args):
        if not self.quiet:
            super().log_message(fmt, *args)

    def do_HEAD(self):
        self.respond(False)

    def do_GET(self):
        self.respond(True)

    def respond(self, body):
        requested = urlsplit(self.path)
        target = exact_path(self.root, requested.path)
        if self.resume_fixture and requested.path in ("/assets/resume/resume_ko.jpdf.json", "/assets/resume/resume_en.jpdf.json"):
            target = self.resume_fixture
        status = 200
        if target is not None and target.is_dir():
            if not requested.path.endswith("/"):
                self.send_response(301)
                self.send_header("Location", quote(unquote(requested.path), safe="/") + "/" +
                                 ("?" + requested.query if requested.query else ""))
                self.send_header("Content-Length", "0")
                self.end_headers()
                return
            target = exact_path(self.root, requested.path + "index.html")
        if target is None or not target.is_file():
            status = 404
            target = exact_path(self.root, "/404.html")
        data = target.read_bytes() if target is not None and target.is_file() else b"404 Not Found\n"
        content_type = mimetypes.guess_type(str(target))[0] if target else "text/plain"
        if content_type and (content_type.startswith("text/") or content_type in ("application/javascript", "application/json")):
            content_type += "; charset=utf-8"
        self.send_response(status)
        self.send_header("Content-Type", content_type or "application/octet-stream")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        if body:
            self.wfile.write(data)


def require_build():
    if not (SITE / "index.html").is_file():
        raise RuntimeError("Build first: python3 scripts/pages.py build")


def audit():
    require_build()
    run([sys.executable, str(ROOT / "scripts/site_audit.py")], timeout=120)


def test():
    require_build()
    if not (ROOT / "tests/editor-qa/node_modules/jsdom").is_dir():
        raise RuntimeError("Install QA dependencies first: npm ci --prefix tests/editor-qa")
    env = {**os.environ, "SITE_ROOT": str(SITE), "PAGES_QA_DIR": str(QA)}
    print("Running four regression suites against the Pages artifact...", flush=True)
    with (QA / "test.log").open("w") as log:
        try:
            run(["node", "tests/editor-qa/run.cjs"], env=env, timeout=390,
                stdout=log, stderr=subprocess.STDOUT)
        finally:
            log.flush()
            print((QA / "test.log").read_text(), end="", flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["build", "audit", "test", "qa", "serve", "fixtures", "paths"])
    parser.add_argument("--port", type=int, default=8880)
    parser.add_argument("--resume-fixture", type=Path, help="QA only: serve a sample project at the two resume URLs without modifying the artifact")
    args = parser.parse_args()
    if args.command in ("build", "qa"):
        build()
    if args.command in ("audit", "qa"):
        audit()
    if args.command in ("test", "qa"):
        test()
    if args.command == "paths":
        print(json.dumps({"source": str(ROOT), "qa": str(QA), "site": str(SITE)}, indent=2))
    if args.command == "fixtures":
        require_build()
        run(["node", "tests/editor-qa/make-fixtures.cjs"], timeout=90,
            env={**os.environ, "SITE_ROOT": str(SITE), "PAGES_QA_DIR": str(QA)})
    if args.command == "serve":
        require_build()
        if args.resume_fixture:
            SiteHandler.resume_fixture = args.resume_fixture.resolve(strict=True)
            print(f"QA fixture override enabled: {SiteHandler.resume_fixture}", flush=True)
        with http.server.ThreadingHTTPServer(("127.0.0.1", args.port), SiteHandler) as server:
            print(f"Serving Pages artifact: http://127.0.0.1:{args.port}/", flush=True)
            server.serve_forever()


if __name__ == "__main__":
    try:
        main()
    except (OSError, RuntimeError, subprocess.SubprocessError) as error:
        print(f"FAIL: {error}", file=sys.stderr)
        sys.exit(1)
