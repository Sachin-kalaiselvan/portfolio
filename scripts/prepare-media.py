"""One-off media preparation. Converts source captures into responsive WebP sizes
under public/media. Run: python3 scripts/prepare-media.py <src_dir>
Sources expected in <src_dir>: see JOBS below."""
import sys, os
from PIL import Image

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "media")
os.makedirs(OUT, exist_ok=True)

# name, source file, crop box or None, widths
JOBS = [
    ("threxa-production", "td-20.png", (158, 128, 1122, 672), [640, 960]),
    ("threxa-machines", "ted-9.png", None, [540, 1080]),
    ("threxa-overview", "ted-47.png", None, [540, 1080]),
    ("threxa-dispatch", "ted-21.png", None, [540, 1080]),
    ("guild-welcome", "gg-0.png", None, [390, 780]),
    ("guild-train", "gg-on0.png", None, [390, 780]),
    ("guild-join", "gg-on2.png", None, [390, 780]),
    ("papillon-hero", "hero.jpg", None, [800, 1600]),
]

for name, src, crop, widths in JOBS:
    im = Image.open(os.path.join(SRC, src)).convert("RGB")
    if crop:
        im = im.crop(crop)
    for w in widths:
        w2 = min(w, im.width)
        h2 = round(im.height * w2 / im.width)
        im.resize((w2, h2), Image.LANCZOS).save(os.path.join(OUT, f"{name}-{w}.webp"), "WEBP", quality=82, method=6)
    print(name, im.size)
