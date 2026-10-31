"""Render a lab's questions.json as interactive question cards.

A page opts in with a marker line:  <!-- questions: labs/001/questions.json -->
The path is relative to the repository root. questions.json stays the single
source of truth; nothing is copied into guide/.
"""
import html
import json
import os
import re

MARKER = re.compile(r"<!--\s*questions:\s*(\S+)\s*-->")

STAGES = {
    "triage": "Triage",
    "initial-access": "Initial access",
    "loader-analysis": "Loader analysis",
    "discovery": "Discovery",
    "remote-access": "Remote access",
    "persistence": "Persistence",
    "credential-access": "Credential access",
    "lateral-movement": "Lateral movement",
    "infrastructure": "Infrastructure",
    "scope": "Scope",
}

# Walkthrough chapter that answers each stage.
CHAPTERS = {
    "triage": "walkthrough/01-baselines.md",
    "initial-access": "walkthrough/02-initial-access.md",
    "loader-analysis": "walkthrough/03-loader.md",
    "discovery": "walkthrough/04-hands-on-keyboard.md",
    "remote-access": "walkthrough/04-hands-on-keyboard.md",
    "persistence": "walkthrough/05-persistence.md",
    "credential-access": "walkthrough/06-credential-access.md",
    "lateral-movement": "walkthrough/07-lateral-movement.md",
    "infrastructure": "walkthrough/08-infrastructure.md",
    "scope": "walkthrough/08-infrastructure.md",
}


def _answer_md(ans):
    t = ans["type"]
    c = ans["canonical"]
    if t == "string":
        return f"`{c}`"
    if t == "set":
        return " and ".join(f"`{v}`" for v in c) + " (any order)"
    if t == "ordered_list":
        return " &rarr; ".join(f"`{v}`" for v in c)
    if t == "mapping":
        return "<br>".join(f"`{k}` &rarr; `{v}`" for k, v in c.items())
    return f"`{c}`"


def _input_hint(ans):
    t = ans["type"]
    if t == "set":
        return f"{len(ans['canonical'])} values, comma separated"
    if t == "ordered_list":
        return "parent > child"
    if t == "mapping":
        return "domain = ip, domain = ip"
    return "Your answer"


def render(data, defaults_case_sensitive=False):
    out = []
    qs = data["questions"]
    total = sum(q["points"] for q in qs)
    out.append(
        f'<div class="q-board" data-total="{total}" data-count="{len(qs)}" data-lab="{html.escape(data["lab_id"])}">'
        f'<span>Score</span><b class="q-score">0 / {total}</b>'
        f'<span class="q-bar"><i></i></span>'
        f'<span class="q-solved">0 of {len(qs)} solved</span>'
        f'<button type="button" class="q-reset" title="Clear saved progress">Reset</button>'
        "</div>\n"
    )
    stage = None
    for q in qs:
        if q["stage"] != stage:
            stage = q["stage"]
            n = sum(1 for x in qs if x["stage"] == stage)
            pts = sum(x["points"] for x in qs if x["stage"] == stage)
            out.append(f"\n## {STAGES.get(stage, stage.title())} {{ #stage-{stage} }}\n")
            out.append(f'<p class="q-src">{n} question{"s" if n != 1 else ""} &middot; {pts} points</p>\n')
        ans = q["answer"]
        payload = dict(ans)
        payload.setdefault("case_sensitive", data.get("answer_defaults", {}).get("case_sensitive", defaults_case_sensitive))
        attr = html.escape(json.dumps(payload), quote=True)
        chapter = CHAPTERS.get(q["stage"])
        walk = f"[Walkthrough]({chapter}#q{q['id']})" if chapter else ""
        sources = ", ".join(q.get("evidence", {}).get("sources", []))
        out.append(
            f'\n<div class="q-card" id="q{q["id"]}" data-qid="{q["id"]}" data-points="{q["points"]}" markdown>\n'
            f'<div class="q-head"><span class="q-num">Q{q["id"]}</span>'
            f'<span class="q-title">{html.escape(q["title"])}</span>'
            f'<span class="q-meta"><span class="q-done">SOLVED</span>'
            f'<span class="q-pill {q["difficulty"]}">{q["difficulty"]}</span>'
            f'<span class="q-pts">{q["points"]} pts</span></span></div>\n'
            f'<p class="q-prompt">{html.escape(q["prompt"])}</p>\n'
            f'<form class="q-check" data-answer="{attr}" autocomplete="off">'
            f'<input type="text" spellcheck="false" placeholder="{html.escape(_input_hint(ans))}" aria-label="Answer for Q{q["id"]}">'
            f'<button type="submit">Check</button><span class="q-result" aria-live="polite"></span></form>\n\n'
            f'??? tip "Hint"\n    {q["hint"]}\n\n'
            f'    <span class="q-src">Evidence: {html.escape(sources)}</span>\n\n'
            f'??? success "Answer"\n    {_answer_md(ans)}\n\n'
            + (f"    {walk}\n\n" if walk else "")
            + "</div>\n"
        )
    return "".join(out)


def on_page_markdown(markdown, page, config, files, **kwargs):
    m = MARKER.search(markdown)
    if not m:
        return markdown
    root = os.path.dirname(config["config_file_path"])
    with open(os.path.join(root, m.group(1)), encoding="utf-8") as f:
        data = json.load(f)
    return markdown[: m.start()] + render(data) + markdown[m.end() :]
