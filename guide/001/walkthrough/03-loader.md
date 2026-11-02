---
title: "3. The loader"
---

<p class="lb-kicker">Chapter 3 · Q005 to Q009</p>

# The loader

<p class="lb-lede">The PowerShell command unpacked a bundle with tar and ran QuickConnectSupport.exe. In this chapter I follow what tar wrote, check what that executable really is, and find what it started.</p>

## What did tar write? <span class="q-ref">Q005</span> { #q005 }

Sysmon event 11 records file creation. Filter to the files `tar.exe` wrote:

```bql
event_id="11" image=$"\\tar.exe" | sort(timestamp) | table(timestamp, computer_name, user, target_file)
```
<!-- shot: q005-tar-writes | Files tar created in the user's Temp folder. | rows=9 -->

The first file is `...\Temp\QuickConnect\QuickConnectSupport.exe`, followed by `python312.dll`, `python3.dll`, `vcruntime140.dll` and the rest of a Python runtime.

!!! finding "Finding · Q005"
    The loader was written to disk as **QuickConnectSupport.exe**.

!!! warning "Two files, one name"
    A second, different `QuickConnectSupport.exe` shows up later in `AppData\Local\Programs\QuickConnect Support\`. Filter on `\Temp\QuickConnect\` to stay on the loader. The user folder also shows up in its 8.3 short form, `JEN~1.WAL`, so match on `\Temp\QuickConnect\` instead of the user name.

## What is it really? <span class="q-ref">Q006</span> { #q006 }

Windows executables carry an `OriginalFileName` in their version info, and Sysmon records it. When it doesn't match the name on disk, the file was renamed.

```bql
bifract_category="process_creation" image=~"\\Temp\\QuickConnect\\" | sort(timestamp) | table(timestamp, image, original_file_name, company, trusted, process_guid)
```
<!-- shot: q006-loader-identity | The loader's original file name, publisher and signature. | rows=2 -->

`QuickConnectSupport.exe` is really **`pythonw.exe`**, published by the Python Software Foundation, with a trusted signature. It's a legitimate signed interpreter running under a support-themed name ([T1036](https://attack.mitre.org/techniques/T1036/), Masquerading). The next process, `QuickConnect.Service.exe`, has no original file name and isn't signed.

!!! finding "Finding · Q006"
    The loader's original file name is **pythonw.exe**.

??? tip "Hunt every renamed binary at once"
    Compare each executable's name on disk with its original file name across the whole fleet:

    ```bql
    bifract_category="process_creation" original_file_name=* original_file_name!="-" | exe := lower(splitAt(image, "\\", -1)) | ofn := lower(original_file_name) | exe != field(ofn) | groupBy(computer_name, exe, ofn, trusted) | sort(_count)
    ```

    You get about 37 rows. Most are benign (Edge installers, `usoclient`, `wermgr`, `tar.exe` as `bsdtar`), but `quickconnectsupport.exe` shows up twice on WS02: once as `pythonw.exe` and once as `rustdesk.exe`. Comparing one field to another needs `field()`.

## How does Python know what to run? <span class="q-ref">Q007</span> { #q007 }

A portable ("embeddable") Python reads a `._pth` file next to the interpreter to decide where to import code from. Change that file and you change what runs at startup.

Sysmon's file create rule didn't log every file tar wrote. But tar sets each file's timestamp back to the one stored in the archive, and Sysmon logs that as event 2 (file creation time changed). Filter out the DLLs to see what's left:

```bql
event_id="2" image=$"\\tar.exe" | target_file!=/\.(pyd|dll)$/i | sort(timestamp) | table(timestamp, target_file, previous_creation_utc_time, creation_utc_time)
```
<!-- shot: q007-tar-event2 | Non-DLL files tar restored, oldest first. | rows=6 -->

There are six files: the renamed interpreter, `LICENSE.txt`, `python312.zip`, `python.cat`, **`python312._pth`** and `DocumentResources.dat`.

!!! finding "Finding · Q007"
    The path configuration file is **python312._pth**.

!!! info "Not timestomping"
    Event 2 often catches attackers back-dating files. Here it's tar restoring the archive's timestamps, which happens to every file in the bundle. Event 2 has no `bifract_category`, so filter it by `event_id`.

## The file that doesn't belong <span class="q-ref">Q008</span> { #q008 }

A stock embeddable Python ships `python312.zip`, `python312._pth`, `python.cat` and `LICENSE.txt`. One file in the list isn't part of Python: **`DocumentResources.dat`**, written right after the `._pth`. It's most likely a zip archive with a harmless-looking extension, added to the import path so Python loads the attacker's code from it.

The logs don't show the `._pth` contents or a read of the `.dat`, so this is an inference from the files in the bundle. A full-text search for `"DocumentResources"` finds only this one event in the whole dataset.

!!! finding "Finding · Q008"
    The sidecar archive is **DocumentResources.dat**.

## What did the loader start? <span class="q-ref">Q009</span> { #q009 }

`ptg()` walks the process tree from a `process_guid`. Follow the loader forward one level:

```bql
ptg(start="9D045BEA-5269-6AE3-CC3D-000000001100", direction=forward, depth=1)
```
<!-- shot: q009-ptg | The loader's one child. | rows=2 -->

!!! finding "Finding · Q009"
    The loader started **QuickConnect.Service.exe** at 14:04:30. That's the first foothold.

## See everything it touched

`pgr()` goes further than `ptg()`. It rebuilds the process tree, scores each file, network and DNS action by how rare it is on other hosts, and hides the everyday noise. Start it on the loader and draw it with `pgraph()`:

```bql
pgr(start="9D045BEA-5269-6AE3-CC3D-000000001100") | pgraph()
```
<!-- shot: q009-pgr | The provenance graph from the loader. Red marks actions rare across the fleet. | graph wait=9000 -->

Use the **‹ ›** arrows next to **N rare** to step through the processes with rare activity. Most of the next four chapters are in this graph: discovery commands, the renamed RustDesk, a registry Run key, a `net use` loop, and PAExec reaching WS03. RustDesk alone starts `cmd.exe` about 48,000 times, and `pgr()` folds those repeats so they don't bury the rest.

The red **2 hosts reached via 2 artifacts** badge marks other hosts that share something rare with this tree. One is real: on WS03, a copy of the implant talks to the same `203.0.113.87` ([chapter 7](07-lateral-movement.md)). The other is a false lead. WS01 also looks up `login.microsoftonline.com`, like any Windows host signing in to Microsoft, so check each lead before you trust it.

## Optional: does it look like a known C2?

`QuickConnect.Service.exe` isn't signed, and its SHA-256 won't be in any list. C2 frameworks build a fresh implant for every operator. **TLSH** is a fuzzy hash you compare by distance, so two builds of the same malware land close together even when their exact hashes have nothing in common. Zero means identical, and the number climbs as files diverge. Distances from 10 to 50 still mean quite similar, and that range is where the value is, because those are the files an exact hash would have missed completely.

In this lab, Velociraptor's `Windows.EventLogs.SysmonProcessEnriched` artifact staples a TLSH digest (`tlsh`) and a signing status (`trusted`) onto Sysmon process events. 245 process starts have a digest. ([Fuzzy Hash Hunting with Velociraptor and Bifract](https://signalsleuth.io/2026/09/11/tlsh.html) shows how to collect them in your own environment.) To compare them with public attack tools:

1. In **Exchange**, open **CelesTLSH fuzzy hash hunting**, click **Add all** and confirm. That adds Magonia Research's [CelesTLSH](https://github.com/Magonia-Research/CelesTLSH-Hashes) list of attack tool digests and a `tlsh_index` model.
2. Open `tlsh_index` and **Backfill** from **Oct 27, 2026** to **Nov 1, 2026**.

```bql
event_id="1" tlsh=* | tlsh(field=tlsh, dict="celes_tlsh", threshold=50) | match(dict="celes_tlsh", field=tlsh_match, column=TLSH_Hash, include=[Repo_Name]) | table(timestamp, computer_name, image, tlsh_distance, Repo_Name)
```
<!-- shot: q009-tlsh | The only program within 50 of a public attack tool. | rows=1 -->

Of the 245 process starts, only the implant comes within 50 of a known attack tool. Its closest match is Merlin, an open source C2 written in Go, at a distance of 44. That doesn't make it Merlin. It's a Sliver implant, and the list holds released Sliver servers and clients rather than implants, so the closest Sliver build is 63 away. What TLSH tells you is that this binary looks a lot like a Go C2 framework, which is reason enough to dig in.

!!! info "The bundle's alert stays quiet here"
    The bundle also adds an alert, **Untrusted Binary Similar to an Attack Tool**, which only checks unsigned programs. It reads the signing status from a field named `authenticode_trusted`, but this lab stores it as `trusted`, so the alert never matches. Add `trusted="untrusted"` to the search above and you get the same single row: the implant is also the only unsigned program with a digest. A close match on a program that also isn't signed is a much stronger signal than either one on its own.

Next: [the attacker's hands on the keyboard](04-hands-on-keyboard.md).
