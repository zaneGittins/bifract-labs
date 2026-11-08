---
title: "Lab 002 walkthrough"
---

# Baselines, step by step

![](../../assets/art/walkthrough-calendar.webp){ .lb-spot .no-zoom width="480" height="480" }

<p class="lb-lede">Remote monitoring and management (RMM) tools support legitimate IT work, but <a href="https://attack.mitre.org/techniques/T1219/">attackers use them too</a>. Larkspur's service desk uses them daily, so alerting on every execution would be noisy. This lab uses baselines to find remote access tools that are new or rare for the user who ran them.</p>

!!! info "Before you start"
    Finish [setup](../setup.md), including the backfills. Search with the dataset's range, **October 4th to November 5th, 2026**. All times are UTC. Hover over a query for an **Open in Bifract** button.

## Chapters

<ol class="lb-chapters">
<li><span class="lb-qs">Q001 to Q002</span><a href="01-choose/">Choose what to count</a><p>Survey the remote access tools, then choose what to count and how to group it.</p></li>
<li><span class="lb-qs">Q003 to Q005</span><a href="02-count-days/">Count days, not events</a><p>Compare one busy session with a month of ordinary use.</p></li>
<li><span class="lb-qs">Q006 to Q007</span><a href="03-first-seen/">First seen</a><p>Find when a tool was first observed.</p></li>
<li><span class="lb-qs">Q008 to Q011</span><a href="04-coverage-rarity/">Coverage and rarity</a><p>Follow ScreenConnect into a second day and compare Jen with John.</p></li>
<li><span class="lb-qs">Q012 to Q014</span><a href="05-check-model/">Check the model</a><p>Check coverage, workload and history, then examine a bad model.</p></li>
<li><a href="06-takeaways/">Takeaways</a><p>What to carry over to other data.</p></li>
</ol>
