---
title: "3. First seen"
---

<p class="lb-kicker">Chapter 3 · Q006 to Q007</p>

# First seen

In Bifract, a **model** defines what to count and when to flag it. The counts it keeps are its baseline.

## Is it new? <span class="q-ref">Q006 and Q007</span> { #q006 }

<a id="q007"></a>

**First seen** checks whether something has been observed before. The `remote_tools_first_seen` model tracks each combination of host, original file name (stored in the binary) and image path:

<!-- shot: model-remote-tools | `remote_tools_first_seen` on Larkspur: each remote access tool per host and when it was first and last seen. -->

This query finds the first ScreenConnect execution per host, user and original file name:

```bql
bifract_category="process_creation" original_file_name=~"screenconnect"
| groupBy(computer_name, user, original_file_name, function=multi(count(), min(timestamp, as=first)))
```
<!-- shot: first-seen-screenconnect | ScreenConnect, first seen on WS02 on October 27th and on Jen's laptop on November 3rd. | rows=6 -->

ScreenConnect is first observed on John's laptop, `WS02`, on October 27th, and on Jen's, `WS01`, on November 3rd. In live use, a new entry raises an **alert**. Backfilled history doesn't.

The model tracks hosts. Grouping by user and tool name gives first seen per user:

```bql
bifract_category="process_creation" user!=~"NT AUTHORITY"
| match(dict=lolrmm, field=image, column=InstallationPaths, include=[Name], require=true)
| groupBy(user, Name, function=min(timestamp, as=first))
| sort(first, order=desc)
```
<!-- shot: first-seen-users | Each user's first use of each remote access tool, newest first. | rows=7 -->

Sam joined on October 28th, so every remote management tool he runs is new: Quick Assist that day, then Remote Desktop on November 4th. On its own, first seen is noisy for new starters and for users who try many different tools.

!!! finding "Finding · Q006 and Q007"
    ScreenConnect ran first on **WS02**. **Sam** first ran Remote Desktop on November 4th.