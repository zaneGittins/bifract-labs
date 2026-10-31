# Lab 001: Meridian workstation intrusion

A Windows intrusion investigation spanning endpoint, identity, and network telemetry. Reconstruct the attack from initial user execution through persistence, credential abuse, lateral movement, and scoping.

**Setup, a step-by-step walkthrough and the scored question set are at [labs.bifract.io/001](https://labs.bifract.io/001/).** Load it in one click from the Bifract Exchange (**Exchange → Datasets → Lab 001**).

## ATT&CK focus

| Technique | Directly observed behavior |
|---|---|
| [T1204.004 Malicious Copy and Paste](https://attack.mitre.org/techniques/T1204/004/) | A copied command is executed through the Windows Run dialog |
| [T1059.001 PowerShell](https://attack.mitre.org/techniques/T1059/001/) | PowerShell retrieves and extracts the initial bundle |
| [T1036 Masquerading](https://attack.mitre.org/techniques/T1036/) | Renamed executables conflict with original-file metadata |
| [T1219 Remote Access Tools](https://attack.mitre.org/techniques/T1219/) | An unauthorized remote-access tool provides interactive control |
| [T1547.001 Registry Run Keys / Startup Folder](https://attack.mitre.org/techniques/T1547/001/) | A user Run value launches the persistent host |
| [T1110.003 Password Spraying](https://attack.mitre.org/techniques/T1110/003/) | One password is tested against multiple domain identities |
| [T1021.002 SMB/Windows Admin Shares](https://attack.mitre.org/techniques/T1021/002/) | Administrative SMB shares support remote access and staging |
| [T1569.002 Service Execution](https://attack.mitre.org/techniques/T1569/002/) | A remote service launches the payload on another workstation |
| [T1033 System Owner/User Discovery](https://attack.mitre.org/techniques/T1033/), [T1016 System Network Configuration Discovery](https://attack.mitre.org/techniques/T1016/), [T1082 System Information Discovery](https://attack.mitre.org/techniques/T1082/) | Native tools collect user, network, and system information |

## What you will practice

- Reconstructing process lineage across multiple hosts
- Identifying renamed, signed, and dual-use binaries
- Correlating persistence across registry, file, and image-load evidence
- Investigating password spraying and remote service execution
- Mapping attacker infrastructure and determining incident scope

## Dataset

`bifract-labs-001.jsonl.zst` contains roughly three days of normalized telemetry, newest event first. Each line is one JSON object with `timestamp`, `log_id`, `fractal_id`, and `fields`.

Sources include Sysmon, Windows event logs, PowerShell, Defender, WMI, Zeek, and pre/post-incident Autoruns collections. Sysmon process access (event 10) is excluded to keep the dataset small.

Download it and `SHA256SUMS` from [Releases](https://github.com/zaneGittins/bifract-labs/releases), then:

```bash
sha256sum -c SHA256SUMS
zstd -d bifract-labs-001.jsonl.zst
```

The source question set is in [questions.json](questions.json). The models the walkthrough uses are in [bifract/models](bifract/models/).

## Environment

| Host | Role |
|---|---|
| `DC01` | Domain controller |
| `WS01`, `WS02`, `WS03` | Windows workstations |
| `meridian-netmon01` | Network sensor |

Domain: `meridian.internal`  
Internal network: `10.1.10.0/24`

## Safety

Intrusion domains are fictional and attacker infrastructure uses documentation address ranges. Do not resolve or contact any indicator from the dataset.

These fictional domains were unregistered as of 2026-10-30 (NXDOMAIN, and no registry record where RDAP answers). Someone could register them later.

- `update-cache-m9tdco18phmc.com`
- `support-assist-7wfncs.online`

Provided for education, analyst training, CTFs, and defensive research.
