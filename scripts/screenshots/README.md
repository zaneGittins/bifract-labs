# Guide screenshots

Screenshots in `guide/<lab>/shots/` are generated, not hand-made. A guide page marks a shot with
`<!-- shot: id | caption | opts -->` right after a ```` ```bql ```` fence; `capture.mjs` runs that query
in a real Bifract with the lab loaded and crops the result. Markers without a fence are UI steps
in `ui-steps.mjs`.

```bash
# Bifract with lab 001 in fractal bifract-labs-001 (see guide/001/setup.md)
npm install --prefix scripts/screenshots
BIFRACT_URL=http://localhost:8080 BIFRACT_PASSWORD=... \
  node scripts/screenshots/capture.mjs --lab 001 --out /tmp/shots
python3 scripts/screenshots/optimize.py /tmp/shots guide/001/shots
```

Options after the caption: `rows=N` (rows to keep, default 14), `wait=ms`, `click=N` (open row N's
detail), `graph` (keep the whole view, for `pgraph()`), `narrow` (capture a UI step at the narrower
query width so its text stays readable).

Capture is fail-closed: a page showing any blocklisted term (range names, the home IP, local paths)
is not saved.
