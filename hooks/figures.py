"""MkDocs hook: explanatory figures built from files in labs/<lab>/figures/.

`<!-- figure: labs/001/figures/clickfix.html | caption -->` inlines an HTML snippet.
`<!-- beacon: labs/001/figures/beacon-hour.tsv | caption -->` draws a timeline of
connections per series (columns series, timestamp_utc, orig_bytes). Both render as
HTML so they follow the site theme, and text stays readable on phones.
"""

import datetime as dt
import html
import math
import os
import re

FIGURE = re.compile(r"<!--\s*figure:\s*(\S+)\s*\|\s*(.*?)\s*-->")
BEACON = re.compile(r"<!--\s*beacon:\s*(\S+)\s*\|\s*(.*?)\s*-->")

# Beacon timeline rows, in order: series key, label, extra class.
SERIES = [
    ("c2", "WS02 → 203.0.113.87:8888", "is-c2"),
    ("https", "WS02 → other HTTPS sites", ""),
]
W = 3600  # one viewBox unit per second of the hour
H = 48
LO, HI = math.log(100), math.log(25000)  # bytes range for tick height (log scale)


def _caption(text):
    return f"<figcaption>{html.escape(text)}</figcaption>"


def _figure(root, path, caption):
    with open(os.path.join(root, path), encoding="utf-8") as f:
        body = f.read().strip()
    return f'<figure class="lb-fig">{body}{_caption(caption)}</figure>'


def _gap_text(gaps):
    lo, hi = min(gaps), max(gaps)
    fmt = lambda s: "under a second" if s < 1 else (f"{s:.0f} s" if s < 90 else f"{s / 60:.0f} min")
    return f"{fmt(lo)} to {fmt(hi)} apart"


def _beacon(root, path, caption):
    rows = {}
    with open(os.path.join(root, path), encoding="utf-8") as f:
        next(f)
        for line in f:
            series, ts, b = line.rstrip("\n").split("\t")
            rows.setdefault(series, []).append((dt.datetime.strptime(ts, "%Y-%m-%d %H:%M:%S.%f"), int(b)))
    start = min(t for r in rows.values() for t, _ in r).replace(minute=0, second=0, microsecond=0)
    out = ['<figure class="lb-fig lb-beacon">']
    for key, label, cls in SERIES:
        pts = sorted(rows[key])
        gaps = [(b[0] - a[0]).total_seconds() for a, b in zip(pts, pts[1:])]
        sizes = [b for _, b in pts]
        summary = f"{len(pts)} connections, {_gap_text(gaps)}, {min(sizes):,} to {max(sizes):,} bytes"
        ticks = []
        for t, b in pts:
            x = (t - start).total_seconds()
            frac = (math.log(max(b, 100)) - LO) / (HI - LO)
            h = 8 + (H - 10) * min(max(frac, 0), 1)
            tip = f"{t:%H:%M:%S} UTC, {b:,} bytes"
            ticks.append(
                f'<g><title>{tip}</title><line class="hit" x1="{x:.1f}" x2="{x:.1f}" y1="0" y2="{H}"/>'
                f'<line class="mark" x1="{x:.1f}" x2="{x:.1f}" y1="{H}" y2="{H - h:.1f}"/></g>'
            )
        out.append(
            f'<div class="lb-beacon-row {cls}"><div class="lb-beacon-label"><b>{html.escape(label)}</b>'
            f"<span>{html.escape(summary)}</span></div>"
            f'<svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" role="img" '
            f'aria-label="{html.escape(label)}: {html.escape(summary)}">'
            f'<line class="base" x1="0" x2="{W}" y1="{H}" y2="{H}"/>{"".join(ticks)}</svg></div>'
        )
    marks = "".join(f"<span>{(start + dt.timedelta(minutes=m)):%H:%M}</span>" for m in (0, 15, 30, 45, 60))
    out.append(f'<div class="lb-beacon-axis">{marks}</div>{_caption(caption)}</figure>')
    return "".join(out)


def on_page_markdown(markdown, page, config, files, **kwargs):
    root = os.path.dirname(config["config_file_path"])
    markdown = FIGURE.sub(lambda m: _figure(root, m.group(1), m.group(2)), markdown)
    return BEACON.sub(lambda m: _beacon(root, m.group(1), m.group(2)), markdown)
