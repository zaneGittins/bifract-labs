---
title: "Lab 001: Meridian workstation intrusion"
---

<p class="lb-kicker">Lab 001</p>

# Meridian workstation intrusion

Meridian is a small Windows domain with one domain controller, three workstations and a network sensor. The dataset covers about three days of logs from every host, and somewhere in it is an intrusion. Your job is to find it and trace it from the first command to the last host it reached.

There are two ways to work through it:

- **[Walkthrough](walkthrough/index.md):** I go through the investigation step by step, with every query and a screenshot of the result. Spoilers, obviously.
- **[Questions](questions.md):** 31 questions worth 2,500 points. Hunt on your own and check your answers as you go.

Either way, start with [setup](setup.md). It takes about 20 minutes.

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

The intrusion uses these ATT&CK techniques, plus an initial access technique that Q003 asks you to name. Finding where is up to you.

- [T1059.001](https://attack.mitre.org/techniques/T1059/001/) PowerShell
- [T1036](https://attack.mitre.org/techniques/T1036/) Masquerading
- [T1219](https://attack.mitre.org/techniques/T1219/) Remote Access Tools
- [T1547.001](https://attack.mitre.org/techniques/T1547/001/) Registry Run Keys
- [T1110.003](https://attack.mitre.org/techniques/T1110/003/) Password Spraying
- [T1021.002](https://attack.mitre.org/techniques/T1021/002/) SMB/Windows Admin Shares
- [T1569.002](https://attack.mitre.org/techniques/T1569/002/) Service Execution
- [T1033](https://attack.mitre.org/techniques/T1033/), [T1016](https://attack.mitre.org/techniques/T1016/), [T1082](https://attack.mitre.org/techniques/T1082/) Discovery

## Download

`bifract-labs-001.jsonl.zst` and `SHA256SUMS` are on [GitHub Releases](https://github.com/zaneGittins/bifract-labs/releases). [Setup](setup.md) covers loading them.

!!! warning "Don't contact indicators"
    The attacker's domains are made up and their IP addresses come from documentation ranges. Don't resolve, browse to or otherwise contact anything from the dataset. The domains were unregistered as of 2026-10-30, but someone could register them later.
