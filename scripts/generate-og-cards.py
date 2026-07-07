#!/usr/bin/env python3
"""
Generate OG-style feature cards for blog post bundles, matching the project
card style: dark bg · teal left accent · bold serif title · description ·
tags · url watermark · "BLOG" label.

Writes content/blog/<slug>/og-card.png (referenced by each post's images:
frontmatter for og:image / twitter:image).

NOTE: must NOT write to feature.png — layouts/single.html globs *feature*
in the bundle and renders it as the in-article hero, so a card there
duplicates the title under the H1 (see commits 953c5c8 / 8385b41).

Usage:
    python3 scripts/generate-og-cards.py
    python3 scripts/generate-og-cards.py --dry-run   # don't write files
"""

import argparse
import re
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    sys.exit("Pillow not installed. Run: pip install Pillow")

# ── Paths ─────────────────────────────────────────────────────────────────────
ROOT         = Path(__file__).parent.parent
CONTENT_DIR  = ROOT / "content" / "blog"
FONT_SERIF_BOLD = "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf"
FONT_SANS       = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"

# ── Design tokens (match site: #111 bg, #5eead4 teal, muted grays) ────────────
BG         = (17,  17,  17)   # #111
ACCENT     = (94,  234, 212)  # #5eead4
WHITE      = (250, 250, 250)  # #fafafa
GRAY_DESC  = (163, 163, 163)  # #a3a3a3
GRAY_LABEL = (82,  82,  82)   # #525252
GRAY_TAG   = (82,  82,  82)
BORDER_TAG = (51,  51,  51)   # #333
GRAY_URL   = (64,  64,  64)   # #404040

W, H       = 1200, 630
MARGIN_L   = 80
MARGIN_R   = 80
TEXT_W     = W - MARGIN_L - MARGIN_R


# ── Helpers ───────────────────────────────────────────────────────────────────

def wrap_text(text, font, max_width, draw):
    """Word-wrap text to fit within max_width pixels."""
    words = text.split()
    lines, current = [], []
    for word in words:
        test = " ".join(current + [word])
        if draw.textbbox((0, 0), test, font=font)[2] <= max_width:
            current.append(word)
        else:
            if current:
                lines.append(" ".join(current))
            current = [word]
    if current:
        lines.append(" ".join(current))
    return lines


def draw_rounded_rect(draw, bbox, radius, outline, width=1):
    draw.rounded_rectangle(bbox, radius=radius, outline=outline, width=width)


# ── Card renderer ─────────────────────────────────────────────────────────────

def generate_card(title, description, tags, output_path, dry_run=False):
    img  = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)

    # Left teal accent border
    draw.rectangle([0, 0, 3, H], fill=ACCENT)

    # Load fonts
    f_title_lg = ImageFont.truetype(FONT_SERIF_BOLD, 72)
    f_title_md = ImageFont.truetype(FONT_SERIF_BOLD, 56)
    f_body     = ImageFont.truetype(FONT_SANS, 28)
    f_label    = ImageFont.truetype(FONT_SANS, 22)
    f_tag      = ImageFont.truetype(FONT_SANS, 21)
    f_url      = ImageFont.truetype(FONT_SANS, 21)

    # "BLOG" label — top right
    label      = "BLOG"
    label_w    = draw.textbbox((0, 0), label, font=f_label)[2]
    draw.text((W - MARGIN_R - label_w, 48), label, font=f_label, fill=GRAY_LABEL)

    # Title — try 72px, fall back to 56px if > 2 lines
    title_lines = wrap_text(title, f_title_lg, TEXT_W, draw)
    if len(title_lines) > 2:
        title_lines = wrap_text(title, f_title_md, TEXT_W, draw)
        f_title, line_h = f_title_md, 68
    else:
        f_title, line_h = f_title_lg, 88

    y = 130
    for line in title_lines[:3]:
        draw.text((MARGIN_L, y), line, font=f_title, fill=WHITE)
        y += line_h

    # Description
    if description:
        y += 24
        for line in wrap_text(description, f_body, TEXT_W - 80, draw)[:3]:
            draw.text((MARGIN_L, y), line, font=f_body, fill=GRAY_DESC)
            y += 40

    # Tag pills — pinned to bottom
    if tags:
        tag_y = H - 100
        tag_x = MARGIN_L
        for tag in tags[:4]:
            tw  = draw.textbbox((0, 0), tag, font=f_tag)[2]
            box = [tag_x, tag_y, tag_x + tw + 32, tag_y + 38]
            draw_rounded_rect(draw, box, radius=4, outline=BORDER_TAG, width=1)
            draw.text((tag_x + 16, tag_y + 8), tag, font=f_tag, fill=GRAY_TAG)
            tag_x += tw + 32 + 10

    # URL watermark
    draw.text((MARGIN_L, H - 44), "moshthesubnet.com", font=f_url, fill=GRAY_URL)

    if not dry_run:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        img.save(output_path, "PNG", optimize=True)

    return img


# ── Frontmatter parser ────────────────────────────────────────────────────────

def parse_frontmatter(text):
    if not text.startswith("---"):
        return {}
    end = text.find("---", 3)
    if end == -1:
        return {}
    fm = text[3:end]
    out = {}

    m = re.search(r'^title:\s*["\']?(.+?)["\']?\s*$', fm, re.MULTILINE)
    if m:
        out["title"] = m.group(1).strip("\"'")

    m = re.search(r'^description:\s*["\'](.+?)["\']?\s*$', fm, re.MULTILINE)
    if m:
        out["description"] = m.group(1).strip("\"'")

    # tags: inline ["a","b"] or list form
    tags = []
    m = re.search(r'^tags:\s*\[(.+?)\]', fm, re.MULTILINE)
    if m:
        tags = [t.strip().strip("\"'") for t in m.group(1).split(",")]
    else:
        m = re.search(r'^tags:\s*\n((?:\s+-\s+\S+.*\n?)+)', fm, re.MULTILINE)
        if m:
            tags = re.findall(r'-\s+(\S+)', m.group(1))
    out["tags"] = tags

    return out


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Generate blog post OG cards")
    parser.add_argument("--dry-run", action="store_true", help="Skip writing files")
    args = parser.parse_args()

    posts = sorted(CONTENT_DIR.glob("*/index.md"))
    if not posts:
        sys.exit(f"No post bundles found in {CONTENT_DIR}")

    print(f"Generating {len(posts)} cards into content/blog/<slug>/og-card.png\n")

    for post_path in posts:
        text = post_path.read_text()
        fm   = parse_frontmatter(text)

        if not fm.get("title"):
            print(f"  SKIP  {post_path.parent.name} — no title in frontmatter")
            continue

        slug        = post_path.parent.name
        output_path = post_path.parent / "og-card.png"

        print(f"  {'[dry]' if args.dry_run else ''}  {slug} → og-card.png")

        generate_card(
            title=fm["title"],
            description=fm.get("description", ""),
            tags=fm.get("tags", []),
            output_path=output_path,
            dry_run=args.dry_run,
        )

    print(f"\n{'Dry run — no files written.' if args.dry_run else 'Done.'}")


if __name__ == "__main__":
    main()
