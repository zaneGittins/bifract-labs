---
title: "2. Count days, not events"
---

<p class="lb-kicker">Chapter 2 · Q003 to Q005</p>

# Count days, not events

**Stacking** groups events by a value, counts each group and sorts by the count. `sort | uniq -c`, SQL and SIEMs all do it. A baseline of activity is usually more useful when it counts distinct days rather than raw events.

## How often did Jen use each tool? <span class="q-ref">Q003 to Q005</span> { #q003 }

<a id="q004"></a><a id="q005"></a>

This query counts Jen's executions and distinct days per tool from October 4th to November 3rd:

```bql
bifract_category="process_creation" user="larkspur\\jen"
| match(dict=lolrmm, field=image, column=InstallationPaths, include=[Name], require=true)
| strftime("%Y-%m-%d", as=day)
| day!="2026-11-04"
| groupBy(Name, function=multi(count(field=day, distinct=true, as=days), count(as=events)))
```
<!-- shot: count-days | Jen's remote access tools, October 4th to November 3rd. | rows=3 -->

<!-- figure: labs/002/figures/days-vs-events.html | Jen's remote access tools, October 4th to November 3rd. ScreenConnect has the most events and the fewest days. -->

Each day a group has a value counts as one **sighting**, however many events that day has, so one busy day can't outweigh a month of activity. In this lab, each day a user runs a RMM tool is one sighting. ScreenConnect has the most executions but only one sighting.

!!! finding "Finding · Q003 to Q005"
    **ScreenConnect** has the most events, on **1** day. Quick Assist ran on **30** days.
