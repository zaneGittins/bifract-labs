---
title: "1. Hunting with baselines"
---

<p class="lb-kicker">Chapter 1 · Q001 to Q002</p>

# Hunting with baselines

<p class="lb-lede">Nobody has told you what happened. There is no alert to start from. So start from the one advantage you have over an attacker: you can know what normal looks like here. Ask what is new, what is regular when it should not be, and what is rare for the person running it.</p>

Meridian has only three days of history, which is short for a baseline. That is why this chapter uses **first seen** and **network** models rather than 30-day rarity. In your own environment, with weeks of data, the same questions get sharper.

## What remote tools are new here?

Remote access tools are a favorite of intruders because they are signed, trusted and built for exactly what an attacker wants. So the first question is simple: which remote access or remote execution tools ran on each host, and when did each first appear?

The `remote_tools_first_seen` model keys on the binary's **original file name**, the name compiled into the executable, not the name on disk. That matters, as you are about to see.

<!-- shot: model-remote-tools | `remote_tools_first_seen`: every remote tool per host, with first and last sighting. -->

TeamViewer has run on WS01 since the first morning of the data. That is the sanctioned remote tool here. On the third day, two new tools appear on **WS02**: RustDesk, twice, and PAExec. Then PAExec shows up on **WS03** a minute later.

!!! anomaly "Out of place"
    One of the RustDesk rows is not called `rustdesk.exe`. It runs as `QuickConnectSupport.exe` from `AppData\Local\Programs\QuickConnect Support\`. A rule matching install paths or file names would miss it. Its original file name gives it away.

The **Remote management tool hunting** bundle from the Exchange asks a related question per user: is this tool rare for the person running it? Open `rmm_users` and switch to **All rows**:

<!-- shot: model-rmm-users | `rmm_users`: RustDesk and a PsExec clone (PAExec), first seen on Oct 29 for jen.walker and SYSTEM. -->

It sees RustDesk and PAExec (listed by LOLRMM as a PsExec clone), new on Oct 29, run by jen.walker and then by SYSTEM. Two things are worth noticing:

- Its LOLRMM patterns match install paths, so it finds `rustdesk.exe` but not the renamed copy. The first-seen model above caught both because it counts the original file name. Choosing the right value to count matters.
- **Findings** is empty and coverage is 0. With three days of history, every tool each user ran has been seen exactly once, so there is no evidence yet that new tools are unusual for them. The model is right to hold back. Give it a few weeks of a normal network and the same first sighting would score as rare.

## What is talking on a rhythm?

Malware that calls home tends to do it on a timer. People do not. The `outbound_beacons` model scores every internal-to-external pair by how regular its timing and sizes are.

Network models score a rolling window that ends now, and they cannot be backfilled, so their own page stays empty for a dataset from the past. Score the lab on demand instead: open the model, click **Edit**, open the **Scores** tab, and pick a window that reaches back to Oct 27, 2026 (**Last 30 Days** while the lab is recent).

<!-- shot: model-beacons | `outbound_beacons`: two pairs out of 949 score above 0.8, both from WS02. -->

Two pairs out of 949 cross the threshold, and both come from `10.1.10.22`, which is WS02:

| Score | Destination | Connections |
|---|---|---|
| 0.895 | `203.0.113.87:8888` | 2,496 |
| 0.851 | `192.0.2.146:21116` | 2,779 |

!!! tip "Tuning out the known-good"
    The model's source query drops time sync (`dst_port!="123"`), multicast and internal destinations. Without that, DC01's NTP syncs top the list, because they are regular by design. Making normal boring is what lets the strange stand out.

## What stays connected too long?

Interactive remote sessions hold a connection open. The `outbound_long_connections` model ranks outbound pairs by how long they stay up. Open it the same way: **Edit**, then **Scores**.

<!-- shot: model-long-conn | `outbound_long_connections`: the WS02 to 192.0.2.146 RustDesk pair ranks first. -->

The top pair is the same `192.0.2.146` destination the beacon model found, on RustDesk's port 21116. Three questions, three models, and they all point at one workstation.

## Patient zero <span class="q-ref">Q001</span> { #q001 }

Confirm it without models. Stack-count every program that the Windows shell (`explorer.exe`) started directly on each host, rarest first. Normal user apps repeat on every workstation. A shell started once is worth a look.

```bql
bifract_category="process_creation" parent_image=$"\\explorer.exe" | groupBy(computer_name, image) | sort(_count)
```
<!-- shot: q001-explorer-children | Programs started directly by Explorer, rarest first. | rows=8 -->

The three rarest rows are all on WS02: `cmd.exe`, `powershell.exe` and `Greenshot.exe`, each started by the user's shell exactly once. A user launching PowerShell straight from Explorer, once in three days, is unusual. Everything else is ordinary: Edge, ONLYOFFICE, Notepad, Calculator, and TeamViewer on WS01.

!!! finding "Finding · Q001"
    The first compromised workstation is **WS02**. Every model points there, and the earliest suspicious process tree is there.

## The first identity <span class="q-ref">Q002</span> { #q002 }

Drill into those shells and sort them by time.

```bql
bifract_category="process_creation" parent_image=$"\\explorer.exe" image=~powershell,cmd | sort(timestamp) | table(timestamp, computer_name, user, image, process_guid)
```
<!-- shot: q002-first-shell | Explorer-launched shells on WS02, oldest first. | rows=4 -->

The earliest is PowerShell at **2026-10-29 14:02:27**, run by `meridian\jen.walker`. Keep its `process_guid` (`9D045BEA-51F3-6AE3-B63D-000000001100`); it is the root of everything that follows.

!!! finding "Finding · Q002"
    The first suspicious process tree belongs to **MERIDIAN\jen.walker**.

Next: [how that PowerShell got launched](02-initial-access.md).
