"""Generate favicon PNGs from the simplified Switch Stack logo.

Uses Pillow to draw the four cascading bars at 16x16 and 32x32.
No ports or LEDs at favicon scale — just the bars with opacity fade.
"""

from PIL import Image, ImageDraw


def draw_switch_stack(size: int) -> Image.Image:
    """Draw the simplified switch stack favicon at the given size."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Teal color: #5eead4 = (94, 234, 212)
    teal = (94, 234, 212)

    # Four bars with opacity fade, scaled to fit the square
    # Bars occupy roughly 80% width, with cascade offset
    bar_count = 4
    opacities = [0.3, 0.5, 0.75, 1.0]

    # Geometry scaled to target size
    margin = round(size * 0.08)
    bar_height = round(size * 0.17)
    bar_width = round(size * 0.75)
    spacing = round((size - 2 * margin - bar_count * bar_height) / (bar_count - 1))
    cascade_step = round(size * 0.04)

    for i, opacity in enumerate(opacities):
        x = margin + (bar_count - 1 - i) * cascade_step
        y = margin + i * (bar_height + spacing)
        alpha = round(opacity * 255)
        color = (*teal, alpha)
        draw.rectangle([x, y, x + bar_width, y + bar_height], fill=color)

    return img


if __name__ == "__main__":
    # Generate 16x16
    img_16 = draw_switch_stack(16)
    img_16.save("static/assets/favicon.png")
    print("Generated static/assets/favicon.png (16x16)")

    # Generate 32x32
    img_32 = draw_switch_stack(32)
    img_32.save("static/assets/favicon-32.png")
    print("Generated static/assets/favicon-32.png (32x32)")
