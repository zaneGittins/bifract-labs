"""BQL syntax highlighting for ```bql fences, rendered at build time.

A port of the Bifract UI tokenizer (web/static/syntaxHighlight.js, highlightLine)
so guide queries are colored exactly like the Bifract editor. Token classes are
the UI's own hl-* names; colors live in guide/assets/labs.css.
"""
import html
import re

_STR_D = re.compile(r'"(?:[^"\\]|\\.)*"')
_STR_S = re.compile(r"'(?:[^'\\]|\\.)*'")
_REGEX = re.compile(r"/(?:[^/\n\\]|\\.)+/[gimsu]*")
_VAR = re.compile(r"@[a-zA-Z_][a-zA-Z0-9_]*")
_BIND = re.compile(r"&[a-zA-Z_][a-zA-Z0-9_]*")
_IDENT = re.compile(r"[a-zA-Z_][a-zA-Z0-9_.]*")
_NUM = re.compile(r"\d+\.?\d*")
_FIELD_NEXT = re.compile(r"\s*(?:!=|>=|<=|=~|=\^|=\$|=|>|<)")
_TWO_OPS = {"!=", "<=", ">=", "=~", "=^", "=$"}


def tokenize_line(line):
    out = []
    i = 0
    n = len(line)
    while i < n:
        ch = line[i]
        rest = line[i:]
        m = None
        if ch == '"':
            m = _STR_D.match(rest)
            if m:
                out.append((m.group(0), "hl-string"))
        elif ch == "'":
            m = _STR_S.match(rest)
            if m:
                out.append((m.group(0), "hl-string"))
        elif ch == "/" and line[i + 1 : i + 2] == "/" and not line[:i].strip():
            out.append((rest, "hl-comment"))
            i = n
            continue
        elif ch == "/":
            m = _REGEX.match(rest)
            if m:
                out.append((m.group(0), "hl-regex"))
        elif ch == "@" and not (i > 0 and re.match(r"[a-zA-Z0-9_]", line[i - 1])):
            m = _VAR.match(rest)
            if m:
                out.append((m.group(0), "hl-variable"))
        elif ch == "&":
            m = _BIND.match(rest)
            if m:
                out.append((m.group(0), "hl-binding"))
        elif re.match(r"[a-zA-Z_]", ch):
            ident = _IDENT.match(rest).group(0)
            after = line[i + len(ident) :]
            if re.fullmatch(r"(?i)AND|OR|NOT", ident):
                cls = "hl-keyword"
            elif re.fullmatch(r"(?i)let", ident) and re.match(r"\s*&[a-zA-Z_]", after):
                cls = "hl-keyword"
            elif re.match(r"\s*\(", after) or ident.lower() == "case":
                cls = "hl-function"
            elif _FIELD_NEXT.match(after):
                cls = "hl-field"
            elif re.fullmatch(r"(?i)true|false", ident):
                cls = "hl-boolean"
            else:
                cls = "hl-string"
            out.append((ident, cls))
            i += len(ident)
            continue
        elif ch.isdigit():
            m = _NUM.match(rest)
            if m:
                out.append((m.group(0), "hl-number"))
        elif rest[:2] == ":=":
            out.append((":=", "hl-assignment"))
            i += 2
            continue
        elif rest[:2] in _TWO_OPS:
            out.append((rest[:2], "hl-operator"))
            i += 2
            continue
        elif ch == "|":
            out.append(("|", "hl-pipe"))
            i += 1
            continue
        elif ch in "=<>":
            out.append((ch, "hl-operator"))
            i += 1
            continue
        elif ch == "*":
            out.append(("*", "hl-wildcard"))
            i += 1
            continue
        elif ch in "[](){}":
            out.append((ch, "hl-bracket"))
            i += 1
            continue

        if m:
            i += len(m.group(0))
        else:
            out.append((ch, "hl-default"))
            i += 1
    return out


def highlight(src):
    lines = []
    for line in src.split("\n"):
        if not line.strip():
            lines.append(html.escape(line))
            continue
        lines.append(
            "".join(f'<span class="{c}">{html.escape(t)}</span>' for t, c in tokenize_line(line))
        )
    return "\n".join(lines)


def fence(src, language, class_name, options, md, **kwargs):
    src = src.rstrip("\n")
    return (
        '<div class="language-bql highlight" data-bql="'
        + html.escape(src, quote=True)
        + '"><pre><code>'
        + highlight(src)
        + "</code></pre></div>"
    )


def on_config(config, **kwargs):
    sf = config["mdx_configs"].setdefault("pymdownx.superfences", {})
    fences = [f for f in sf.get("custom_fences", []) if f.get("name") != "bql"]
    fences.append({"name": "bql", "class": "language-bql", "format": fence})
    sf["custom_fences"] = fences
    return config


# Screenshot markers: <!-- shot: id | caption --> becomes a figure. The image
# lives at <lab>/shots/<id>.webp and is made by scripts/screenshots/capture.mjs
# from the bql fence just above the marker (or a scripted UI step).
SHOT = re.compile(r"^<!--\s*shot:\s*([a-z0-9-]+)\s*\|\s*(.*?)\s*(?:\|\s*([^|]*?))?\s*-->\s*$", re.M)


def on_page_markdown(markdown, page, **kwargs):
    m = re.match(r"(\d{3})/", page.file.src_uri)
    if not m:
        return markdown
    lab = m.group(1)
    here = page.file.src_uri.rsplit("/", 1)[0]

    def fig(mm):
        import os.path
        rel = os.path.relpath(f"{lab}/shots/{mm.group(1)}.webp", here)
        cap = mm.group(2)
        alt = re.sub(r"[*_`]", "", cap).replace('"', "'")
        return (
            f'<figure class="shot" markdown>\n'
            f'![{alt}]({rel})\n'
            f"<figcaption markdown>{cap}</figcaption>\n"
            f"</figure>"
        )

    return SHOT.sub(fig, markdown)
