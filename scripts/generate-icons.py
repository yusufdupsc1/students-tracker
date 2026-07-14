#!/usr/bin/env python3
"""Generate PWA icons for Bejkhonda School Tracker."""

from PIL import Image, ImageDraw, ImageFont
import os

# School colors from tailwind config
RED = '#811B22'
GREEN = '#006a4e'
WHITE = '#ffffff'
GOLD = '#D4AF37'

OUTPUT_DIR = 'public/icons'
os.makedirs(OUTPUT_DIR, exist_ok=True)


def create_icon(size, maskable=False):
    """Create a PWA icon with school branding."""
    img = Image.new('RGB', (size, size), GREEN)
    draw = ImageDraw.Draw(img)
    
    # Draw a white circle/book shape in center
    padding = size // 8
    circle_size = size - (padding * 2)
    
    # Outer circle (white background)
    draw.ellipse(
        [padding, padding, padding + circle_size, padding + circle_size],
        fill=WHITE
    )
    
    # Inner green circle
    inner_padding = size // 4
    inner_size = size - (inner_padding * 2)
    draw.ellipse(
        [inner_padding, inner_padding, inner_padding + inner_size, inner_padding + inner_size],
        fill=GREEN
    )
    
    # Draw a simple book/school icon using lines
    center = size // 2
    line_width = max(2, size // 16)
    
    # Book spine
    draw.line(
        [(center, inner_padding + inner_size // 4), (center, inner_padding + inner_size * 3 // 4)],
        fill=WHITE,
        width=line_width
    )
    
    # Book pages (left)
    draw.line(
        [(center - inner_size // 4, inner_padding + inner_size // 3), (center, inner_padding + inner_size // 4)],
        fill=WHITE,
        width=line_width
    )
    draw.line(
        [(center - inner_size // 4, inner_padding + inner_size * 2 // 3), (center, inner_padding + inner_size * 3 // 4)],
        fill=WHITE,
        width=line_width
    )
    
    # Book pages (right)
    draw.line(
        [(center + inner_size // 4, inner_padding + inner_size // 3), (center, inner_padding + inner_size // 4)],
        fill=WHITE,
        width=line_width
    )
    draw.line(
        [(center + inner_size // 4, inner_padding + inner_size * 2 // 3), (center, inner_padding + inner_size * 3 // 4)],
        fill=WHITE,
        width=line_width
    )
    
    # Add school initials "বেজ" (first letter of বেজখণ্ড)
    try:
        # Try to use a Bengali font if available
        font_size = size // 3
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', font_size)
    except:
        font = ImageFont.load_default()
    
    text = 'ব'
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = center - text_width // 2
    y = center - text_height // 2 - size // 10
    
    draw.text((x, y), text, fill=WHITE, font=font)
    
    # For maskable icons, ensure important content is within safe zone
    if maskable:
        # Add a small border to ensure content is visible
        border = size // 16
        draw.rectangle(
            [border, border, size - border, size - border],
            outline=WHITE,
            width=2
        )
    
    return img


def main():
    sizes = [
        (192, 'icon-192.png', False),
        (512, 'icon-512.png', False),
        (512, 'icon-512-maskable.png', True),
    ]
    
    for size, filename, maskable in sizes:
        img = create_icon(size, maskable)
        path = os.path.join(OUTPUT_DIR, filename)
        img.save(path, 'PNG')
        print(f'Created {path} ({size}x{size})')
    
    print('\nPWA icons generated successfully!')


if __name__ == '__main__':
    main()
