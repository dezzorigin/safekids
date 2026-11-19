#!/usr/bin/env python3
"""Generate public/og-image.png 1200x630 for SafeKids (PIL, local only).

Design follows the site's own language (docs/DESIGN.md): paper #FFFEF7,
ink #1A1A2E, yellow #FFE135, coral #FF6B6B, mint #4ECDC4, sky #74C0FC.
Neo-brutalist card: thick ink border, hard offset shadow, dashed
evacuation route, stamp number. No gradients, no emoji, no stock imagery.
Not a screenshot — a designed preview card.
"""
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "public", "og-image.png")

W, H = 1200, 630
PAPER = (255, 254, 247)   # #FFFEF7
INK = (26, 26, 46)        # #1A1A2E
YELLOW = (255, 225, 53)   # #FFE135
CORAL = (255, 107, 107)   # #FF6B6B
MINT = (78, 205, 196)     # #4ECDC4
SKY = (116, 192, 252)     # #74C0FC
MUTED = (100, 100, 120)

SANS_B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
SANS = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
MONO_B = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"

img = Image.new("RGB", (W, H), PAPER)
d = ImageDraw.Draw(img)

# hard shadow card
d.rectangle([56, 56, W - 32, H - 32], fill=INK)
d.rectangle([40, 40, W - 48, H - 48], fill=PAPER, outline=INK, width=5)

# top strip: kicker + stamp
f_kick = ImageFont.truetype(MONO_B, 28)
d.text((88, 84), "MEDIA PEMBELAJARAN  ·  SD KELAS V", font=f_kick, fill=INK)
d.rectangle([W - 220, 72, W - 116, 136], fill=YELLOW, outline=INK, width=4)
f_stamp = ImageFont.truetype(MONO_B, 40)
d.text((W - 188, 82), "3D", font=f_stamp, fill=INK)

# title
f_title = ImageFont.truetype(SANS_B, 132)
d.text((84, 150), "SafeKids", font=f_title, fill=INK)
# yellow marker behind "selamat"
f_sub = ImageFont.truetype(SANS_B, 44)
d.rectangle([88, 322, 88 + d.textlength("Belajar selamat", font=f_sub) + 16, 322 + 58], fill=YELLOW, outline=INK, width=3)
d.text((96, 324), "Belajar selamat", font=f_sub, fill=INK)
d.text((88, 392), "dari bencana, sambil main.", font=f_sub, fill=INK)

# dashed evacuation route (bottom-left panel)
rx0, ry0, rx1, ry1 = 88, 470, 560, 560
d.rectangle([rx0, ry0, rx1, ry1], outline=INK, width=3)
for gx in range(rx0 + 47, rx1, 47):
    d.line([(gx, ry0), (gx, ry1)], fill=(200, 200, 190), width=2)
for gy in range(ry0 + 30, ry1, 30):
    d.line([(rx0, gy), (rx1, gy)], fill=(200, 200, 190), width=2)
# route: dashed polyline start (bottom-left) -> safe point (top-right)
pts = [(rx0 + 23, ry0 + 67), (rx0 + 23, ry0 + 23), (rx0 + 210, ry0 + 23), (rx0 + 210, ry0 + 67), (rx0 + 400, ry0 + 67), (rx0 + 400, ry0 + 23)]
for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
    steps = max(abs(x2 - x1), abs(y2 - y1)) // 12
    for i in range(0, steps, 2):
        t1, t2 = i / steps, min((i + 1) / steps, 1)
        d.line([(x1 + (x2 - x1) * t1, y1 + (y2 - y1) * t1),
                (x1 + (x2 - x1) * t2, y1 + (y2 - y1) * t2)], fill=INK, width=5)
d.ellipse([pts[0][0] - 10, pts[0][1] - 10, pts[0][0] + 10, pts[0][1] + 10], fill=YELLOW, outline=INK, width=3)
d.rectangle([pts[-1][0] - 22, pts[-1][1] - 22, pts[-1][0] + 22, pts[-1][1] + 22], fill=MINT, outline=INK, width=3)
d.text((pts[-1][0] - 8, pts[-1][1] - 14), "A", font=ImageFont.truetype(SANS_B, 26), fill=INK)

# right column: level chips + facts
x = 620
f_chip = ImageFont.truetype(MONO_B, 26)
chips = [("GEMPA", CORAL), ("BANJIR", SKY), ("TSUNAMI", MINT)]
cx = x
for label, bg in chips:
    tw = d.textlength(label, font=f_chip)
    d.rectangle([cx, 470, cx + tw + 32, 522], fill=bg, outline=INK, width=3)
    d.text((cx + 16, 480), label, font=f_chip, fill=INK)
    cx += tw + 32 + 14

f_meta = ImageFont.truetype(MONO, 26)
d.text((x, 545), "6 langkah  ·  ±90 menit", font=f_meta, fill=MUTED)
f_url = ImageFont.truetype(MONO_B, 28)
d.text((x, 585 - 8), "safekids-app.pages.dev", font=f_url, fill=INK)

img.save(OUT, "PNG", optimize=True)
print("saved", OUT, os.path.getsize(OUT), "bytes")
