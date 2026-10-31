---
title: "9. Timeline and takeaways"
---

<p class="lb-kicker">Chapter 9</p>

# Timeline and takeaways

<p class="lb-lede">About ninety minutes from a pasted command to SYSTEM on a second workstation, then a quiet beacon through the night. All times UTC on 2026-10-29 unless noted.</p>

## Timeline

<div class="lb-timeline" markdown>
<div><time>14:02</time><b>ClickFix</b><p>jen.walker pastes a PowerShell cradle into the Run dialog on WS02. It downloads a bundle from <code>update-cache-m9tdco18phmc.com</code>.</p></div>
<div><time>14:04</time><b>Loader</b><p><code>tar</code> unpacks a portable Python. <code>QuickConnectSupport.exe</code>, really a signed <code>pythonw.exe</code>, imports code from <code>DocumentResources.dat</code> and starts <code>QuickConnect.Service.exe</code>, which calls <code>203.0.113.87:8888</code>.</p></div>
<div><time>14:10</time><b>Discovery</b><p>The implant runs <code>whoami /all</code>, <code>ipconfig /all</code> and <code>systeminfo</code>.</p></div>
<div><time>14:18</time><b>Remote access</b><p>RustDesk, renamed <code>QuickConnectSupport.exe</code>, connects to the attacker's relay at <code>192.0.2.146</code>.</p></div>
<div><time>14:22</time><b>Hands on keyboard</b><p>Over RustDesk, the attacker types <code>cmd.exe /k whoami.exe &amp; hostname.exe &amp; ipconfig.exe /all</code> into Run. An 84-minute relay session begins.</p></div>
<div><time>14:36</time><b>Staging</b><p>Two DLLs land in <code>AppData\Roaming\Greenshot\</code>.</p></div>
<div><time>14:42</time><b>Persistence</b><p><code>reg add</code> sets <code>HKCU\...\Run\Greenshot</code>.</p></div>
<div><time>14:51</time><b>A trusted process turns</b><p>Greenshot is relaunched, loads the attacker's DLL, and takes over the beacon to <code>203.0.113.87:8888</code>.</p></div>
<div><time>15:19</time><b>Password spray</b><p>One password, <code>Meridian2026!</code>, against four accounts via <code>net use \\WS03\IPC$</code>. Three fail.</p></div>
<div><time>15:20</time><b>Valid account</b><p><code>svc.wksdeploy</code> logs on to WS03.</p></div>
<div><time>15:28</time><b>Lateral movement</b><p>PAExec copies the implant over <code>ADMIN$</code> and installs service <code>PAExec-6740-WS02</code> on WS03.</p></div>
<div><time>15:29</time><b>Second foothold</b><p>The implant runs on WS03 as SYSTEM and calls home.</p></div>
<div><time>Oct 30</time><b>Persistence holds</b><p>Greenshot on WS02 beacons until 13:22. svc.wksdeploy is used against WS03 again at 01:28 and 11:08.</p></div>
</div>

## Indicators

!!! warning "Do not contact these indicators"
    Domains are fictional and IPs are documentation ranges. They are here for detection practice only.

| Type | Indicator | Role |
|---|---|---|
| Domain | `update-cache-m9tdco18phmc.com` | Download and C2 |
| Domain | `support-assist-7wfncs.online` | RustDesk relay server |
| IP | `203.0.113.87` | C2 on TCP 8888; download on 443 |
| IP | `192.0.2.146` | RustDesk relay on TCP 21115 to 21117 |
| File | `%TEMP%\QuickConnect\QuickConnectSupport.exe` | Renamed `pythonw.exe` (loader) |
| File | `%TEMP%\QuickConnect\DocumentResources.dat` | Python code in a zip |
| File | `%TEMP%\QuickConnect\python312._pth` | Points Python at the sidecar |
| File | `QuickConnect.Service.exe` | Implant (`%TEMP%\QuickConnect\` on WS02, `C:\Windows\` on WS03) |
| File | `%LOCALAPPDATA%\Programs\QuickConnect Support\QuickConnectSupport.exe` | Renamed RustDesk |
| File | `%APPDATA%\Greenshot\Greenshot.Plugin.QuickConnect.dll`, `QuickConnect.ImageCache.dll` | Persistence plugins |
| Registry | `HKCU\Software\Microsoft\Windows\CurrentVersion\Run\Greenshot` | Logon persistence |
| Service | `PAExec-6740-WS02` | Remote execution on WS03 |
| Account | `MERIDIAN\svc.wksdeploy` | Compromised by password spray |

## What would have caught it sooner

Each of these is a baseline or a simple rule you can build in any SIEM with the data in this lab.

<div class="lb-grid" markdown>
<div class="lb-card" markdown>
#### Run dialog history
A `RunMRU` value containing `powershell`, `iwr`, `curl` or `-w h` is almost never legitimate. One rule on Sysmon event 13 catches ClickFix at the first step.
</div>
<div class="lb-card" markdown>
#### Name versus identity
A signed binary whose name on disk differs from its original file name, running from a user-writable path. That catches the loader and the renamed RustDesk.
</div>
<div class="lb-card" markdown>
#### First seen remote tools
Keyed on original file name, per host. With one sanctioned tool, any other one is news.
</div>
<div class="lb-card" markdown>
#### Programs that change behavior
Greenshot never ran discovery tools or talked to port 8888 before. `pgr()` scores every program's actions against its own history.
</div>
<div class="lb-card" markdown>
#### Workstation to workstation
SMB from one workstation to another's `ADMIN$`, and a new service from a remote logon, are rare in most offices.
</div>
<div class="lb-card" markdown>
#### Spray shape
Several accounts failing with the same source in under a minute, followed by one success.
</div>
</div>

## Keep going

- Rebuild the walkthrough's findings as alerts in Bifract and replay the lab to test them.
- Try the [questions](../questions.md) on a fresh fractal without the walkthrough open.
- Running a team exercise? Export the question set to CTFd.
