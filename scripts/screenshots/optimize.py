#!/usr/bin/env python3
"""Convert captured PNGs to WebP for the guide: optimize.py <in_dir> <out_dir>"""
import pathlib
import sys

from PIL import Image

MAX_W = 2000

src, dst = map(pathlib.Path, sys.argv[1:3])
dst.mkdir(parents=True, exist_ok=True)
for png in sorted(p for p in src.glob("*.png") if not p.name.endswith(".fail.png")):
    im = Image.open(png).convert("RGB")
    if im.width > MAX_W:
        im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.LANCZOS)
    out = dst / (png.stem + ".webp")
    im.save(out, "WEBP", quality=88, method=6)
    print(f"{out.name}: {out.stat().st_size // 1024} KB")
