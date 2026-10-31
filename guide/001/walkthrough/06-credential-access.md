---
title: "6. Credential access"
---

<p class="lb-kicker">Chapter 6 · Q017 to Q020</p>

# Credential access

<p class="lb-lede">jen.walker is an ordinary user. To go further, the attacker needs an account that can do more. Remember the for loop from chapter 4 that ran net.exe eight times? That is where this starts.</p>

## The sprayed password <span class="q-ref">Q017</span> { #q017 }

`net use` with `/user:` takes a password on the command line, and Sysmon records command lines:

```bql
bifract_category="process_creation" | image=$"\\net.exe" | commandline=~"/user:" | table(timestamp, computer_name, user, commandline) | sort(timestamp)
```
<!-- shot: q017-net-use | Four net use attempts against WS03, about 16 seconds apart. | rows=4 -->

Starting at 15:19:17, from WS02, the same command runs four times against `\\WS03\IPC$` with four different accounts and one password:

```text
net.exe use \\WS03\IPC$ /user:MERIDIAN\john.reyes Meridian2026! /persistent:no
```

One password tried against many accounts is a password spray ([T1110.003](https://attack.mitre.org/techniques/T1110/003/)). An organization name plus the year plus `!` is a classic guess.

!!! finding "Finding · Q017"
    The sprayed password is **Meridian2026!** (case sensitive).

## Which accounts said no? <span class="q-ref">Q018</span> { #q018 } <span class="q-ref">Q019</span> { #q019 }

Each `net use` triggers a Kerberos login at the domain controller. Zeek sees it on the wire:

```bql
channel="kerberos" request_type="AS" | NOT client=~"$/" | groupBy(src_ip, client, success, error_msg) | sort(client)
```
<!-- shot: q018-kerberos | Kerberos AS requests from WS02, machine accounts removed. | rows=8 -->

`KDC_ERR_PREAUTH_REQUIRED` is the normal first round trip of every Kerberos login. `KDC_ERR_PREAUTH_FAILED` means the password was wrong. `NOT client=~"$/"` drops machine accounts like `WS02$`.

DC01 logs the same failures as event 4771:

```bql
event_id="4771" | groupBy(computer_name, target_user_name, status, ip_address)
```
<!-- shot: q018-4771 | Status 0x18: bad password, from WS02. | rows=3 -->

Status `0x18` is a bad password. All three come from `10.1.10.22`, which is WS02.

!!! finding "Finding · Q018 and Q019"
    Ordinary users **john.reyes** and **maria.chen** rejected the password, and so did the admin-named account **it.admin**.

## The one that worked <span class="q-ref">Q020</span> { #q020 }

List successful logons that came from WS02:

```bql
event_id="4624" ip_address="10.1.10.22" | groupBy(computer_name, target_user_name, logon_type, authentication_package_name)
```
<!-- shot: q020-4624 | Successful logons from WS02. One is not like the others. | rows=3 -->

WS02's machine account and jen.walker log on to DC01 all the time. The one new row: **svc.wksdeploy**, a network logon (type 3) on **WS03**, 15 times, first at 15:20:06. It matches the only successful AS request in the Zeek output.

!!! finding "Finding · Q020"
    **MERIDIAN\svc.wksdeploy** accepted the sprayed password. A workstation deployment service account, which is exactly the kind of account that has admin rights on workstations.

Next: [what the attacker did with it](07-lateral-movement.md).
