---
hide:
  - navigation
  - toc
---

<div class="lb-hero" markdown>
<div markdown>
<p class="lb-kicker">Bifract Labs</p>

# Hunt intrusions in <span>full environment logs.</span>

Each lab is days of logs from a small Windows network, with an intrusion hidden among normal user activity. Load it into [Bifract](https://github.com/zaneGittins/bifract), then hunt it down with a guided walkthrough or a scored question set.

[Start lab 001](001/index.md){ .md-button .md-button--primary }
[Get Bifract](https://docs.bifract.io/getting-started/installation/){ .md-button }
</div>
<div class="lb-art" markdown="0" aria-hidden="true">
<div class="lb-art-bar"><i></i><i></i><i></i><span>first seen · remote tools · per user</span></div>
<pre class="lb-art-q"><code><span class="hl-field">bifract_category</span><span class="hl-operator">=</span><span class="hl-string">"process_creation"</span>
  <span class="hl-pipe">|</span> <span class="hl-function">groupBy</span>(user, tool,
      function<span class="hl-operator">=</span><span class="hl-function">min</span>(timestamp, as<span class="hl-operator">=</span>first_seen))
  <span class="hl-pipe">|</span> <span class="hl-function">sort</span>(first_seen, order<span class="hl-operator">=</span>desc)</code></pre>
<table>
<thead><tr><th>user</th><th>tool</th><th>first_seen</th></tr></thead>
<tbody>
<tr class="is-alert"><td>jen</td><td>anydesk</td><td>today</td></tr>
<tr><td>john</td><td>screenconnect</td><td>31 days ago</td></tr>
<tr><td>jen</td><td>quickassist</td><td>31 days ago</td></tr>
<tr><td>maria</td><td>teamviewer</td><td>29 days ago</td></tr>
</tbody>
</table>
</div>
</div>

## Labs

<div class="lb-lab" markdown>
<div markdown>
<p class="lb-kicker">Lab 001</p>

### [Meridian workstation intrusion](001/index.md)

A user runs a command they were told to paste. What follows is a disguised loader, a remote support session nobody approved, quiet persistence, a password spray, and a hop to a second workstation.

<ul class="lb-tags">
<li>Malicious copy and paste</li><li>Masquerading</li><li>Remote access tools</li><li>Registry persistence</li><li>Password spraying</li><li>Service execution</li>
</ul>
</div>
<div class="lb-cta" markdown>
[Open lab](001/index.md){ .md-button .md-button--primary }
</div>
</div>

## How each lab works

<div class="lb-grid" markdown>
<div class="lb-card" markdown>
:material-database-arrow-down-outline:{ .lg }

#### Real telemetry

Sysmon, Windows event logs, PowerShell, Defender, Zeek and Autoruns from every host, with normal user activity around the attack.
</div>
<div class="lb-card" markdown>
:material-map-marker-path:{ .lg }

#### Guided walkthrough

Every step shows the BQL query, a screenshot of the result, and why it matters. Each query has an Open in Bifract button.
</div>
<div class="lb-card" markdown>
:material-flag-checkered:{ .lg }

#### Scored questions

Prefer to hunt alone? Work through the question set and check your answers as you go. It also exports to CTFd.
</div>
<div class="lb-card" markdown>
:material-chart-bell-curve-cumulative:{ .lg }

#### Baselines, not just rules

Learn to find the attack by asking what is new or rare here, using Bifract's models and provenance graph.
</div>
</div>

!!! warning "Do not contact indicators"
    Attacker domains in these datasets are fictional, and attacker IP addresses come from documentation ranges. Do not resolve, browse to, or otherwise contact any indicator from a dataset. The fictional domains were unregistered when published, but someone could register them later.

Datasets and guides are licensed [CC BY 4.0](https://github.com/zaneGittins/bifract-labs/blob/main/LICENSE).
