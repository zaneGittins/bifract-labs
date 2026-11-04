---
title: "6. Credential access"
---

<p class="lb-kicker">Chapter 6 · Q017 to Q020</p>

# Credential access

<p class="lb-lede">Jen Walker is a regular user, so to move laterally, the attacker needed an account with elevated privileges. This starts with the <code>net use</code> loop from chapter 4.</p>

## The sprayed password <span class="q-ref">Q017</span> { #q017 }

`net use` with `/user:` takes a password on the command line, and Sysmon records command lines:

```bql
bifract_category="process_creation" | image=$"\\net.exe" | commandline=~"/user:" | table(timestamp, computer_name, user, commandline)
```
<!-- shot: q017-net-use | Four net use attempts against WS03, about 16 seconds apart. | rows=4 -->

Starting at 15:19:17, WS02 runs the same command four times against `\\WS03\IPC$`, with four different accounts and one password:

```text
net.exe use \\WS03\IPC$ /user:MERIDIAN\john.reyes Meridian2026! /persistent:no
```

One password tried against many accounts is a password spray ([T1110.003](https://attack.mitre.org/techniques/T1110/003/)). Company name, year and `!` is a common guess.

!!! finding "Finding · Q017"
    The sprayed password is **Meridian2026!** (case sensitive).

## Which accounts failed? <span class="q-ref">Q018</span> <span class="q-ref">Q019</span> { #q018 }

<a id="q019"></a>

Each `net use` makes WS02 ask the domain controller for a Kerberos ticket (an AS-REQ), which Zeek sees on the wire:

```bql
channel="kerberos" request_type="AS" | NOT client=~"$/" | groupBy(src_ip, client, success, error_msg) | sort(client)
```
<!-- shot: q018-kerberos | Kerberos AS requests from WS02, machine accounts removed. | rows=8 -->

`KDC_ERR_PREAUTH_REQUIRED` is normal: the client's first AS-REQ has no pre-authentication data, and the KDC asks for it. `KDC_ERR_PREAUTH_FAILED` means the password was wrong. `NOT client=~"$/"` drops machine accounts like `WS02$`.

DC01 logs the same failures as event 4771:

```bql
event_id="4771" | groupBy(computer_name, target_user_name, status, ip_address)
```
<!-- shot: q018-4771 | Status 0x18 means a bad password. All three come from WS02. | rows=3 -->

All three come from `10.1.10.22`, which is WS02.

!!! finding "Finding · Q018 and Q019"
    Pre-authentication failed for regular users **john.reyes** and **maria.chen**, and for the admin-named account **it.admin**.

## The one that worked <span class="q-ref">Q020</span> { #q020 }

List successful logons that came from WS02:

```bql
event_id="4624" ip_address="10.1.10.22" | groupBy(computer_name, target_user_name, logon_type, authentication_package_name)
```
<!-- shot: q020-4624 | Successful logons from WS02. | rows=3 -->

WS02's machine account and jen.walker log on to DC01 all the time. The new row is **svc.wksdeploy**: a network logon (type 3) on **WS03**, 15 times, first at 15:20:06. It matches the only successful AS request in the Zeek output.

WS02 keeps its own record of the account being used. Logon type 9 (NewCredentials) is what `runas /netonly` and tools like PAExec create: the process keeps the user's identity on the local host but sends other credentials over the network.

```bql
computer_name=~WS02 subject_user_name=~jen.walker event_id=4624 logon_type=9
| table(timestamp, computer_name, subject_user_name, target_outbound_user_name, process_name)
```
<!-- shot: q020-logon-type9 | PAExec on WS02 runs as jen.walker with svc.wksdeploy as its network account. | rows=1 -->

At 15:28:45, `PAExec.exe` running as jen.walker sets `svc.wksdeploy` as its outbound account. That's the start of the lateral movement in [chapter 7](07-lateral-movement.md#q022).

!!! finding "Finding · Q020"
    The sprayed password was valid for **MERIDIAN\svc.wksdeploy**. Deployment accounts like this usually have local admin on workstations.

Next: [what the attacker did with it](07-lateral-movement.md).
