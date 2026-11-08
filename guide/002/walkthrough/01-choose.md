---
title: "1. Choose what to count"
---

<p class="lb-kicker">Chapter 1 · Q001 to Q002</p>

# Choose what to count

IT staff use remote access tools every day, and so do attackers. One execution says little on its own. Whether it's normal depends on who ran it and how often.

## Which remote access tools run here?

The **process image** (`image`) is the executable's full path. `match()` compares it with Magic Sword's [LOLRMM](https://lolrmm.io) lookup and **enriches** the event with the tool's name. `require=true` drops events without a match, and the first line excludes service accounts.

```bql
bifract_category="process_creation" user!=~"NT AUTHORITY"
| match(dict=lolrmm, field=image, column=InstallationPaths, include=[Name], require=true)
| groupBy(Name, function=multi(count(field=user, distinct=true, as=users), count(as=events)))
| sort(users, order=desc)
```
<!-- shot: choose-survey | Remote access tools at Larkspur, by number of users. | rows=14 -->

Quick Assist has 28 users, so it is normal almost everywhere. ScreenConnect has the most events but only two users. Nine tools ran for one user each, all of them John. He also ran Splashtop, which Priya ran too.

A **baseline** records what an environment looked like at a point in time or over a period. This lab counts a **value**, the remote access tool, within a **group**, the user, because a tool the help desk uses daily can still be new for someone else. Departments or roles with similar activity also make good groups.

## Why count names, not paths? <span class="q-ref">Q001 and Q002</span> { #q001 }

<a id="q002"></a>

Raw paths change when software updates. Quick Assist is a Windows Store app with its version in the folder name:

```bql
bifract_category="process_creation" image=$"\\QuickAssist.exe"
| regex("QuickAssist_(?<version>[0-9.]+)_x64", field=image)
| groupBy(version, function=multi(count(), min(timestamp, as=first), max(timestamp, as=last)))
```
<!-- shot: choose-quickassist | Two Quick Assist versions: the Store updated it on Patch Tuesday. | rows=2 -->

The newer version arrives on October 13th, Patch Tuesday, and rolls out across hosts. Counted by path, the update looks like a new tool. The lookup maps both paths to Quick Assist, so counting by name **normalizes** them to one value.

Patch Tuesday is also the busiest day in the data:

```bql
bifract_category="process_creation"
| strftime("%Y-%m-%d", as=day)
| groupBy(day)
| sort(_count, order=desc)
```
<!-- shot: busiest-day | Process creation events per day, busiest first. | rows=5 -->

October 13th has 11,286 process creation events from installers, reboots and logons. Weekends are quieter because laptops are off while desktops keep running.

!!! finding "Finding · Q001 and Q002"
    There are **2** Quick Assist paths, and the busiest day is **October 13th**.
