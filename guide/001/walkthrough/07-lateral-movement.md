---
title: "7. Lateral movement"
---

<p class="lb-kicker">Chapter 7 · Q021 to Q025</p>

# Lateral movement

<p class="lb-lede">The attacker now had a service account that works on WS03. Next they copied a payload over an admin share, installed it as a service, and let Windows run it as SYSTEM.</p>

## Where the account was used <span class="q-ref">Q021</span> { #q021 }

Pivot from the account to everywhere it logged on:

```bql
event_id="4624" target_user_name="svc.wksdeploy" | groupBy(computer_name, ip_address, logon_type, function=multi(count(), min(timestamp, as=first)))
```
<!-- shot: q021-svc-logons | svc.wksdeploy logons: one host, one source. | rows=1 -->

All 15 logons are network logons on WS03, from `10.1.10.22` (WS02).

!!! finding "Finding · Q021"
    The second foothold is **WS03**.

The account is used against WS03 again on Oct 30 (01:28 and 11:08), so the attacker kept that access.

## The tool <span class="q-ref">Q022</span> { #q022 }

Search for any command that names WS03 as a UNC path (`\\WS03`). In BQL that takes four backslashes:

```bql
event_id="1" commandline=~"\\\\WS03" | table(timestamp, hostname, user, original_file_name, commandline) | sort(timestamp)
```
<!-- shot: q022-unc | Every command that targets \\WS03, in order. | rows=10 -->

This shows the whole sequence: the spray loop, each `net use`, and at 15:28:45:

```text
PAExec.exe \\WS03 -u MERIDIAN\svc.wksdeploy -p Meridian2026! -n 30 -s -c -f -cnodel -d
  -csrc ...\QuickConnect\QuickConnect.Service.exe QuickConnect.Service.exe
```

PAExec is an open source PsExec clone. `-c` copies the implant to the target, `-s` runs it as SYSTEM, and `-d` doesn't wait for it to finish.

!!! finding "Finding · Q022"
    Lateral movement used **PAExec.exe**, started by the implant on WS02.

## Admin shares <span class="q-ref">Q023</span> { #q023 }

Zeek logs every SMB share mapping. Workstations normally only map shares on the domain controller, so leave DC01 out:

```bql
channel="smb_mapping" dst_ip!="10.1.10.10" | groupBy(src_ip, dst_ip, path, function=multi(count(), min(timestamp), max(timestamp)))
```
<!-- shot: q023-smb | The only share mappings between workstations: WS02 to WS03. | rows=2 -->

`\\WS03\IPC$` first shows up at 15:20:06, when the sprayed credential works. `\\WS03\ADMIN$` shows up at 15:28:45, when PAExec copies its service binary into `C:\Windows`.

!!! finding "Finding · Q023"
    **IPC$** carried the credential testing and **ADMIN$** the payload staging ([T1021.002](https://attack.mitre.org/techniques/T1021/002/)).

## The service <span class="q-ref">Q024</span> { #q024 }

List every service installed across the environment (System event 7045):

```bql
event_id="7045" | groupBy(hostname, service_name, image_path, account_name)
```
<!-- shot: q024-7045 | Service installs: a Defender driver on each workstation, and PAExec on WS03. | rows=4 -->

A Defender driver (`KslD`) is installed on every workstation. Only WS03 has `PAExec-6740-WS02`, running `%SYSTEMROOT%\PAExec-6740-WS02.exe -service` as LocalSystem. PAExec names its service after the process ID and host it came from.

!!! finding "Finding · Q024"
    The service name is **PAExec-6740-WS02** ([T1569.002](https://attack.mitre.org/techniques/T1569/002/)).

## Running as SYSTEM <span class="q-ref">Q025</span> { #q025 }

Follow the service binary to what it ran:

```bql
event_id="1" hostname="WS03" (image=~paexec OR parent_image=~paexec) | table(timestamp, user, parent_image, image, commandline)
```
<!-- shot: q025-system | The PAExec service and the implant it started on WS03. | rows=2 -->

`services.exe` starts the PAExec service at 15:29:06, and a second later it starts `C:\Windows\QuickConnect.Service.exe`. Both run as `NT AUTHORITY\SYSTEM`. The credential sent over the wire was svc.wksdeploy, but PAExec's `-s` flag runs the payload as SYSTEM.

!!! finding "Finding · Q025"
    The payload ran as **NT AUTHORITY\SYSTEM** on WS03.

Next: [the attacker's infrastructure, and every host that called back](08-infrastructure.md).
