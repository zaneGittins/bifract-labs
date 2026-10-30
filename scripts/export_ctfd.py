#!/usr/bin/env python3
"""Export a Bifract Labs question set as ctfcli-compatible challenges."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


SEPARATOR = r"(?:\s*(?:,|;|\||/|->)\s*|\s+)"
ORDERED_SEPARATOR = r"\s*(?:->|>|,|;|\|)\s*"
MAPPING_SEPARATOR = r"\s*(?:=|:|->)\s*"


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def literal_pattern(value: str) -> str:
    """Escape a literal, tolerating the trailing dot shown by some DNS tools."""
    if re.search(r"\.(?:com|online|internal)\.?$", value, re.IGNORECASE):
        return re.escape(value.rstrip(".")) + r"\.?"
    return re.escape(value)


def variants(value: str, aliases: dict[str, list[str]]) -> list[str]:
    values = [value, *aliases.get(value, [])]
    return list(dict.fromkeys(values))


def alternation(values: list[str]) -> str:
    return "(?:" + "|".join(literal_pattern(value) for value in values) + ")"


def regex_flag(pattern: str, case_sensitive: bool) -> dict[str, str]:
    return {
        "type": "regex",
        "content": rf"^\s*{pattern}\s*$",
        "data": "case_sensitive" if case_sensitive else "case_insensitive",
    }


def ctfd_flags(answer: dict, defaults: dict) -> list[dict[str, str]]:
    answer_type = answer["type"]
    canonical = answer["canonical"]
    aliases = answer.get("accepted_aliases", {})
    case_sensitive = answer.get(
        "case_sensitive", defaults.get("case_sensitive", False)
    )

    if answer_type == "string":
        accepted = [canonical, *answer.get("accepted", [])]
        return [regex_flag(alternation(list(dict.fromkeys(accepted))), case_sensitive)]

    if answer_type in {"set", "ordered_list"}:
        if not 1 <= len(canonical) <= 2:
            raise ValueError(f"{answer_type} answers must contain one or two values")
        parts = [alternation(variants(value, aliases)) for value in canonical]
        if len(parts) == 1:
            pattern = parts[0]
        elif answer_type == "ordered_list":
            pattern = parts[0] + ORDERED_SEPARATOR + parts[1]
        else:
            forward = parts[0] + SEPARATOR + parts[1]
            reverse = parts[1] + SEPARATOR + parts[0]
            pattern = f"(?:{forward}|{reverse})"
        return [regex_flag(pattern, case_sensitive)]

    if answer_type == "mapping":
        items = list(canonical.items())
        if not 1 <= len(items) <= 2:
            raise ValueError("mapping answers must contain one or two pairs")
        parts = [
            literal_pattern(key) + MAPPING_SEPARATOR + literal_pattern(str(value))
            for key, value in items
        ]
        if len(parts) == 1:
            pattern = parts[0]
        else:
            forward = parts[0] + SEPARATOR + parts[1]
            reverse = parts[1] + SEPARATOR + parts[0]
            pattern = f"(?:{forward}|{reverse})"
        return [regex_flag(pattern, case_sensitive)]

    raise ValueError(f"unsupported answer type: {answer_type}")


def submission_help(answer_type: str, case_sensitive: bool) -> str:
    if answer_type == "set":
        text = "Submit both values in either order; common separators are accepted."
    elif answer_type == "ordered_list":
        text = "Submit both values in execution order; common separators are accepted."
    elif answer_type == "mapping":
        text = "Submit both mappings in either order as key=value; colons or arrows also work."
    else:
        text = "Submit the observed value; surrounding whitespace and documented aliases are accepted."
    if case_sensitive:
        return text + " Capitalization matters for this answer."
    return text + " Capitalization does not matter."


def yaml_json(value: object) -> str:
    return json.dumps(value, ensure_ascii=False)


def export_metadata(question_set: dict) -> dict[str, str]:
    settings = question_set.get("ctfd", {})
    lab_id = str(question_set.get("lab_id", "")).strip()
    default_category = f"Lab {lab_id}" if lab_id else question_set.get("title", "Lab")
    return {
        "author": settings.get("author", "Bifract Labs"),
        "category": settings.get("category", default_category),
        "tag": settings.get("tag", question_set.get("id", "bifract-labs")),
    }


def render_challenge(question: dict, defaults: dict, metadata: dict[str, str]) -> str:
    answer = question["answer"]
    case_sensitive = answer.get(
        "case_sensitive", defaults.get("case_sensitive", False)
    )
    flags = ctfd_flags(answer, defaults)
    name = f'{question["id"]} - {question["title"]}'
    description = [
        question["prompt"],
        "",
        submission_help(answer["type"], case_sensitive),
    ]
    tags = [
        value
        for value in (
            question.get("stage"),
            question.get("difficulty"),
            metadata["tag"],
        )
        if value
    ]
    lines = [
        f"name: {yaml_json(name)}",
        f'author: {yaml_json(metadata["author"])}',
        f'category: {yaml_json(metadata["category"])}',
        "description: |-",
        *[f"  {line}" if line else "" for line in description],
        f'value: {question["points"]}',
        "type: standard",
        "logic: any",
        "flags:",
        *[f"  - {yaml_json(flag)}" for flag in flags],
        f"tags: {yaml_json(tags)}",
    ]
    if question.get("hint"):
        lines.extend(
            [
                "hints:",
                f'  - {yaml_json({"content": question["hint"], "cost": 0})}',
            ]
        )
    lines.extend(["state: visible", 'version: "0.1"', ""])
    return "\n".join(lines)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Export questions.json to a generated ctfcli challenge tree."
    )
    parser.add_argument("source", type=Path, help="Path to a question-set JSON file")
    parser.add_argument(
        "--output",
        type=Path,
        help="Output directory (default: <source directory>/ctfd)",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    output = args.output or args.source.parent / "ctfd"
    question_set = json.loads(args.source.read_text(encoding="utf-8"))
    defaults = question_set.get("answer_defaults", {})
    metadata = export_metadata(question_set)
    output.mkdir(parents=True, exist_ok=True)

    manifest = []
    for question in question_set["questions"]:
        directory = output / f'{question["id"]}-{slugify(question["title"])}'
        directory.mkdir(parents=True, exist_ok=True)
        challenge_path = directory / "challenge.yml"
        challenge_path.write_text(
            render_challenge(question, defaults, metadata), encoding="utf-8"
        )
        manifest.append(str(challenge_path.relative_to(output)))

    (output / "manifest.json").write_text(
        json.dumps(
            {
                "schema_version": "1.0",
                "source": args.source.name,
                "challenge_count": len(manifest),
                "challenges": manifest,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"Exported {len(manifest)} challenges to {output}")


if __name__ == "__main__":
    main()
