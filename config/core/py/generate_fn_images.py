import sys
import os
import re
import math
import random
from PIL import Image, ImageDraw, ImageFont

def distort_image(img, seed_val):
    random.seed(seed_val)
    width, height = img.size
    pixels = img.load()
    new_img = Image.new('RGBA', (width, height), (255, 255, 255, 0))
    new_pixels = new_img.load()
    # Wave distortion
    amp = random.uniform(0.5, 1.0)
    freq = random.uniform(0.04, 0.08)
    for y in range(height):
        shift = int(amp * math.sin(freq * y + random.uniform(0, 6.28)))
        for x in range(width):
            src_x = x - shift
            if 0 <= src_x < width:
                new_pixels[x, y] = pixels[src_x, y]
    # Thin crossing lines
    draw = ImageDraw.Draw(new_img)
    for _ in range(2):
        x1 = random.randint(0, width // 3)
        x2 = random.randint(width * 2 // 3, width)
        y1 = random.randint(height // 4, height * 3 // 4)
        y2 = random.randint(height // 4, height * 3 // 4)
        draw.line([(x1, y1), (x2, y2)], fill=(100, 100, 100, 150), width=1)
    return new_img

def generate_image(text, output_path, seed_val):
    try:
        font = ImageFont.truetype('/usr/share/fonts/dejavu/DejaVuSansMono.ttf', 20)
    except:
        try:
            font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', 20)
        except:
            font = ImageFont.load_default()
    bbox = font.getbbox(text)
    w = bbox[2] - bbox[0] + 6
    h = bbox[3] - bbox[1] + 6
    img = Image.new('RGBA', (w, h), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    draw.text((3, 3 - bbox[1]), text, font=font, fill=(30, 30, 30, 255))
    img = distort_image(img, seed_val)
    img.save(output_path, 'PNG')

def main():
    if len(sys.argv) != 3:
        print(f'Usage: {sys.argv[0]} <mapping.tex> <output_dir>')
        sys.exit(1)
    mapping_file = sys.argv[1]
    output_dir = sys.argv[2]
    if not os.path.exists(mapping_file):
        print('  No mapping file — skipping image generation')
        sys.exit(0)
    os.makedirs(output_dir, exist_ok=True)
    with open(mapping_file, 'r') as f:
        content = f.read()
    names = re.findall(r'fn_images/([^.]+)\.png', content)
    names = list(set(names))
    for i, name in enumerate(sorted(names)):
        output_path = os.path.join(output_dir, f'{name}.png')
        generate_image(name, output_path, hash(name) + i)
    print(f'  Generated {len(names)} distorted images')

if __name__ == '__main__':
    main()
