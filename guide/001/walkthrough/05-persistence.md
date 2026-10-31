---
title: "5. Persistence"
---

<p class="lb-kicker">Chapter 5 · Q014 to Q016</p>

# Persistence

<p class="lb-lede">The attacker does not want to depend on a Python process in Temp. They want something that starts at every logon and looks like it belongs. A legitimate, signed program is the perfect host, as long as it will load their code.</p>

## A trusted process turns <span class="q-ref">Q014</span> { #q014 }

Programs in `Program Files` load DLLs from `Program Files` and `Windows`. One that loads an **unsigned DLL from a user profile** is worth a look. Sysmon event 7 records image loads:

```bql
bifract_category="image_load" signed="false" | image_loaded=~"\\Users\\" | groupBy(computer_name, image, image_loaded)
```
<!-- shot: q014-image-loads | Unsigned DLLs loaded from user profiles. | rows=2 -->

Two rows. One is the implant loading itself. The other is **Greenshot**, a signed screenshot tool, loading `QuickConnect.ImageCache.dll` from `AppData\Roaming\Greenshot\`.

Now look at what Greenshot does, both processes it starts and where it connects:

```bql
(bifract_category="process_creation" parent_image=$"\\Greenshot.exe") OR (bifract_category="network_connect" image=$"\\Greenshot.exe") | groupBy(bifract_category, image, commandline, dst_ip, dst_port)
```
<!-- shot: q014-behavior | Greenshot's children and network destinations. | rows=6 -->

A screenshot tool that runs `whoami /all`, `ipconfig /all` and `systeminfo`, and connects to `203.0.113.87:8888` 2,494 times: the same IP and port the implant uses.

!!! finding "Finding · Q014"
    The legitimate program that turned is **C:\Program Files\Greenshot\Greenshot.exe**.

## What starts it at logon? <span class="q-ref">Q015</span> { #q015 }

Hold the fleet's Run keys up against each other: which values exist, on which hosts, written by what, and when each first appeared.

```bql
event_id="13" | contains(target_object, "\\CurrentVersion\\Run")
  | groupBy(hostname, image, target_object, details,
      function=multi(selectFirst(timestamp, as=first_seen), count(as=writes)))
  | sort(first_seen, order=desc)
```
<!-- shot: q015-run-keys | Every Run and RunOnce value written, newest first. | rows=8 -->

Edge rewrites its `MicrosoftEdgeAutoLaunch_*` value on every workstation, many times. One value is different: `...\CurrentVersion\Run\Greenshot` on WS02, written once, by **`reg.exe`** rather than by an installer.

```bql
bifract_category="process_creation" | image=$"\\reg.exe" | parent_image=~QuickConnect | table(timestamp, computer_name, user, parent_image, commandline)
```
<!-- shot: q015-reg-add | The implant writes the Run value at 14:42:50. | rows=1 -->

```text
reg.exe add HKCU\Software\Microsoft\Windows\CurrentVersion\Run /v Greenshot /t REG_SZ
  /d "\"C:\Program Files\Greenshot\Greenshot.exe\"" /f
```

!!! finding "Finding · Q015"
    The persistence value is **HKCU\Software\Microsoft\Windows\CurrentVersion\Run\Greenshot** ([T1547.001](https://attack.mitre.org/techniques/T1547/001/)). Sysmon shows the key as `HKU\<SID>\...`; the `reg add` command shows the `HKCU` form.

!!! info "Why Autoruns does not show it"
    The dataset includes Autoruns collections from before and after the incident. Both show a legitimate machine-wide `HKLM\...\Run\Greenshot` entry. The attacker's per-user `HKCU` value is not in the after collection, so rely on Sysmon event 13 here. Snapshots are only as good as when and how they were taken.

## The plugins <span class="q-ref">Q016</span> { #q016 }

Pivot from the DLL's folder to everything written there:

```bql
bifract_category="file_write" | target_file=~"\\AppData\\Roaming\\Greenshot\\" | table(timestamp, computer_name, image, target_file) | sort(timestamp)
```
<!-- shot: q016-plugins | Files the implant dropped into Greenshot's user folder. | rows=2 -->

The implant wrote two DLLs, at 14:36 and 14:39, before relaunching Greenshot at 14:51.

!!! finding "Finding · Q016"
    The staged DLLs are **Greenshot.Plugin.QuickConnect.dll** and **QuickConnect.ImageCache.dll**.

Only `QuickConnect.ImageCache.dll` has an image-load event, so you will not find both through event 7. Following the folder finds both.

The chain so far: a user-run PowerShell cradle, a renamed Python loader, an implant, and a signed screenshot tool that starts at every logon and beacons home. Next: [the attacker reaches for credentials](06-credential-access.md).
