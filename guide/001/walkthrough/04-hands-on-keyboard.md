---
title: "4. Hands on keyboard"
---

<p class="lb-kicker">Chapter 4 · Q010 to Q013</p>

# Hands on keyboard

<p class="lb-lede">Once they had a foothold, the attacker checked where they landed: which user, which host, which network. Some of that was automated. Then a remote support tool showed up and someone started typing.</p>

## Automated discovery <span class="q-ref">Q010</span> { #q010 }

Admins and scripts run discovery tools all the time, almost always through `cmd.exe`. On WS02, RustDesk alone runs `tasklist` through `cmd /C` about 48,000 times. So I look for discovery tools whose parent **isn't** a shell:

```bql
bifract_category="process_creation" | image=~whoami,ipconfig,hostname,systeminfo,"\\net.exe",nltest,tasklist | parent_image!=$"\\cmd.exe" | groupBy(computer_name, parent_image, image)
```
<!-- shot: q010-discovery | Discovery tools started directly by something other than cmd.exe. | rows=6 -->

There are six rows and only two tools: `whoami.exe` and `ipconfig.exe`, both with `/all`. Their parents are three processes to treat as implants from here on:

- `...\Temp\QuickConnect\QuickConnect.Service.exe` on WS02 (14:10)
- `C:\Program Files\Greenshot\Greenshot.exe` on WS02 (15:08)
- `C:\Windows\QuickConnect.Service.exe` on WS03 (15:38)

!!! finding "Finding · Q010"
    The two directly launched discovery tools are **whoami.exe** and **ipconfig.exe**.

!!! anomaly "Out of place"
    Greenshot is a screenshot tool installed in Program Files. It has no reason to run `whoami /all`. [Chapter 5](05-persistence.md) shows why it does.

## What did the implants use cmd for? <span class="q-ref">Q011</span> { #q011 }

The implants also started `cmd.exe` as a wrapper. To see what each wrapper ran, I collect their GUIDs in a binding and look for their children:

```bql
let &wrappers := bifract_category="process_creation" parent_image=~QuickConnect,Greenshot image=$"\\cmd.exe" | table(process_guid);
bifract_category="process_creation" | in(parent_process_guid, &wrappers) | image!=$"\\conhost.exe" | groupBy(computer_name, parent_image, parent_commandline, image)
```
<!-- shot: q011-wrappers | What the implants' cmd.exe wrappers ran. | rows=4 -->

`cmd.exe /d /s /c systeminfo.exe` ran `systeminfo.exe` on WS02 (twice) and WS03. The other row is a `for` loop that runs `net.exe` eight times: four `net use` attempts against WS03, each after a `net use /delete`. [Chapter 6](06-credential-access.md) covers it.

!!! finding "Finding · Q011"
    Operating system inventory came from **cmd.exe → systeminfo.exe**.

!!! tip "Bindings"
    `let &name := ...;` runs a query and keeps its result for the next one. Here `in()` matches each process's parent GUID against that list.

## The support tool <span class="q-ref">Q012</span> { #q012 }

Chapter 1's first seen model already flagged a second `QuickConnectSupport.exe`. Here are the two side by side:

```bql
bifract_category="process_creation" | image=$"\\QuickConnectSupport.exe" | groupBy(image, original_file_name, product, description)
```
<!-- shot: q012-two-identities | One file name, two binaries. | rows=2 -->

It's the same file name for two programs: the Python loader in `Temp`, and **RustDesk Remote Desktop** in `AppData\Local\Programs\QuickConnect Support\`. RustDesk is open source remote desktop software that can use any relay server, including one the attacker runs.

```bql
bifract_category="network_connect" | image=~QuickConnect,rustdesk | groupBy(computer_name, image, dst_ip, dst_port) | sort(_count, order=desc)
```
<!-- shot: q012-rustdesk-net | RustDesk talks to 192.0.2.146 on its rendezvous and relay ports. | rows=8 -->

!!! finding "Finding · Q012"
    The remote support product is **RustDesk**, deployed under the support-themed name `QuickConnectSupport.exe`.

## Someone typing <span class="q-ref">Q013</span> { #q013 }

Back to the Run dialog history from chapter 2:

```bql
event_id="13" target_object=~"\\RunMRU\\" | target_object!=$"MRUList" | sort(timestamp) | table(timestamp, computer_name, image, details)
```
<!-- shot: q013-runmru | The second and third Run entries come after RustDesk connects. | rows=3 -->

RustDesk started at 14:18. Four minutes later, at **14:22:53**, a new command went through the Run dialog:

```text
cmd.exe /k whoami.exe & hostname.exe & ipconfig.exe /all
```

`/k` keeps the window open so someone can read the output. This is the attacker typing over RustDesk.

!!! finding "Finding · Q013"
    The command typed through the remote session was **`cmd.exe /k whoami.exe & hostname.exe & ipconfig.exe /all`**.

The third Run entry, `"C:\Program Files\Greenshot\Greenshot.exe"` at 14:51, relaunches the screenshot tool. Next: [why it does that](05-persistence.md).
