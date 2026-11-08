---
title: "4. Coverage and rarity"
---

<p class="lb-kicker">Chapter 4 · Q008 to Q011</p>

# Coverage and rarity

## How well does the baseline cover Jen's tools? <span class="q-ref">Q008</span> { #q008 }

A group's **active days** are the days with any value. **Rarity** is the share of those days that include a given value. A low share only means something if the baseline has already seen most of the group's values. **Good–Turing sample coverage** estimates how much it has seen:

**coverage = 1 − N₁ / N**

- **N:** the group's sightings, summed across its values.
- **N₁:** values with only one sighting, called **singletons**. Jen's Quick Assist has 30 sightings. Her ScreenConnect has one, so it is a singleton.

In this lab, a user's active days are the days they ran any matched tool.

For [Jen on November 3rd](02-count-days.md#q003):

<!-- figure: labs/002/figures/good-turing.html | Jen's 53 sightings, October 4th to November 3rd. ScreenConnect is the only singleton, so coverage is 1 − 1 ÷ 53 = 0.98. -->

Coverage estimates the chance that the next sighting is a value already in the baseline, assuming behavior stays similar. Alan Turing developed the method at Bletchley Park during World War II, while breaking Enigma. It estimated how likely the next message was to use a code group not yet seen, the same question asked here about tools. His statistical assistant, I. J. Good, published it in 1953.

A rarity model flags a value when its rarity is under a **rarity threshold**, and only for groups whose coverage is above a **coverage threshold**. In this lab, they are 10% and 0.9. Jen's 0.98 passes, so a rare tool for her can become a finding. High coverage doesn't show that the history is long enough or that the telemetry is complete.

!!! finding "Finding · Q008"
    Jen's coverage on November 3rd is **0.98**.

## Back for a second day <span class="q-ref">Q009 to Q011</span> { #q009 }

<a id="q010"></a><a id="q011"></a>

ScreenConnect returns on November 4th. It is no longer new, but it may still be rare.

`rmm_tool_per_user` reports a **finding** when a tool is under the rarity threshold and the user is above the coverage threshold. Its columns:

| Column | Meaning |
|---|---|
| `model_count` | Days the user ran the tool |
| `model_total` | The user's active days |
| `percent` | `model_count` as a percentage of `model_total` |

<!-- shot: model-rmm-tool | `rmm_tool_per_user` after the backfill: two findings, Jen's ScreenConnect and Priya's Splashtop. -->

### Same tool, different baseline

| ScreenConnect | Jen | John |
|---|---:|---:|
| Days used / active days | 2 / 31 | 2 / 23 |
| Rarity under 10%? | Yes (6.45%) | Yes (8.70%) |
| Coverage | 1.00 | 0.83 |
| Meets both thresholds? | **Yes** | **No** |

ScreenConnect is rare for both. Jen's other tools repeat, while John has ten singletons. His lower coverage keeps ScreenConnect out of the findings.

<details class="info" markdown="1">
<summary>Inspect all rare user and tool pairs</summary>

Every rare pair, before the coverage threshold:

```bql
bifract_category="process_creation" user!=~"NT AUTHORITY"
| match(dict=lolrmm, field=image, column=InstallationPaths, include=[Name], require=true)
| modelLookup(model="rmm_tool_per_user", key=[user, Name])
| percent < 10
| groupBy(user, Name, model_count, model_total, percent, coverage)
| sort(coverage)
```
<!-- shot: rarity-rare-pairs | John's eleven rare pairs at coverage 0.83, then Priya's Splashtop and Jen's ScreenConnect. | rows=13 -->

Of 13 rare pairs, John's 11 fail the coverage threshold: ScreenConnect plus ten singletons. Jen's ScreenConnect and Priya's Splashtop pass.

</details>

Priya's Splashtop appears on 1 of 23 active days. It could be vendor support or an intrusion. A finding is a lead to investigate, not proof of malicious activity.

!!! tip "Pair them"
    First seen flags the first observation, even with little history. Rarity can also flag later ones.

!!! finding "Finding · Q009 to Q011"
    The model flags **Jen** and **Priya**. John's coverage is **0.83**, and he has **10** singletons.
