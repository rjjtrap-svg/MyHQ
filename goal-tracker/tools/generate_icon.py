"""The ouroboros dragon app mark, drawn procedurally.

This is the single source of truth for the logo. `draw_dragon()` renders it at any size;
`tools/generate_assets.py` imports this module to write every icon/splash/favicon/OG file.
The inline SVG version in src/components/Emblem.tsx is generated from this same geometry —
if you change the drawing here, regenerate that too (see generate_assets.py).

    python3 tools/generate_icon.py        # writes previews next to this file
    python3 tools/generate_assets.py      # writes the real asset files

Requires Pillow: pip install Pillow
"""
from PIL import Image, ImageDraw
import math
import os

# Dark-first palette. The dragon stays warm gold so the mark is still recognisably the
# same drawing, and gold-on-charcoal is what keeps this reading as a premium performance
# app rather than a generic dark dashboard. Linework stays near-black: inside the body it
# separates the scale plates, and at the silhouette edge it simply vanishes into the
# background, which lets the mark float.
BG = (14, 16, 20, 255)          # #0E1014, matches colors.background
PRIMARY = (176, 128, 52, 255)   # body base
ACCENT = (224, 169, 59, 255)    # scale highlights, head — colors.gold
GOLD = (255, 199, 94, 255)      # horns, whiskers, claws
DEEP = (10, 11, 14, 255)        # all linework
LIGHT = (245, 226, 178, 255)    # belly plates
MID = (140, 100, 42, 255)       # mid-tone for scale shading

SS = 4
OUT = os.path.dirname(os.path.abspath(__file__))

TAIL_DEG = 66.0
SWEEP_DEG = 318.0


def theta(t):
    return math.radians(TAIL_DEG - t * SWEEP_DEG)


def radius_at(t):
    """The spine wanders off a perfect circle — a mechanically round ring reads as a
    washer, a slight undulation reads as an animal holding a coil."""
    return 0.315 + 0.016 * math.sin(t * math.pi * 3.0) - 0.010 * math.sin(t * math.pi * 1.0)


def half_width(t):
    """Whip-thin at the tail, thickest just behind the skull, easing off at the neck."""
    return 0.010 + 0.052 * (t ** 0.75) * (1.0 - 0.18 * max(0.0, t - 0.86) / 0.14)


def spine_point(t):
    th, r = theta(t), radius_at(t)
    return (0.5 + r * math.cos(th), 0.5 - r * math.sin(th))


def tangent(t, eps=1e-4):
    ax, ay = spine_point(max(0.0, t - eps))
    bx, by = spine_point(min(1.0, t + eps))
    dx, dy = bx - ax, by - ay
    n = math.hypot(dx, dy) or 1.0
    return dx / n, dy / n


def normal(t):
    """Outward (away from the ring centre)."""
    tx, ty = tangent(t)
    nx, ny = -ty, tx
    px, py = spine_point(t)
    if nx * (px - 0.5) + ny * (py - 0.5) < 0:
        nx, ny = -nx, -ny
    return nx, ny


def body_polygon(n=240):
    outer, inner = [], []
    for i in range(n + 1):
        t = i / n
        cx, cy = spine_point(t)
        nx, ny = normal(t)
        w = half_width(t)
        outer.append((cx + nx * w, cy + ny * w))
        inner.append((cx - nx * w, cy - ny * w))
    return outer + inner[::-1]


def draw_dragon(draw, cx0, cy0, span, simplified=False):
    def P(x, y):
        return (cx0 + (x - 0.5) * span, cy0 + (y - 0.5) * span)

    def D(v):
        return v * span

    lw = max(1, round(D(0.0085)))
    thin = max(1, round(D(0.005)))

    # --- Dorsal fin: a continuous scalloped crest rather than separate spikes ---
    if True:
        t = 0.14
        while t < 0.955:
            cx, cy = spine_point(t)
            nx, ny = normal(t)
            tx, ty = tangent(t)
            w = half_width(t)
            grow = 0.020 + 0.024 * t
            base = w * 1.05
            draw.polygon(
                [P(cx + tx * base * 0.9 + nx * w * 0.6, cy + ty * base * 0.9 + ny * w * 0.6),
                 P(cx - tx * base * 0.9 + nx * w * 0.6, cy - ty * base * 0.9 + ny * w * 0.6),
                 P(cx - tx * base * 0.25 + nx * (w + grow), cy - ty * base * 0.25 + ny * (w + grow))],
                fill=ACCENT, outline=DEEP, width=lw,
            )
            t += 0.036

    # --- Body ---
    draw.polygon([P(x, y) for (x, y) in body_polygon()], fill=PRIMARY, outline=DEEP, width=lw)

    if not simplified:
        # --- Belly plates: banded segments along the inner edge, the way a snake's scutes
        # run crosswise under the body ---
        t = 0.06
        while t < 0.95:
            cx, cy = spine_point(t)
            nx, ny = normal(t)
            tx, ty = tangent(t)
            w = half_width(t)
            seg = max(w * 0.42, 0.006)
            inner0, inner1 = -w * 0.97, -w * 0.30
            draw.polygon(
                [P(cx + tx * seg + nx * inner0, cy + ty * seg + ny * inner0),
                 P(cx - tx * seg + nx * inner0, cy - ty * seg + ny * inner0),
                 P(cx - tx * seg * 0.8 + nx * inner1, cy - ty * seg * 0.8 + ny * inner1),
                 P(cx + tx * seg * 0.8 + nx * inner1, cy + ty * seg * 0.8 + ny * inner1)],
                fill=LIGHT, outline=DEEP, width=thin,
            )
            t += 0.0235

        # --- Scales: individual overlapping plates in staggered rows across the back.
        # Painted from the inner edge outward so each row laps over the one before it,
        # which is what gives a scaled hide its shingled look. ---
        rows = [(-0.10, 0.30, MID), (0.34, 0.30, ACCENT), (0.74, 0.26, ACCENT)]
        for row_i, (offset, size, tone) in enumerate(rows):
            t = 0.05 + (0.011 if row_i % 2 else 0.0)
            while t < 0.955:
                cx, cy = spine_point(t)
                nx, ny = normal(t)
                w = half_width(t)
                r = w * size
                if r > D(0.0012) / span:
                    px, py = cx + nx * w * offset, cy + ny * w * offset
                    x0, y0 = P(px - r, py - r)
                    x1, y1 = P(px + r, py + r)
                    # Each scale is a half-disc facing outward — a filled fan with a rim.
                    start = math.degrees(math.atan2(ny, nx)) - 90
                    draw.pieslice([x0, y0, x1, y1], start, start + 180, fill=tone, outline=DEEP, width=thin)
                t += 0.022
            row_i += 1

    # --- Head frame: forward is the chord to the tail tip, so the jaws actually meet it ---
    hx, hy = spine_point(1.0)
    ttx, tty = spine_point(0.0)
    dx, dy = ttx - hx, tty - hy
    dlen = math.hypot(dx, dy) or 1.0
    fx, fy = dx / dlen, dy / dlen
    nx, ny = -fy, fx
    if nx * (hx - 0.5) + ny * (hy - 0.5) < 0:
        nx, ny = -nx, -ny

    def H(f, o):
        return P(hx + fx * f + nx * o, hy + fy * f + ny * o)

    tf = dlen

    # Whiskers, trailing under the jaw.
    if not simplified:
        for base, amp in ((-0.020, 0.050), (-0.078, 0.060)):
            pts = []
            for i in range(18):
                u = i / 17
                pts.append(H(tf - 0.040 - u * 0.170, base - math.sin(u * 1.6) * amp))
            draw.line(pts, fill=GOLD, width=max(1, round(D(0.0075))), joint='curve')

    # Mane: tapered strands rather than blunt triangles.
    if not simplified:
        for f, o, l, spread in ((-0.052, 0.064, 0.070, 0.026),
                                (-0.112, 0.044, 0.064, 0.024),
                                (-0.168, 0.016, 0.052, 0.021)):
            draw.polygon(
                [H(f - spread, o), H(f + spread, o - 0.006),
                 H(f + spread * 0.2, o + l * 0.55), H(f - spread * 1.5, o + l)],
                fill=ACCENT, outline=DEEP, width=lw,
            )

    # Skull and jaws — one shape with a V notched out of the front for the bite.
    head = [
        (-0.150, 0.008), (-0.126, 0.086), (-0.042, 0.132),
        (0.048, 0.120),
        (0.094, 0.066),
        (tf - 0.028, 0.056), (tf + 0.038, 0.024),
        (tf - 0.152, -0.004),
        (tf - 0.018, -0.070),
        (tf - 0.122, -0.082), (0.008, -0.092), (-0.128, -0.056),
    ]
    draw.polygon([H(f, o) for (f, o) in head], fill=ACCENT, outline=DEEP, width=lw)

    if not simplified:
        # Teeth interpolated along the two gum lines, pointing into the gap, so they
        # follow the jaw instead of floating around the snout.
        def lerp(a, b, u):
            return (a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u)

        gum_back = (tf - 0.152, -0.004)
        upper_tip = (tf + 0.038, 0.024)
        lower_tip = (tf - 0.018, -0.070)
        for i in range(5):
            u = 0.18 + i * 0.17
            bx, by = lerp(gum_back, upper_tip, u)
            draw.polygon([H(bx - 0.012, by), H(bx + 0.012, by), H(bx, by - 0.026)],
                         fill=BG, outline=DEEP, width=thin)
        for i in range(4):
            u = 0.22 + i * 0.20
            bx, by = lerp(gum_back, lower_tip, u)
            draw.polygon([H(bx - 0.011, by), H(bx + 0.011, by), H(bx, by + 0.024)],
                         fill=BG, outline=DEEP, width=thin)

        # Jaw hinge and brow ridge, the two lines that make a head read as built rather
        # than cut from a single flat shape.
        draw.line([H(-0.018, -0.078), H(0.030, -0.010)], fill=DEEP, width=thin)
        draw.line([H(-0.048, 0.094), H(0.068, 0.086)], fill=DEEP, width=thin)

    # Brow horns — a main sweep plus a shorter second.
    draw.polygon([H(-0.040, 0.128), H(-0.092, 0.098), H(-0.206, 0.176)],
                 fill=GOLD, outline=DEEP, width=lw)
    if not simplified:
        draw.polygon([H(-0.086, 0.094), H(-0.128, 0.068), H(-0.216, 0.102)],
                     fill=GOLD, outline=DEEP, width=lw)

    # Eye: almond socket, round iris, slit pupil.
    ex, ey = H(0.018, 0.050)
    er = D(0.024)
    draw.ellipse([ex - er, ey - er * 0.78, ex + er, ey + er * 0.78], fill=BG, outline=DEEP, width=lw)
    ir = D(0.014)
    draw.ellipse([ex - ir, ey - ir, ex + ir, ey + ir], fill=GOLD, outline=DEEP, width=thin)
    pr_w, pr_h = D(0.004), D(0.012)
    draw.ellipse([ex - pr_w, ey - pr_h, ex + pr_w, ey + pr_h], fill=DEEP)

    # Nostril.
    if not simplified:
        nr = D(0.0085)
        px, py = H(tf - 0.062, 0.040)
        draw.ellipse([px - nr, py - nr, px + nr, py + nr], fill=DEEP)


def make_icon(size, transparent=False, safe=1.0, simplified=False):
    canvas = size * SS
    img = Image.new('RGBA', (canvas, canvas), (0, 0, 0, 0) if transparent else BG)
    draw = ImageDraw.Draw(img)
    draw_dragon(draw, canvas * 0.515, canvas * 0.550, canvas * safe * 0.84, simplified)
    return img.resize((size, size), Image.LANCZOS)


if __name__ == '__main__':
    make_icon(1024).convert('RGB').save(f'{OUT}/preview_icon.png')
    make_icon(256, simplified=True).convert('RGB').save(f'{OUT}/preview_favicon.png')
    print('done')
