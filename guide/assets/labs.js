/* Bifract Labs: Open-in-Bifract links, instance settings, question checking. */
(function () {
  "use strict";

  // Each lab's data window, so deep links land on the dataset, not "last 24h".
  var LABS = {
    "001": { from: "2026-10-27T00:00:00Z", to: "2026-11-01T00:00:00Z", fractal: "bifract-labs-001" },
  };
  var KEY_URL = "bifract-labs.url";
  var KEY_FRACTAL = "bifract-labs.fractal.";
  var DEFAULT_URL = "https://localhost";

  function store(k, v) {
    try {
      if (v === undefined) return window.localStorage.getItem(k);
      if (v === null) window.localStorage.removeItem(k);
      else window.localStorage.setItem(k, v);
    } catch (e) { /* storage blocked: defaults still work */ }
    return null;
  }

  function currentLab() {
    var m = window.location.pathname.match(/\/(\d{3})\//);
    return m && LABS[m[1]] ? m[1] : null;
  }

  function instanceUrl() {
    return (store(KEY_URL) || DEFAULT_URL).replace(/\/+$/, "");
  }

  function fractalFor(lab) {
    return store(KEY_FRACTAL + lab) || LABS[lab].fractal;
  }

  function deepLink(query, lab) {
    var cfg = LABS[lab];
    return instanceUrl() + "/go/search?q=" + encodeURIComponent(query) +
      "&fractal=" + encodeURIComponent(fractalFor(lab)) +
      "&from=" + encodeURIComponent(cfg.from) + "&to=" + encodeURIComponent(cfg.to);
  }

  function addOpenLinks() {
    var lab = currentLab();
    if (!lab) return;
    document.querySelectorAll(".language-bql[data-bql]").forEach(function (block) {
      if (block.querySelector(".lb-open")) return;
      var a = document.createElement("a");
      a.className = "lb-open";
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = "Open in Bifract ↗";
      a.title = "Run in your Bifract (" + instanceUrl() + ", fractal " + fractalFor(lab) + ")";
      a.href = deepLink(block.getAttribute("data-bql"), lab);
      block.appendChild(a);
    });
  }

  function instanceSettings() {
    document.querySelectorAll(".lb-instance").forEach(function (box) {
      if (box.dataset.ready) return;
      box.dataset.ready = "1";
      var lab = box.getAttribute("data-lab") || currentLab() || "001";
      box.innerHTML =
        '<div><label for="lb-url">Your Bifract URL</label><input id="lb-url" type="url" spellcheck="false"></div>' +
        '<div><label for="lb-fractal">Fractal</label><input id="lb-fractal" type="text" spellcheck="false"></div>' +
        '<button type="button">Save</button><p class="lb-saved"></p>';
      var url = box.querySelector("#lb-url");
      var fr = box.querySelector("#lb-fractal");
      var note = box.querySelector(".lb-saved");
      url.value = instanceUrl();
      fr.value = fractalFor(lab);
      function show() {
        note.textContent = "Every query in this guide has an Open in Bifract button that runs it on " +
          instanceUrl() + " in fractal " + fractalFor(lab) + ". Saved in this browser only.";
      }
      show();
      box.querySelector("button").addEventListener("click", function () {
        var u = url.value.trim();
        store(KEY_URL, u && u !== DEFAULT_URL ? u : null);
        var f = fr.value.trim();
        store(KEY_FRACTAL + lab, f && f !== LABS[lab].fractal ? f : null);
        show();
      });
    });
  }

  /* ---------- Questions ---------- */

  function norm(s, cs) {
    s = String(s).trim().replace(/\s+/g, " ");
    return cs ? s : s.toLowerCase();
  }

  function aliasMap(ans, cs) {
    var map = {};
    (ans.canonical || []).forEach(function (c) { map[norm(c, cs)] = c; });
    var al = ans.accepted_aliases || {};
    Object.keys(al).forEach(function (c) {
      al[c].forEach(function (a) { map[norm(a, cs)] = c; });
    });
    return map;
  }

  function splitList(s, seps) {
    var parts = [String(s)];
    (seps || [",", "\n", ";"]).forEach(function (sep) {
      var next = [];
      parts.forEach(function (p) { next = next.concat(p.split(sep)); });
      parts = next;
    });
    return parts.map(function (p) { return p.trim(); }).filter(Boolean);
  }

  function check(ans, input) {
    var cs = !!ans.case_sensitive;
    var t = ans.type;
    if (t === "string") {
      var ok = (ans.accepted || [ans.canonical]).map(function (a) { return norm(a, cs); });
      return ok.indexOf(norm(input, cs)) !== -1;
    }
    if (t === "set" || t === "ordered_list") {
      var map = aliasMap(ans, cs);
      var seps = t === "ordered_list" ? (ans.accepted_separators || []).concat([","]) : [",", "\n", ";", " and "];
      var got = splitList(input, seps).map(function (p) { return map[norm(p, cs)] || null; });
      if (got.length !== ans.canonical.length || got.indexOf(null) !== -1) return false;
      if (t === "ordered_list") return got.join("\u0000") === ans.canonical.join("\u0000");
      return got.slice().sort().join("\u0000") === ans.canonical.slice().sort().join("\u0000");
    }
    if (t === "mapping") {
      var want = {};
      Object.keys(ans.canonical).forEach(function (k) { want[norm(k, false)] = norm(ans.canonical[k], false); });
      var pairs = splitList(input, [",", "\n", ";"]);
      if (pairs.length !== Object.keys(want).length) return false;
      var seen = {};
      for (var i = 0; i < pairs.length; i++) {
        var kv = pairs[i].split(/\s*(?:=>|->|=|:|\s)\s*/).filter(Boolean);
        if (kv.length !== 2) return false;
        var k = norm(kv[0], false), v = norm(kv[1], false);
        if (want[k] !== v || seen[k]) return false;
        seen[k] = true;
      }
      return true;
    }
    return false;
  }

  function progressKey(lab) { return "bifract-labs.solved." + lab; }

  function loadSolved(lab) {
    try { return JSON.parse(store(progressKey(lab)) || "{}") || {}; } catch (e) { return {}; }
  }

  function questions() {
    var board = document.querySelector(".q-board");
    if (!board || board.dataset.ready) return;
    board.dataset.ready = "1";
    var lab = board.getAttribute("data-lab");
    var total = +board.getAttribute("data-total");
    var count = +board.getAttribute("data-count");
    var solved = loadSolved(lab);

    function paint() {
      var pts = 0, n = 0;
      document.querySelectorAll(".q-card").forEach(function (card) {
        var on = !!solved[card.getAttribute("data-qid")];
        card.classList.toggle("is-solved", on);
        if (on) { pts += +card.getAttribute("data-points"); n++; }
      });
      board.querySelector(".q-score").textContent = pts + " / " + total;
      board.querySelector(".q-solved").textContent = n + " of " + count + " solved";
      board.querySelector(".q-bar i").style.width = (total ? (100 * pts / total) : 0) + "%";
    }

    document.querySelectorAll(".q-card .q-check").forEach(function (form) {
      var ans = JSON.parse(form.getAttribute("data-answer"));
      var card = form.closest(".q-card");
      var out = form.querySelector(".q-result");
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var v = form.querySelector("input").value;
        if (!v.trim()) return;
        if (check(ans, v)) {
          out.textContent = "Correct";
          out.className = "q-result ok";
          solved[card.getAttribute("data-qid")] = true;
          store(progressKey(lab), JSON.stringify(solved));
          paint();
        } else {
          out.textContent = "Not quite";
          out.className = "q-result no";
        }
      });
    });

    board.querySelector(".q-reset").addEventListener("click", function () {
      solved = {};
      store(progressKey(lab), null);
      document.querySelectorAll(".q-result").forEach(function (r) { r.textContent = ""; r.className = "q-result"; });
      paint();
    });
    paint();
  }

  function init() {
    addOpenLinks();
    instanceSettings();
    questions();
  }

  if (window.document$ && typeof window.document$.subscribe === "function") {
    window.document$.subscribe(init);
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
})();
