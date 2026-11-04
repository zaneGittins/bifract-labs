---
title: "Lab 001 field reference"
---

<p class="lb-kicker">Lab 001 · Reference</p>

# Field reference

<p class="lb-lede">The main fields in the dataset and where they come from. You don't need this to start. Come back to it when a query or question uses a field you haven't seen.</p>

<div class="lb-fields" markdown>

## Sources

| Source | Events | Filter by |
|---|---|---|
| Sysmon | 1,843,873 | `bifract_category` or `event_id` |
| Windows Security | 56,180 | `channel="Security"` |
| Windows System, PowerShell, WMI, Defender, Application | about 6,600 | `channel` |
| Zeek | 165,335 | `channel`: `conn`, `dns`, `ssl`, `smb_mapping`, `kerberos` and others |
| Autoruns | 11,162 | `artifact="Windows.Sysinternals.Autoruns"` |

Velociraptor collected the Windows logs and Autoruns, and `artifact` names the Velociraptor artifact each event came from. Zeek events have no `artifact` and identify hosts by IP.

## Hosts and event types

| Field | What it holds | Found in |
|---|---|---|
| `hostname` | Short host name, like `WS02` | Windows events, Autoruns |
| `computer_name` | Full host name, like `WS02.meridian.internal` | Windows events |
| `event_id` | Windows event ID. Sysmon: `1` process start, `3` network connection, `7` image load, `11` file create, `13` registry value set, `22` DNS query. Security: `4624` logon, `4771` Kerberos pre-auth failure. System: `7045` service install | Windows events |
| `bifract_category` | Bifract's name for the Sysmon event type, like `process_creation`, `network_connect`, `file_write`, `registry_event`, `image_load`, `dns_query` | Sysmon |
| `channel` | Windows log name, or the Zeek log type | Windows events, Zeek |

## Processes, files and registry (Sysmon)

| Field | What it holds | Found in |
|---|---|---|
| `image`, `user`, `process_guid` | The process's path, account and unique ID | All Sysmon events |
| `parent_image`, `commandline`, `parent_process_guid` | The parent's path, the command line, and the parent's ID | Process starts |
| `original_file_name` | The name compiled into the executable, which survives a rename | Process starts, image loads |
| `trusted`, `tlsh` | Signing status and a TLSH fuzzy hash, added by Velociraptor. Only 245 process starts have a `tlsh` | Process starts |
| `image_loaded`, `signed` | The DLL loaded and whether it's signed | Image loads |
| `target_file` | The file written or deleted | File events |
| `target_object`, `details` | The registry key and the value written | Registry events |
| `query`, `query_results` | The name looked up and what it resolved to | DNS queries |

## Logons and Kerberos (Security)

| Field | What it holds | Found in |
|---|---|---|
| `target_user_name` | The account logging on | Logon events |
| `ip_address` | Where the logon came from | Logon events |
| `logon_type` | `3` is a network logon, `5` is a service starting | Logon events |
| `status` | Kerberos result code: `0x0` is success, `0x18` is a bad password | Kerberos events `4768`, `4769`, `4771` |

## Network (Zeek and Sysmon)

| Field | What it holds | Found in |
|---|---|---|
| `src_ip`, `dst_ip`, `dst_port` | Both ends of the connection | Zeek, Sysmon network connections |
| `duration`, `orig_bytes`, `conn_state` | How long it lasted, bytes the client sent, and how it ended | Zeek `conn` |
| `query`, `answers` | The DNS name and its answers | Zeek `dns` |
| `path` | The share mapped, like `\\DC01\IPC$` | Zeek `smb_mapping` |
| `client`, `request_type`, `success`, `error_msg` | The Kerberos request and its result | Zeek `kerberos` |

## Autoruns

| Field | What it holds |
|---|---|
| `category`, `entry`, `entry_location` | The type of autostart and where it's registered |
| `image_path`, `launch_string` | What it runs |
| `signer`, `sha_256` | Who signed it and its hash |

</div>
