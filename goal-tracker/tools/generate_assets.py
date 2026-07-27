"""Regenerates every launcher, splash, favicon and link-preview asset from the app mark.

    python3 tools/generate_assets.py

Reads the drawing from tools/generate_icon.py, so the icon and the in-app emblem never
drift apart. Requires Pillow: pip install Pillow
"""
from PIL import Image, ImageDraw, ImageFont
import importlib.util, os, sys

TOOLS = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(TOOLS)

spec = importlib.util.spec_from_file_location('drg', os.path.join(TOOLS, 'generate_icon.py'))
drg = importlib.util.module_from_spec(spec)
sys.modules['drg'] = drg
spec.loader.exec_module(drg)

BG, PRIMARY, ACCENT, GOLD = drg.BG, drg.PRIMARY, drg.ACCENT, drg.GOLD
MUTED = (107, 86, 66, 255)
SS = drg.SS

SERIF_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'
SANS = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
SANS_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'


def make_icon(size, transparent=False, safe=1.0, simplified=False):
    canvas = size * SS
    img = Image.new('RGBA', (canvas, canvas), (0, 0, 0, 0) if transparent else BG)
    draw = ImageDraw.Draw(img)
    drg.draw_dragon(draw, canvas * 0.515, canvas * 0.550, canvas * safe * 0.84, simplified)
    return img.resize((size, size), Image.LANCZOS)


def make_og_cover():
    w, h = 1200, 630
    cw, ch = w * SS, h * SS
    img = Image.new('RGBA', (cw, ch), BG)
    draw = ImageDraw.Draw(img)

    drg.draw_dragon(draw, cw * 0.205, ch * 0.53, ch * 0.92, False)

    draw.line([(cw * 0.415, ch * 0.20), (cw * 0.415, ch * 0.80)],
              fill=(211, 189, 149, 255), width=round(cw * 0.0014))

    title_font = ImageFont.truetype(SERIF_BOLD, size=round(ch * 0.105))
    eyebrow_font = ImageFont.truetype(SANS_BOLD, size=round(ch * 0.036))
    tag_font = ImageFont.truetype(SANS, size=round(ch * 0.05))

    tx = cw * 0.462
    draw.text((tx, ch * 0.30), 'D O O R   T O   D O O R', font=eyebrow_font, fill=GOLD, anchor='lm')
    draw.text((tx, ch * 0.41), 'Goal Tracker', font=title_font, fill=PRIMARY, anchor='lm')
    draw.text((tx, ch * 0.565), 'Track sales, hit goals, and coach', font=tag_font, fill=MUTED, anchor='lm')
    draw.text((tx, ch * 0.565 + ch * 0.072), 'your team with AI.', font=tag_font, fill=MUTED, anchor='lm')

    return img.resize((w, h), Image.LANCZOS)


icon = make_icon(1024)
icon.convert('RGB').save(f'{REPO}/assets/images/icon.png')
icon.convert('RGB').resize((512, 512), Image.LANCZOS).save(f'{REPO}/public/icon-512.png')
icon.convert('RGB').resize((192, 192), Image.LANCZOS).save(f'{REPO}/public/icon-192.png')
icon.convert('RGB').resize((180, 180), Image.LANCZOS).save(f'{REPO}/public/apple-touch-icon.png')

make_icon(1024, transparent=True, safe=0.70).save(f'{REPO}/assets/images/adaptive-icon.png')
make_icon(1024, transparent=True, safe=0.82).save(f'{REPO}/assets/images/splash-icon.png')
make_icon(256, simplified=True).convert('RGB').save(f'{REPO}/assets/images/favicon.png')
make_og_cover().convert('RGB').save(f'{REPO}/public/og-cover.png')

print('all assets written')
