---
title: "5. Check the model"
---

<p class="lb-kicker">Chapter 5 · Q012 to Q014</p>

# Check the model

## Will this work here? <span class="q-ref">Q012 and Q013</span> { #q012 }

<a id="q013"></a>

Run these three checks before relying on a rarity model.

### 1. Does the baseline cover most groups?

A group under the coverage threshold never produces findings, however rare its values. Some groups will always be low, such as new starters and people who keep trying new tools. If most groups, or the ones that matter most, stay low after weeks of history, the value is probably too specific.

Ideally a model has **coverage > coverage threshold**, for most groups.

In this lab, of the five users with more than 10 active days, four pass: Jen, Marcus, Dana and Priya. John's 0.83 doesn't, so his rare tools never become findings.

### 2. Is the workload manageable?

Each singleton was new once and never repeated. Their rate estimates how many new group and value pairs analysts will see:

**new pairs a day ≈ N₁ ÷ T**

- **N₁:** singletons, summed across all groups.
- **T:** total days in the baseline, whether or not anything was seen.

In this lab, 19 ÷ 32 ≈ 0.6 a day, about four a week. Ten are John's tools and seven are single Quick Assist sightings by other users. Compare the rate with the time available to investigate. It's a rough guide, not an alert forecast.

### 3. Can rarity flag anything?

A singleton is the rarest possible value, at 1 ÷ active days. A group can produce rarity findings only when:

**active days > 1 ÷ rarity threshold**

In this lab, the rarity threshold is 10%, and 1 ÷ 0.10 = 10, so a group needs more than 10 active days. Five users qualify: Jen, John, Marcus, Priya and Dana. Sam has 6, so a singleton is 1 ÷ 6 ≈ 16.7% and rarity can't flag him yet. First seen still can.

<!-- figure: labs/002/figures/history.html | Active days per user in rmm_tool_per_user. With a 10% rarity threshold, a group needs more than 10 active days before a singleton can count as rare. -->

!!! finding "Finding · Q012 and Q013"
    **5** users have enough history. Sam has **6** active days.

## A bad model <span class="q-ref">Q014</span> { #q014 }

`commandline_per_user` counts days per user and exact command line. It is a deliberately poor choice for these events.

<!-- shot: model-cmdline | `commandline_per_user`: tens of thousands of values, and no user's coverage gets near 0.9. -->

Browsers, Teams and installers put changing handles, versions and temporary paths in their command lines. This query compares Edge executions with distinct command lines:

```bql
bifract_category="process_creation" user!=~"NT AUTHORITY" image=$"\\msedge.exe"
| groupBy(user, function=multi(count(as=executions), count(field=commandline, distinct=true, as=command_lines)))
| sort(executions, order=desc)
```
<!-- shot: cmdline-edge | Edge executions and distinct command lines per user: nearly every execution is new. | rows=8 -->

Jen's 861 Edge executions have 798 distinct command lines. Across users, about 36,000 of the model's 38,000 pairs are singletons.

No user's coverage exceeds 0.52, so **Findings** is empty. The coverage threshold suppressed the results, which says nothing about whether the activity is benign. Values that repeat, such as normalized program names or parent and child process pairs, work better.

!!! finding "Finding · Q014"
    The highest coverage in `commandline_per_user` is **0.52**.
