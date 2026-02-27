#!/usr/bin/env python3
"""
migrate.py – MkDocs Material → Hugo/Hextra migration script

Clones moshthesubnet/my-lab-docs, converts all Markdown content,
and writes it into this Hugo project's content/ tree.

Usage:
    python3 migrate.py                          # clone from GitHub (default)
    python3 migrate.py --source /path/to/repo  # use an existing local clone
    python3 migrate.py --dest /path/to/site    # override Hugo root (default: script dir)
"""

import argparse
import re
import shutil
import subprocess
import sys
import tempfile
import textwrap
from pathlib import Path

try:
    import yaml
except ImportError:
    sys.exit("PyYAML is required: pip3 install pyyaml")

# ─── Constants ────────────────────────────────────────────────────────────────

REPO_URL   = "https://github.com/moshthesubnet/my-lab-docs.git"
SCRIPT_DIR = Path(__file__).resolve().parent  # /home/skyler/website

# MkDocs admonition type → (Hextra callout type, default display title)
# Hextra supports: "" (neutral), "info", "warning", "error"
ADMON_MAP: dict[str, tuple[str, str]] = {
    "note":      ("",        "Note"),
    "info":      ("info",    "Info"),
    "tip":       ("info",    "Tip"),
    "hint":      ("info",    "Hint"),
    "warning":   ("warning", "Warning"),
    "caution":   ("warning", "Caution"),
    "attention": ("warning", "Attention"),
    "danger":    ("error",   "Danger"),
    "error":     ("error",   "Error"),
    "bug":       ("error",   "Bug"),
    "failure":   ("error",   "Failure"),
    "fail":      ("error",   "Fail"),
    "success":   ("info",    "Success"),
    "check":     ("info",    "Check"),
    "done":      ("info",    "Done"),
    "question":  ("",        "Question"),
    "faq":       ("",        "FAQ"),
    "quote":     ("",        "Quote"),
    "abstract":  ("info",    "Abstract"),
    "summary":   ("info",    "Summary"),
    "example":   ("",        "Example"),
}

# Sections to guarantee _index.md files for (relative to hugo root)
SECTION_DEFS: list[tuple[str, str, int]] = [
    # (path,                      title,           weight)
    ("content/docs",          "Documentation", 1),
    ("content/docs/lab",      "My Lab",        1),
    ("content/docs/guides",   "Guides",        2),
    ("content/docs/projects", "Projects",      3),
]


# ─── Source repo ──────────────────────────────────────────────────────────────

def clone_repo(dest: Path) -> None:
    print(f"  Cloning {REPO_URL} …")
    subprocess.run(
        ["git", "clone", "--depth=1", REPO_URL, str(dest)],
        check=True,
    )


# ─── Nav weight extraction ────────────────────────────────────────────────────

def load_nav_weights(mkdocs_yml: Path) -> dict[str, dict]:
    """
    Parse mkdocs.yml and return a mapping of docs-relative file path →
    {"title": str, "weight": int} based on nav order.
    """
    # mkdocs.yml uses !!python/name: tags (e.g. for emoji extension) that
    # SafeLoader rejects.  Register a multi-constructor that silently ignores
    # any Python-specific tag — we only need the nav key anyway.
    class _MkDocsLoader(yaml.SafeLoader):
        pass
    _MkDocsLoader.add_multi_constructor(
        "tag:yaml.org,2002:python/",
        lambda loader, suffix, node: str(getattr(node, "value", "")),
    )

    with open(mkdocs_yml, encoding="utf-8") as f:
        cfg = yaml.load(f, Loader=_MkDocsLoader)

    result: dict[str, dict] = {}

    def walk(items: list) -> None:
        for i, item in enumerate(items):
            if not isinstance(item, dict):
                continue
            for title, value in item.items():
                weight = i + 1
                if isinstance(value, str):
                    result[value] = {"title": title, "weight": weight}
                elif isinstance(value, list):
                    walk(value)

    walk(cfg.get("nav") or [])
    return result


# ─── Front matter ─────────────────────────────────────────────────────────────

def update_frontmatter(text: str, title: str, weight: int) -> str:
    """Parse any existing front matter, inject/update title + weight, re-serialise."""
    fm_re = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)
    m = fm_re.match(text)

    if m:
        try:
            fm = yaml.safe_load(m.group(1)) or {}
        except Exception:
            fm = {}
        body = text[m.end():]
    else:
        fm = {}
        body = text

    fm.setdefault("title", title)
    fm["weight"] = weight

    serialised = yaml.dump(fm, default_flow_style=False, allow_unicode=True).strip()
    return f"---\n{serialised}\n---\n\n{body.lstrip()}"


# ─── Conversion helpers ───────────────────────────────────────────────────────

def _collect_indented(lines: list[str], start: int, indent: int = 4) -> tuple[list[str], int]:
    """
    Collect lines[start:] that are blank or indented ≥ `indent` spaces,
    stripping the leading indent.  Returns (body_lines, next_index).
    """
    body: list[str] = []
    i = start
    while i < len(lines):
        ln = lines[i]
        if ln == "" or ln.startswith(" " * indent) or ln.startswith("\t"):
            body.append(ln[indent:] if ln.startswith(" " * indent) else ln.lstrip("\t"))
            i += 1
        else:
            break
    # Trim trailing blank lines
    while body and body[-1].strip() == "":
        body.pop()
    return body, i


def convert_admonitions(text: str) -> str:
    """
    !!! type ["title"]  →  {{< callout [type="..."] >}} … {{< /callout >}}
    ??? type ["title"]  →  {{< details "title" >}} … {{< /details >}}
    """
    lines = text.split("\n")
    out: list[str] = []
    i = 0

    while i < len(lines):
        m = re.match(r'^(!{3}|\?{3})\s+(\w+)(?:\s+"([^"]*)")?\s*$', lines[i])
        if not m:
            out.append(lines[i])
            i += 1
            continue

        fence      = m.group(1)          # !!! or ???
        atype      = m.group(2).lower()
        ctitle     = m.group(3)          # explicit title string, or None

        i += 1
        body_lines, i = _collect_indented(lines, i)

        if fence == "!!!":
            hextype, default_title = ADMON_MAP.get(atype, ("", atype.capitalize()))
            opener = f'{{{{< callout type="{hextype}" >}}}}' if hextype else "{{< callout >}}"

            out.append(opener)
            # Emit bold custom title if one was provided
            if ctitle:
                out.append(f"**{ctitle}**")
                out.append("")
            out.extend(body_lines)
            out.append("{{< /callout >}}")

        else:   # ???  collapsible → details
            dtitle = ctitle if ctitle else atype.capitalize()
            out.append(f'{{{{< details "{dtitle}" >}}}}')
            out.extend(body_lines)
            out.append("{{< /details >}}")

        out.append("")

    return "\n".join(out)


def convert_tabs(text: str) -> str:
    """
    MkDocs Material tabbed content:
        === "Tab A"
            content A
        === "Tab B"
            content B

    →  Hextra tabs shortcode.
    """
    lines = text.split("\n")
    out: list[str] = []
    i = 0

    while i < len(lines):
        m = re.match(r'^=== "([^"]+)"', lines[i])
        if not m:
            out.append(lines[i])
            i += 1
            continue

        # Collect all consecutive === blocks into one tab group
        tabs: list[tuple[str, list[str]]] = []
        while i < len(lines):
            tm = re.match(r'^=== "([^"]+)"', lines[i])
            if not tm:
                break
            tab_name = tm.group(1)
            i += 1
            tab_body, i = _collect_indented(lines, i)
            tabs.append((tab_name, tab_body))

        out.append("{{< tabs >}}")
        for tab_name, tab_body in tabs:
            out.append(f'{{{{< tab "{tab_name}" >}}}}')
            out.extend(tab_body)
            out.append("{{< /tab >}}")
        out.append("{{< /tabs >}}")
        out.append("")

    return "\n".join(out)


def convert_links(text: str) -> str:
    """
    Convert internal .md links to Hugo-style URL slugs.

      [text](../dir/file.md)  →  [text](../dir/file/)
      [text](index.md)        →  [text](../)   (parent dir)
      [text](https://...)     →  unchanged
      [text](file.html)       →  unchanged (served from static/)
    """
    def repl(m: re.Match) -> str:
        anchor = m.group(1)
        url    = m.group(2)

        if url.startswith(("http://", "https://", "//", "#", "mailto:")):
            return m.group(0)
        if not url.endswith(".md"):
            return m.group(0)

        stripped = url[:-3]  # drop .md

        # foo/index.md or index.md → parent dir
        if stripped == "index" or stripped.endswith("/index"):
            parent = stripped[:-5].rstrip("/")
            url = (parent + "/") if parent else "./"
        else:
            url = stripped + "/"

        return f"[{anchor}]({url})"

    return re.sub(r"\[([^\]]*)\]\(([^)\s]+)\)", repl, text)


def strip_mkdocs_attrs(text: str) -> str:
    """Remove MkDocs attr_list button annotations: { .md-button ... }"""
    return re.sub(r"\s*\{\s*\.md-button[^}]*\}", "", text)


def convert_icons(text: str) -> str:
    """
    :material-guitar-electric:           →  (removed)
    [:fontawesome-brands-github: Label](url)  →  [Label](url)
    :fontawesome-brands-linkedin:        →  (removed)
    """
    # Icon inside a Markdown link's display text  →  keep label, drop icon
    text = re.sub(r"\[:(?:material|fontawesome)-[a-z0-9-]+:\s*([^\]]+)\]", r"[\1]", text)
    # Bare standalone icons
    text = re.sub(r":(?:material|fontawesome)-[a-z0-9-]+:", "", text)
    return text


def fix_image_paths(text: str) -> str:
    """
    Convert relative image src references to absolute /assets/... paths.
    Hugo serves static/ at the web root, so assets/logo.png → /assets/logo.png.
    """
    def repl_md(m: re.Match) -> str:
        alt, path = m.group(1), m.group(2)
        if path.startswith(("http://", "https://", "//", "/")):
            return m.group(0)
        norm = re.sub(r"^(?:\.\./)*", "", path)  # strip leading ../
        return f"![{alt}](/{norm})"

    text = re.sub(r"!\[([^\]]*)\]\(([^)\s]+)\)", repl_md, text)

    def repl_html(m: re.Match) -> str:
        full, src = m.group(0), m.group(1)
        if src.startswith(("http://", "https://", "//", "/")):
            return full
        norm = re.sub(r"^(?:\.\./)*", "", src)
        return full.replace(src, f"/{norm}", 1)

    text = re.sub(r'(?i)<img\b[^>]*\bsrc="([^"]+)"', repl_html, text)
    return text


# ─── File processing ──────────────────────────────────────────────────────────

def process_md(src: Path, dest: Path, title: str, weight: int) -> None:
    """Apply all transformations to one Markdown file and write to dest."""
    text = src.read_text(encoding="utf-8")

    text = convert_admonitions(text)
    text = convert_tabs(text)
    text = convert_links(text)
    text = strip_mkdocs_attrs(text)
    text = convert_icons(text)
    text = fix_image_paths(text)
    text = update_frontmatter(text, title, weight)

    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(text, encoding="utf-8")


def ensure_section_index(section_dir: Path, title: str, weight: int) -> None:
    """Create a minimal _index.md for a Hugo section if one doesn't exist."""
    idx = section_dir / "_index.md"
    if idx.exists():
        return
    idx.parent.mkdir(parents=True, exist_ok=True)
    fm = yaml.dump({"title": title, "weight": weight},
                   default_flow_style=False, allow_unicode=True).strip()
    idx.write_text(f"---\n{fm}\n---\n", encoding="utf-8")
    print(f"  created   {idx.relative_to(SCRIPT_DIR)}")


# ─── Asset handling ───────────────────────────────────────────────────────────

def copy_assets(docs_dir: Path, hugo_root: Path) -> None:
    static = hugo_root / "static"
    static.mkdir(exist_ok=True)

    # Images / SVG / favicon → static/assets/
    src_assets = docs_dir / "assets"
    if src_assets.exists():
        dst_assets = static / "assets"
        if dst_assets.exists():
            shutil.rmtree(dst_assets)
        shutil.copytree(src_assets, dst_assets)
        n = sum(1 for p in dst_assets.rglob("*") if p.is_file())
        print(f"  copied    static/assets/  ({n} files)")

    # Interactive HTML topology diagram → static/projects/
    html_src = docs_dir / "projects" / "network-topology-diagram.html"
    if html_src.exists():
        dst = static / "projects" / "network-topology-diagram.html"
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(html_src, dst)
        print("  copied    static/projects/network-topology-diagram.html")

    # MkDocs extra.css → assets/css/custom.css  (Hextra auto-includes this file)
    extra_css = docs_dir / "stylesheets" / "extra.css"
    if extra_css.exists():
        dst_css = hugo_root / "assets" / "css" / "custom.css"
        dst_css.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(extra_css, dst_css)
        print("  copied    assets/css/custom.css")

    # AOS library + extra.js → static/{css,js}/
    for rel, subdir in [
        ("stylesheets/aos.css",  "css"),
        ("javascripts/aos.js",   "js"),
        ("javascripts/extra.js", "js"),
    ]:
        f = docs_dir / rel
        if f.exists():
            dst = static / subdir / f.name
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(f, dst)
            print(f"  copied    static/{subdir}/{f.name}")


def create_aos_head_partial(hugo_root: Path) -> None:
    """
    Inject the AOS CSS/JS via Hextra's custom head partial override.
    Only creates the file if it doesn't already exist.
    """
    partial = hugo_root / "layouts" / "_partials" / "custom" / "head.html"
    if partial.exists():
        print("  skipped   layouts/_partials/custom/head.html  (already exists)")
        return
    partial.parent.mkdir(parents=True, exist_ok=True)
    partial.write_text(
        textwrap.dedent("""\
        {{- /* AOS (Animate On Scroll) – migrated from MkDocs */ -}}
        <link rel="stylesheet" href="/css/aos.css">
        <script src="/js/aos.js" defer></script>
        <script src="/js/extra.js" defer></script>
        """),
        encoding="utf-8",
    )
    print("  created   layouts/_partials/custom/head.html")


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    ap = argparse.ArgumentParser(description="Migrate MkDocs site to Hugo/Hextra")
    ap.add_argument("--source", help="Path to local MkDocs repo (skips git clone)")
    ap.add_argument("--dest",   default=str(SCRIPT_DIR), help="Hugo site root")
    args = ap.parse_args()

    hugo_root = Path(args.dest).resolve()

    # ── Source repo ───────────────────────────────────────────────────────────
    tmp_dir: Path | None = None
    if args.source:
        repo = Path(args.source).resolve()
    else:
        tmp_dir = Path(tempfile.mkdtemp(prefix="mkdocs_mig_"))
        repo = tmp_dir
        print("\n── Cloning source repo ──────────────────────────────────────────")
        clone_repo(repo)

    docs_dir   = repo / "docs"
    mkdocs_yml = repo / "mkdocs.yml"

    if not docs_dir.is_dir():
        sys.exit(f"Error: docs/ directory not found in {repo}")
    if not mkdocs_yml.is_file():
        sys.exit(f"Error: mkdocs.yml not found in {repo}")

    # ── Navigation weights ────────────────────────────────────────────────────
    print("\n── Reading nav from mkdocs.yml ─────────────────────────────────")
    weights = load_nav_weights(mkdocs_yml)
    print(f"  Found {len(weights)} navigation entries")

    # ── Assets ───────────────────────────────────────────────────────────────
    print("\n── Copying static assets ───────────────────────────────────────")
    copy_assets(docs_dir, hugo_root)

    # ── Custom head partial for AOS ───────────────────────────────────────────
    print("\n── Creating Hextra custom head partial ─────────────────────────")
    create_aos_head_partial(hugo_root)

    # ── Markdown files ────────────────────────────────────────────────────────
    print("\n── Migrating Markdown files ────────────────────────────────────")
    migrated = 0
    skipped  = 0

    for src in sorted(docs_dir.rglob("*.md")):
        rel     = src.relative_to(docs_dir)
        rel_str = rel.as_posix()

        nav_meta = weights.get(rel_str, {})
        title    = nav_meta.get("title") or " ".join(
            w.capitalize() for w in rel.stem.replace("-", "_").split("_")
        )
        weight   = nav_meta.get("weight", 99)

        # Routing: docs/index.md → content/_index.md (home page)
        #          everything else → content/docs/<original path>
        if rel_str == "index.md":
            dest = hugo_root / "content" / "_index.md"
        else:
            dest = hugo_root / "content" / "docs" / rel

        process_md(src, dest, title, weight)
        print(f"  migrated  {rel_str:<45} → {dest.relative_to(hugo_root)}")
        migrated += 1

    # ── Section _index.md files ───────────────────────────────────────────────
    print("\n── Ensuring section _index.md files ────────────────────────────")
    for rel_path, title, weight in SECTION_DEFS:
        ensure_section_index(hugo_root / rel_path, title, weight)

    # ── Cleanup ───────────────────────────────────────────────────────────────
    if tmp_dir:
        shutil.rmtree(tmp_dir, ignore_errors=True)

    # ── Summary ───────────────────────────────────────────────────────────────
    print(f"""
── Migration complete ───────────────────────────────────────────
  Migrated : {migrated} Markdown files
  Hugo root: {hugo_root}

── Manual review needed ─────────────────────────────────────────
  1. assets/css/custom.css
     The MkDocs extra.css uses Material-theme selectors (.md-typeset,
     .md-admonition, etc.) that don't exist in Hextra.  Update colour
     variables and remove/replace MkDocs-specific selectors.

  2. static/js/extra.js
     Queries '.md-content h1' etc. — update selectors to match
     Hextra's markup (e.g. '.content h1') for AOS to work correctly.

  3. content/_index.md  (home page)
     The original uses AOS <div> wrappers and MD-in-HTML.  Hugo's
     goldmark processes these with unsafe=true, but the Hextra home
     layout (hextra-home) is different from MkDocs Material.
     You may want to redesign it using Hextra card/hero shortcodes.

  4. :material-*: icons
     Stripped during migration (no direct equivalent in Hextra).
     Replace with text, emoji, or Hextra's built-in icon shortcode
     {{< icon "name" >}} where applicable.

  5. network-topology-diagram.html
     Copied to static/projects/network-topology-diagram.html.
     The link in the Markdown is left as-is (relative .html link).
     Verify the URL resolves correctly once the site is running.

  6. Run a build to catch any remaining issues:
     hugo server -D
""")


if __name__ == "__main__":
    main()
