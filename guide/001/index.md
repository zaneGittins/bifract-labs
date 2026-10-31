---
title: "Lab 001: Meridian workstation intrusion"
---

<p class="lb-kicker">Lab 001</p>

# Meridian workstation intrusion

Meridian is a small Windows domain, and somewhere in its logs is an intrusion. Find it and trace it from the first command to the last host it reached.

<div class="lb-actions" markdown>
[1. Set up the lab <small>about 20 min</small>](setup.md){ .md-button .md-button--primary }
[2. Follow the walkthrough](walkthrough/index.md){ .md-button }
[or answer the questions](questions.md){ .md-button }
</div>

The walkthrough goes through the whole investigation with every query and a screenshot of the result. The questions are 31 scored challenges for hunting on your own.

!!! warning "Don't contact indicators"
    Attacker domains are made up and their IPs are from documentation ranges. Don't resolve or connect to anything from the dataset.

## The data

| | |
|---|---|
| **Hosts** | `DC01` (domain controller), `WS01` to `WS03` (workstations), `meridian-netmon01` (Zeek sensor) |
| **Network** | `meridian.internal`, `10.1.10.0/24` |
| **Time** | Oct 27 to 30, 2026, all UTC |
| **Sources** | Sysmon (no process access), Windows Security, System, PowerShell, Defender and WMI logs, Zeek, and Autoruns before and after the incident |
| **Size** | 2,083,151 events |

??? info "ATT&CK techniques (mild hints)"
    The intrusion uses these, plus an initial access technique that Q003 asks you to name:

    [T1059.001](https://attack.mitre.org/techniques/T1059/001/) PowerShell ·
    [T1036](https://attack.mitre.org/techniques/T1036/) Masquerading ·
    [T1219](https://attack.mitre.org/techniques/T1219/) Remote Access Tools ·
    [T1547.001](https://attack.mitre.org/techniques/T1547/001/) Registry Run Keys ·
    [T1110.003](https://attack.mitre.org/techniques/T1110/003/) Password Spraying ·
    [T1021.002](https://attack.mitre.org/techniques/T1021/002/) SMB/Windows Admin Shares ·
    [T1569.002](https://attack.mitre.org/techniques/T1569/002/) Service Execution ·
    [T1033](https://attack.mitre.org/techniques/T1033/), [T1016](https://attack.mitre.org/techniques/T1016/), [T1082](https://attack.mitre.org/techniques/T1082/) Discovery
