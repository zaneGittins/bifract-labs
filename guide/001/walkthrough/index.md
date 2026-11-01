---
title: "Lab 001 walkthrough"
---

# Walkthrough

<p class="lb-lede">This is how I'd work the intrusion, from no alert at all to a full timeline. Every question in the question set is answered along the way, tagged like <span class="q-ref" style="margin:0">Q001</span>.</p>

!!! info "Before you start"
    Finish [setup](../setup.md). If you loaded the lab from the Exchange or Codespaces, the fractal already opens on the dataset's time range. Otherwise set a custom range of **Oct 27 to Nov 1, 2026**. All times are UTC. Hover over any query to get an **Open in Bifract** button.

<ol class="lb-chapters">
<li><span class="lb-qs">Q001 to Q002</span><a href="01-baselines/">Hunting with baselines</a><p>Use models to find what's new or unusual, and the first host.</p></li>
<li><span class="lb-qs">Q003 to Q004</span><a href="02-initial-access/">Initial access</a><p>The command pasted into the Run dialog, and what it downloaded.</p></li>
<li><span class="lb-qs">Q005 to Q009</span><a href="03-loader/">The loader</a><p>A signed program running under another name, and the payload it starts.</p></li>
<li><span class="lb-qs">Q010 to Q013</span><a href="04-hands-on-keyboard/">Hands on keyboard</a><p>Discovery commands, a renamed remote support tool, and commands typed by a person.</p></li>
<li><span class="lb-qs">Q014 to Q016</span><a href="05-persistence/">Persistence</a><p>A screenshot tool set to start at logon, loading a DLL it shouldn't.</p></li>
<li><span class="lb-qs">Q017 to Q020</span><a href="06-credential-access/">Credential access</a><p>A password tried against four accounts.</p></li>
<li><span class="lb-qs">Q021 to Q025</span><a href="07-lateral-movement/">Lateral movement</a><p>Admin shares and a remote service onto a second workstation.</p></li>
<li><span class="lb-qs">Q026 to Q031</span><a href="08-infrastructure/">Infrastructure and scope</a><p>The attacker's domains, IPs and ports, and every host that called back.</p></li>
<li><a href="09-summary/">Timeline and takeaways</a><p>The intrusion on one page, the indicators, and detection ideas.</p></li>
</ol>

## How to read a step

```bql
bifract_category="process_creation" parent_image=$"\\explorer.exe"
  | groupBy(computer_name, image) | sort(_count)
```

Queries are [BQL](https://docs.bifract.io/bql/basics/): filters first, then a pipe into each transform. Under each query is a screenshot of what you should see. A purple box sums up what the step found:

!!! finding "Finding"
    What the step showed, and the answer to any question it covers.

An orange box marks something out of place:

!!! anomaly "Out of place"
    Something that doesn't fit the baseline.
