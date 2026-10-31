---
title: "Lab 001 walkthrough"
---

<p class="lb-kicker">Lab 001 · Walkthrough</p>

# Walkthrough

<p class="lb-lede">Nine short chapters take you from "something is wrong" to a full timeline. Each step shows the query, what you should see, and why it matters. Every question in the question set is answered along the way, tagged like <span class="q-ref" style="margin:0">Q001</span>.</p>

!!! info "Before you start"
    Finish [setup](../setup.md), then set the search time range to a **custom range of Oct 27 to Nov 1, 2026**. All times are UTC. Every query block has an **Open in Bifract** button (top right, on hover) that runs it in your instance.

<ol class="lb-chapters">
<li><span class="lb-qs">Q001 to Q002</span><a href="01-baselines/">Hunting with baselines</a><p>Ask what is new or unusual here, and let the models point at the first victim.</p></li>
<li><span class="lb-qs">Q003 to Q004</span><a href="02-initial-access/">Initial access</a><p>A command pasted into the Run dialog, and what it downloaded.</p></li>
<li><span class="lb-qs">Q005 to Q009</span><a href="03-loader/">The loader</a><p>A signed program that is not what its name says, and the payload it starts.</p></li>
<li><span class="lb-qs">Q010 to Q013</span><a href="04-hands-on-keyboard/">Hands on keyboard</a><p>Automated discovery, a disguised remote support tool, and a human at the keyboard.</p></li>
<li><span class="lb-qs">Q014 to Q016</span><a href="05-persistence/">Persistence</a><p>A trusted screenshot tool that loads code it should not.</p></li>
<li><span class="lb-qs">Q017 to Q020</span><a href="06-credential-access/">Credential access</a><p>One password, four accounts, one success.</p></li>
<li><span class="lb-qs">Q021 to Q025</span><a href="07-lateral-movement/">Lateral movement</a><p>Admin shares, a remote service, and SYSTEM on a second workstation.</p></li>
<li><span class="lb-qs">Q026 to Q031</span><a href="08-infrastructure/">Infrastructure and scope</a><p>Map the attacker's domains, IPs and ports, and find every host that called home.</p></li>
<li><a href="09-summary/">Timeline and takeaways</a><p>The whole intrusion on one page, the indicators, and what would have caught it sooner.</p></li>
</ol>

## How to read a step

```bql
bifract_category="process_creation" parent_image=$"\\explorer.exe"
  | groupBy(computer_name, image) | sort(_count)
```

Queries are [BQL](https://docs.bifract.io/bql/basics/): filter first, then pipe into transforms. A screenshot below each query shows what your result should look like. A purple box sums up what the step found:

!!! finding "Finding"
    What the step proved, and the answer to any question it covers.

Orange marks something out of place, the thing worth chasing:

!!! anomaly "Out of place"
    Something that does not fit the baseline.
