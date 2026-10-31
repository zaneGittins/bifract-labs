---
title: "Lab 001: Meridian workstation intrusion"
---

<p class="lb-kicker">Lab 001</p>

# Meridian workstation intrusion

Meridian is a small Windows domain, and somewhere in its logs is an intrusion. Find it and trace it from the first command to the last host it reached.

<div class="lb-actions" markdown>
[1. Set up <small>20 min</small>](setup.md){ .md-button .md-button--primary }
[2. Walkthrough](walkthrough/index.md){ .md-button }
[or Questions](questions.md){ .md-button }
</div>

<p class="lb-facts">5 hosts · Sysmon, Windows event logs, Zeek, Autoruns · Oct 27 to 30, 2026 (UTC) · 2.08M events</p>

!!! warning "Don't contact indicators"
    Attacker domains are made up and their IPs are from documentation ranges. Don't resolve or connect to anything from the dataset.

??? info "About the data"
    | | |
    |---|---|
    | **Hosts** | `DC01` (domain controller), `WS01` to `WS03` (workstations), `meridian-netmon01` (Zeek sensor) |
    | **Network** | `meridian.internal`, `10.1.10.0/24` |
    | **Sources** | Sysmon (no process access), Windows Security, System, PowerShell, Defender and WMI logs, Zeek, and Autoruns before and after the incident |
    | **Techniques** (mild hints) | [T1059.001](https://attack.mitre.org/techniques/T1059/001/), [T1036](https://attack.mitre.org/techniques/T1036/), [T1219](https://attack.mitre.org/techniques/T1219/), [T1547.001](https://attack.mitre.org/techniques/T1547/001/), [T1110.003](https://attack.mitre.org/techniques/T1110/003/), [T1021.002](https://attack.mitre.org/techniques/T1021/002/), [T1569.002](https://attack.mitre.org/techniques/T1569/002/), [T1033](https://attack.mitre.org/techniques/T1033/), [T1016](https://attack.mitre.org/techniques/T1016/), [T1082](https://attack.mitre.org/techniques/T1082/), plus the initial access technique Q003 asks you to name |
