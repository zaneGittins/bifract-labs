# Exporting question sets to CTFd

The repository stores question sets as JSON and generates CTFd files on demand. Generated `ctfd/` directories are ignored and should not be committed.

## Generate challenges

From the repository root:

```bash
python3 scripts/export_ctfd.py labs/001/questions.json
```

By default this creates `labs/001/ctfd/`. Use `--output` to write elsewhere:

```bash
python3 scripts/export_ctfd.py labs/001/questions.json --output /tmp/lab-001-ctfd
```

Each question becomes a numbered directory containing a ctfcli-compatible `challenge.yml`. The exporter also writes `manifest.json`.

## Install with ctfcli

From a configured [ctfcli](https://github.com/CTFd/ctfcli) project:

```bash
for challenge in labs/001/ctfd/*/challenge.yml; do
  ctf challenge install "$challenge"
done
```

For challenges already installed in CTFd, replace `install` with `sync`.

## Answer behavior

Generated flags use CTFd regex validation and are case-insensitive by default. They also tolerate surrounding whitespace and documented aliases.

Two-value answers are handled as follows:

- Sets accept either order and common separators.
- Ordered lists require the correct order but accept common separators.
- Mappings accept either pair order and `=`, `:`, or `->` between keys and values.

Set `"case_sensitive": true` on an individual answer when capitalization is evidence-bearing. The exporter rejects sets, ordered lists, and mappings requiring more than two submitted values.

## Optional CTFd metadata

The exporter derives the category from `lab_id` and otherwise uses sensible defaults. Override them at the top level of a question set when needed:

```json
{
  "ctfd": {
    "author": "Bifract Labs",
    "category": "Lab 001",
    "tag": "bifract-labs-001"
  }
}
```

The JSON question set remains the source of truth. Regenerate after changing questions, answers, aliases, points, or hints.
