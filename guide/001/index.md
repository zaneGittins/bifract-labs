---
title: "Lab 001: Meridian workstation intrusion"
---

<p class="lb-kicker">Lab 001</p>

# Meridian workstation intrusion

<p class="lb-lede">Meridian is a small Windows domain: one domain controller, three workstations, and a network sensor. For two days it looks like any other office. On the third day, someone gets in. Reconstruct the intrusion from the first command to the last host it touched.</p>

<div class="lb-stats" markdown>
<div class="lb-stat"><b>2.08M</b><span>events</span></div>
<div class="lb-stat"><b>3.2</b><span>days</span></div>
<div class="lb-stat"><b>5</b><span>hosts</span></div>
<div class="lb-stat"><b>31</b><span>questions</span></div>
<div class="lb-stat"><b>2,500</b><span>points</span></div>
</div>

## Choose your path

<div class="lb-grid" markdown>
<a class="lb-card" href="setup/" markdown>
:material-cog-outline:{ .lg }

#### 1. Set up

Load the dataset into Bifract, turn on endpoint analytics, and import the models. About 20 minutes.
</a>
<a class="lb-card" href="walkthrough/" markdown>
:material-map-marker-path:{ .lg }

#### 2a. Follow the walkthrough

Step by step, with every query and a screenshot of what you should see. Spoilers, by design.
</a>
<a class="lb-card" href="questions/" markdown>
:material-flag-checkered:{ .lg }

#### 2b. Hunt on your own

31 scored questions from triage to scope. Check answers as you go, with hints when you are stuck.
</a>
</div>

## Environment

| Host | Role |
|---|---|
| `DC01` | Domain controller |
| `WS01`, `WS02`, `WS03` | Windows workstations |
| `meridian-netmon01` | Network sensor (Zeek) |

Domain `meridian.internal`, internal network `10.1.10.0/24`. All timestamps are UTC.

## What is in the data

| Source | What it shows |
|---|---|
| Sysmon | Process starts, network connections, file writes, registry changes, image loads, DNS queries |
| Windows event logs | Security (logons, failures, Kerberos, shares), System (services), PowerShell, Defender, WMI |
| Zeek | Connections, DNS, SMB, TLS and more from the network sensor |
| Autoruns | A collection from each workstation before and after the incident |

Sysmon process access (event 10) is left out to keep the download small.

## Techniques

You will see these ATT&CK techniques. Finding where is the lab.

| Technique | Observed behavior |
|---|---|
| [T1204.004 Malicious Copy and Paste](https://attack.mitre.org/techniques/T1204/004/) | A copied command is executed through the Windows Run dialog |
| [T1059.001 PowerShell](https://attack.mitre.org/techniques/T1059/001/) | PowerShell retrieves and extracts the initial bundle |
| [T1036 Masquerading](https://attack.mitre.org/techniques/T1036/) | Renamed executables conflict with original-file metadata |
| [T1219 Remote Access Tools](https://attack.mitre.org/techniques/T1219/) | An unauthorized remote-access tool provides interactive control |
| [T1547.001 Registry Run Keys](https://attack.mitre.org/techniques/T1547/001/) | A user Run value launches the persistent host |
| [T1110.003 Password Spraying](https://attack.mitre.org/techniques/T1110/003/) | One password is tested against multiple domain identities |
| [T1021.002 SMB/Windows Admin Shares](https://attack.mitre.org/techniques/T1021/002/) | Administrative SMB shares support remote access and staging |
| [T1569.002 Service Execution](https://attack.mitre.org/techniques/T1569/002/) | A remote service launches the payload on another workstation |
| [T1033](https://attack.mitre.org/techniques/T1033/), [T1016](https://attack.mitre.org/techniques/T1016/), [T1082](https://attack.mitre.org/techniques/T1082/) Discovery | Native tools collect user, network, and system information |

## Download

`bifract-labs-001.jsonl.zst` and `SHA256SUMS` are on [GitHub Releases](https://github.com/zaneGittins/bifract-labs/releases). [Setup](setup.md) walks through loading them.

!!! warning "Do not contact indicators"
    Intrusion domains are fictional and attacker infrastructure uses documentation address ranges. Do not resolve or contact any indicator from the dataset. The fictional domains were unregistered as of 2026-10-30 (NXDOMAIN, and no registry record where RDAP answers), but someone could register them later.
