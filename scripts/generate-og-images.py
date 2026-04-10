#!/usr/bin/env python3
"""
Generate dark OG title cards for writing posts, matching the project card style:
  - Near-black background
  - Teal left accent border
  - "WRITING" label top-right
  - Bold serif title
  - Description text
  - Tag pills
  - moshthesubnet.com watermark

Output: static/img/posts/{slug}-og.png
Usage:  python3 scripts/generate-og-images.py
"""

import os
import re
import textwrap
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# ── Config ────────────────────────────────────────────────────────────────────
W, H          = 1200, 630
BG            = (15, 15, 15)
ACCENT        = (94, 234, 212)   # teal #5eead4
BORDER_W      = 6
LABEL_COLOR   = (80, 80, 80)
TITLE_COLOR   = (250, 250, 250)
DESC_COLOR    = (163, 163, 163)
TAG_FG        = (163, 163, 163)
TAG_BORDER    = (50, 50, 50)
TAG_BG        = (22, 22, 22)
URL_COLOR     = (60, 60, 60)
WATERMARK     = "moshthesubnet.com"

PAD_L         = 80   # left content margin (after border)
PAD_R         = 80
PAD_TOP       = 70
TITLE_X       = PAD_L + BORDER_W + 20
TITLE_Y       = PAD_TOP + 30

FONT_TITLE    = "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf"
FONT_BODY     = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

CONTENT_DIR   = Path(__file__).parent.parent / "content" / "writing"
OUT_DIR       = Path(__file__).parent.parent / "static" / "img" / "posts"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# ── Helpers ───────────────────────────────────────────────────────────────────

def load_font(path, size):
    return ImageFont.truetype(path, size)


def parse_frontmatter(text):
    """Extract title, description, and tags from YAML frontmatter."""
    fm_match = re.match(r"^---\s*\n(.*?)\n---", text, re.DOTALL)
    if not fm_match:
        return {}, text
    fm_block = fm_match.group(1)

    title = re.search(r'^title:\s*["\']?(.*?)["\']?\s*$', fm_block, re.M)
    desc  = re.search(r'^description:\s*["\']?(.*?)["\']?\s*$', fm_block, re.M)

    # tags can be inline list or multiline
    tags = []
    inline = re.search(r'^tags:\s*\[([^\]]+)\]', fm_block, re.M)
    if inline:
        tags = [t.strip().strip('"\'') for t in inline.group(1).split(',')]
    else:
        block = re.search(r'^tags:\s*\n((?:\s*-\s+.+\n?)+)', fm_block, re.M)
        if block:
            tags = [re.sub(r'^\s*-\s+', '', l).strip() for l in block.group(1).strip().splitlines()]

    return {
        "title": title.group(1).strip() if title else "",
        "description": desc.group(1).strip() if desc else "",
        "tags": tags[:4],
    }


def wrap_title(draw, text, font, max_width):
    """Wrap title text to fit within max_width. Returns list of lines."""
    words = text.split()
    lines = []
    current = []
    for word in words:
        test = " ".join(current + [word])
        bbox = draw.textbbox((0, 0), test, font=font)
        if bbox[2] > max_width and current:
            lines.append(" ".join(current))
            current = [word]
        else:
            current.append(word)
    if current:
        lines.append(" ".join(current))
    return lines


def draw_tag_pill(draw, x, y, text, font):
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    px, py = 12, 6
    rect = [x, y, x + tw + px * 2, y + th + py * 2]
    draw.rounded_rectangle(rect, radius=4, fill=TAG_BG, outline=TAG_BORDER)
    draw.text((x + px, y + py), text, font=font, fill=TAG_FG)
    return rect[2] - rect[0]  # return width


# ── Card generator ────────────────────────────────────────────────────────────

def generate_card(meta, slug):
    img  = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)

    # Left accent border
    draw.rectangle([PAD_L, 0, PAD_L + BORDER_W, H], fill=ACCENT)

    # "WRITING" label top-right
    f_label = load_font(FONT_BODY, 22)
    draw.text((W - PAD_R, PAD_TOP), "WRITING", font=f_label, fill=LABEL_COLOR, anchor="ra")

    # Title
    f_title = load_font(FONT_TITLE, 72)
    max_title_w = W - TITLE_X - PAD_R - 20
    title_lines = wrap_title(draw, meta["title"], f_title, max_title_w)

    # Reduce font if too many lines
    if len(title_lines) > 3:
        f_title = load_font(FONT_TITLE, 56)
        title_lines = wrap_title(draw, meta["title"], f_title, max_title_w)

    line_h = draw.textbbox((0, 0), "Ag", font=f_title)[3] + 8
    for i, line in enumerate(title_lines):
        draw.text((TITLE_X, TITLE_Y + i * line_h), line, font=f_title, fill=TITLE_COLOR)

    title_bottom = TITLE_Y + len(title_lines) * line_h

    # Description
    if meta["description"]:
        f_desc  = load_font(FONT_BODY, 28)
        desc_y  = title_bottom + 30
        max_w   = W - TITLE_X - PAD_R
        all_lines = textwrap.wrap(meta["description"], width=55)
        truncated = len(all_lines) > 3
        wrapped = all_lines[:3]
        if truncated:
            wrapped[-1] = wrapped[-1].rstrip() + "…"
        desc_line_h = draw.textbbox((0, 0), "Ag", font=f_desc)[3] + 6
        for i, line in enumerate(wrapped):
            draw.text((TITLE_X, desc_y + i * desc_line_h), line, font=f_desc, fill=DESC_COLOR)

    # Tags
    if meta["tags"]:
        f_tag = load_font(FONT_BODY, 22)
        tag_y = H - 90
        tag_x = TITLE_X
        for tag in meta["tags"]:
            w = draw_tag_pill(draw, tag_x, tag_y, tag, f_tag)
            tag_x += w + 10

    # Watermark
    f_url = load_font(FONT_BODY, 20)
    draw.text((TITLE_X, H - 40), WATERMARK, font=f_url, fill=URL_COLOR)

    out_path = OUT_DIR / f"{slug}-og.png"
    img.save(out_path, "PNG", optimize=True)
    print(f"  ✓  {out_path.name}")
    return out_path


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    md_files = sorted(CONTENT_DIR.glob("*.md"))
    md_files = [f for f in md_files if f.name != "_index.md"]

    print(f"Generating {len(md_files)} writing post cards...\n")
    for md in md_files:
        slug = md.stem
        text = md.read_text(encoding="utf-8")
        meta = parse_frontmatter(text)
        if not meta.get("title"):
            print(f"  skip (no title): {md.name}")
            continue
        generate_card(meta, slug)

    print(f"\nDone. Images saved to {OUT_DIR.relative_to(Path(__file__).parent.parent)}/")


if __name__ == "__main__":
    main()
