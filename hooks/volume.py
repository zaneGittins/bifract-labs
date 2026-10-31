"""MkDocs hook: draw a lab's events-per-hour chart as inline SVG.

`<!-- volume: labs/001/events-per-hour.tsv | caption -->` becomes a bar chart of
the hourly counts in that TSV (columns hour_utc, events). Inline SVG so the bars
take the theme's colors and each bar shows its hour and count on hover.
"""

import datetime as dt
import html
import os
import re

MARKER = re.compile(r"<!--\s*volume:\s*(\S+)\s*\|\s*(.*?)\s*-->")

BAR = 8  # bar width, viewBox units
GAP = 2  # gap between bars
H = 120  # plot height
LABEL = 16  # room under the plot for day labels
R = 2  # rounded top corner radius


def _bar_path(x, h):
    """A bar with rounded top corners, square at the baseline."""
    r = min(R, h / 2, BAR / 2)
    y = H - h
    return (
        f"M{x},{H}V{y + r:.2f}Q{x},{y:.2f} {x + r},{y:.2f}"
        f"H{x + BAR - r}Q{x + BAR},{y:.2f} {x + BAR},{y + r:.2f}V{H}Z"
    )


def render(rows, caption):
    peak = max(n for _, n in rows)
    width = len(rows) * (BAR + GAP) - GAP
    out = [
        f'<figure class="lb-volume">'
        f'<svg viewBox="0 0 {width} {H + LABEL}" role="img" aria-label="{html.escape(caption)}">'
    ]
    for i, (hour, n) in enumerate(rows):
        x = i * (BAR + GAP)
        h = max(1.5, n / peak * (H - 4))
        tip = f"{hour:%b %-d, %H:00} UTC: {n:,} events"
        out.append(
            f"<g><title>{tip}</title>"
            f'<rect class="hit" x="{x - GAP / 2}" y="0" width="{BAR + GAP}" height="{H}"/>'
            f'<path class="bar" d="{_bar_path(x, h)}"/></g>'
        )
        if hour.hour == 0 or i == 0:
            out.append(f'<text x="{x}" y="{H + LABEL - 3}">{hour:%a %-d}</text>')
    out.append(f"</svg><figcaption>{html.escape(caption)}</figcaption></figure>")
    return "".join(out)


def on_page_markdown(markdown, page, config, files, **kwargs):
    m = MARKER.search(markdown)
    if not m:
        return markdown
    root = os.path.dirname(config["config_file_path"])
    rows = []
    with open(os.path.join(root, m.group(1)), encoding="utf-8") as f:
        next(f)  # header
        for line in f:
            hour, n = line.rstrip("\n").split("\t")
            rows.append((dt.datetime.strptime(hour, "%Y-%m-%d %H:%M:%S"), int(n)))
    return markdown[: m.start()] + render(rows, m.group(2)) + markdown[m.end() :]
