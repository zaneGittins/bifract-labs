---
title: "1. Hunting with baselines"
---

<p class="lb-kicker">Chapter 1 · Q001 to Q002</p>

# Hunting with baselines

<p class="lb-lede">There's no alert to start from, so I start with what normal looks like: which tools are new, what talks on a timer, and what's rare for the user running it.</p>

Meridian only has three days of history, which is short for a baseline. That's why this chapter uses **first seen** and **network** models instead of 30-day rarity. With weeks of data in your own environment, the same questions work even better.

## What remote tools are new here?

Attackers like remote access tools because they're signed and trusted. Which ones ran on each host, and when did each first appear?

The `remote_tools_first_seen` model keys on the binary's **original file name**, the name compiled into the executable, instead of the name on disk.

<!-- shot: model-remote-tools | `remote_tools_first_seen`: every remote tool per host, with first and last sighting. -->

TeamViewer has run on WS01 since the first morning of the data, so it's the remote tool Meridian actually uses. On the third day, two new tools show up on **WS02**: RustDesk (twice) and PAExec. A minute later PAExec shows up on **WS03**.

!!! anomaly "Out of place"
    One of the RustDesk rows isn't called `rustdesk.exe`. It runs as `QuickConnectSupport.exe` from `AppData\Local\Programs\QuickConnect Support\`. A rule matching install paths or file names would miss it, but its original file name gives it away.

The **Remote management tool hunting** bundle from the Exchange asks a related question per user: is this tool rare for the person running it? Open `rmm_users` and switch to **All rows**:

<!-- shot: model-rmm-users | `rmm_users`: RustDesk and a PsExec clone (PAExec), first seen on Oct 29 for jen.walker and SYSTEM. -->

It has RustDesk and PAExec (which LOLRMM lists as a PsExec clone), both new on Oct 29, run by jen.walker and then SYSTEM. Two things stand out:

- Its LOLRMM patterns match install paths, so it finds `rustdesk.exe` but not the renamed copy. The first seen model caught both because it counts the original file name.
- **Findings** is empty and coverage is 0. With three days of history, every tool each user ran has been seen once, so there's no evidence yet that a new tool is unusual for them. After a few weeks of normal activity, the same first sighting would score as rare.

## What's talking on a timer?

Malware usually calls home on a timer, and people don't. The `outbound_beacons` model scores every internal to external pair by how regular its timing and sizes are.

Network models score a rolling window that ends now, and they can't be backfilled, so the model's page stays empty for a dataset from the past. Score the lab on demand instead: open the model, click **Edit**, open the **Scores** tab, and pick a window that reaches back to Oct 27, 2026 (**Last 30 Days** while the lab is recent).

<!-- shot: model-beacons | `outbound_beacons`: two pairs out of 949 score above 0.8, both from WS02. | narrow -->

Two pairs out of 949 cross the threshold, and both come from `10.1.10.22`, which is WS02:

| Score | Destination | Connections |
|---|---|---|
| 0.916 | `203.0.113.87:8888` | 2,496 |
| 0.875 | `192.0.2.146:21116` | 2,779 |

!!! tip "Tuning out the known good"
    The model's source query drops time sync (`dst_port!="123"`), multicast and internal destinations. Without that, DC01's NTP syncs top the list, because they're regular by design.

## What stays connected too long?

Interactive remote sessions hold a connection open. The `outbound_long_connections` model ranks outbound pairs by how long they stay up. Open it the same way: **Edit**, then **Scores**.

<!-- shot: model-long-conn | `outbound_long_connections`: the WS02 to 192.0.2.146 RustDesk pair ranks first. | narrow -->

The top pair is the same `192.0.2.146` destination the beacon model found, on RustDesk's port 21116. All three models point at WS02.

## First host <span class="q-ref">Q001</span> { #q001 }

To confirm it without models, stack count every program that the Windows shell (`explorer.exe`) started on each host, rarest first. Normal apps repeat on every workstation, so a shell started once is worth a look.

```bql
bifract_category="process_creation" parent_image=$"\\explorer.exe" | groupBy(computer_name, image) | sort(_count)
```
<!-- shot: q001-explorer-children | Programs started directly by Explorer, rarest first. | rows=8 -->

The three rarest rows are all on WS02: `cmd.exe`, `powershell.exe` and `Greenshot.exe`, each started from Explorer once. A user launching PowerShell straight from Explorer once in three days is unusual. The rest is Edge, ONLYOFFICE, Notepad, Calculator, and TeamViewer on WS01.

!!! finding "Finding · Q001"
    The first compromised workstation is **WS02**. Every model points there, and so does the earliest suspicious process tree.

## First user <span class="q-ref">Q002</span> { #q002 }

Next I filter to those shells and sort them by time.

```bql
bifract_category="process_creation" parent_image=$"\\explorer.exe" image=~powershell,cmd | sort(timestamp) | table(timestamp, computer_name, user, image, process_guid)
```
<!-- shot: q002-first-shell | Explorer-launched shells on WS02, oldest first. | rows=4 -->

The earliest is PowerShell at **2026-10-29 14:02:27**, run by `meridian\jen.walker`.

!!! finding "Finding · Q002"
    The first suspicious process tree belongs to **MERIDIAN\jen.walker**.

Next: [how that PowerShell was launched](02-initial-access.md).
