# Lab 001: Meridian workstation intrusion

Meridian is a small Windows domain, and somewhere in its logs is an intrusion. Find it and trace it from the first command to the last host it reached.

**Setup, the walkthrough and the questions are at [labs.bifract.io/001](https://labs.bifract.io/001/).** The quickest way in is the Bifract Exchange: **Exchange → Datasets → Lab 001: Meridian workstation intrusion**.

## The data

| | |
|---|---|
| **Hosts** | `DC01` (domain controller), `WS01` to `WS03` (workstations), `meridian-netmon01` (Zeek sensor) |
| **Network** | `meridian.internal`, `10.1.10.0/24` |
| **Time** | Oct 27 to 30, 2026 (UTC), 2,083,151 events |
| **Sources** | Sysmon (no process access), Windows Security, System, PowerShell, Defender and WMI logs, Zeek, and Autoruns before and after the incident |
| **Techniques** (mild hints) | [T1059.001](https://attack.mitre.org/techniques/T1059/001/), [T1036](https://attack.mitre.org/techniques/T1036/), [T1219](https://attack.mitre.org/techniques/T1219/), [T1547.001](https://attack.mitre.org/techniques/T1547/001/), [T1110.003](https://attack.mitre.org/techniques/T1110/003/), [T1021.002](https://attack.mitre.org/techniques/T1021/002/), [T1569.002](https://attack.mitre.org/techniques/T1569/002/), [T1033](https://attack.mitre.org/techniques/T1033/), [T1016](https://attack.mitre.org/techniques/T1016/), [T1082](https://attack.mitre.org/techniques/T1082/), plus the initial access technique Q003 asks you to name |

## Download

`bifract-labs-001.jsonl.zst` and `SHA256SUMS` are on [Releases](https://github.com/zaneGittins/bifract-labs/releases). Each line is one JSON object with `timestamp`, `log_id`, `fractal_id` and `fields`, newest first.

```bash
sha256sum -c SHA256SUMS
zstd -d bifract-labs-001.jsonl.zst
```

To load it with the CLI instead of the Exchange, see [setup](https://labs.bifract.io/001/setup/).

## In this folder

- [questions.json](questions.json): the 31 questions, with answers.
- [bifract/models](bifract/models/): the models the walkthrough uses.
- [figures](figures/): the data behind the walkthrough's figures.

## Don't contact indicators

Attacker domains are made up and their IPs are from documentation ranges. Don't resolve or connect to anything from the dataset.

These domains were unregistered as of 2026-10-30 (NXDOMAIN, and no registry record where RDAP answers), but someone could register them later:

- `update-cache-m9tdco18phmc.com`
- `support-assist-7wfncs.online`
