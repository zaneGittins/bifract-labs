---
title: "3. The loader"
---

<p class="lb-kicker">Chapter 3 · Q005 to Q009</p>

# The loader

<p class="lb-lede">The cradle unpacked a bundle with tar and ran something called QuickConnectSupport.exe. Follow tar's writes, check what that executable really is, and find what it started.</p>

## What did tar write? <span class="q-ref">Q005</span> { #q005 }

Sysmon event 11 records files being created. Filter to the writes made by `tar.exe`:

```bql
event_id="11" image=$"\\tar.exe" | sort(timestamp) | table(timestamp, computer_name, user, target_file)
```
<!-- shot: q005-tar-writes | Files tar created in the user's Temp folder. | rows=9 -->

The first file out is `...\Temp\QuickConnect\QuickConnectSupport.exe`, followed by `python312.dll`, `python3.dll`, `vcruntime140.dll` and the rest of a Python runtime.

!!! finding "Finding · Q005"
    The loader was written to disk as **QuickConnectSupport.exe**.

!!! warning "Two files, one name"
    A second, different `QuickConnectSupport.exe` appears later in `AppData\Local\Programs\QuickConnect Support\`. Filter on `\Temp\QuickConnect\` to stay on the loader. The user folder also appears in its 8.3 short form, `JEN~1.WAL`, so match on the `\Temp\QuickConnect\` part rather than the user name.

## What is it really? <span class="q-ref">Q006</span> { #q006 }

Every Windows executable carries an `OriginalFileName` in its version resource. Sysmon records it. When it disagrees with the name on disk, someone renamed the file.

```bql
bifract_category="process_creation" image=~"\\Temp\\QuickConnect\\" | sort(timestamp) | table(timestamp, image, original_file_name, company, trusted, process_guid)
```
<!-- shot: q006-loader-identity | The loader's original file name, publisher and signature. | rows=2 -->

`QuickConnectSupport.exe` is really **`pythonw.exe`**, published by the Python Software Foundation, and its signature is trusted. A signed, legitimate interpreter under a support-themed name ([T1036](https://attack.mitre.org/techniques/T1036/), Masquerading). The next process, `QuickConnect.Service.exe`, has no original file name and is not signed.

!!! finding "Finding · Q006"
    The signed portable interpreter's original file name is **pythonw.exe**.

??? tip "Hunt every renamed binary at once"
    Compare each executable's name on disk with its original file name across the whole fleet:

    ```bql
    bifract_category="process_creation" original_file_name=* original_file_name!="-" | exe := lower(splitAt(image, "\\", -1)) | ofn := lower(original_file_name) | exe != field(ofn) | groupBy(computer_name, exe, ofn, trusted) | sort(_count)
    ```

    About 37 rows. Most are benign (Edge installers, `usoclient`, `wermgr`, `tar.exe` as `bsdtar`), but `quickconnectsupport.exe` shows up twice on WS02: once as `pythonw.exe` and once as `rustdesk.exe`. A field compared with another field needs `field()`.

## How does Python know what to run? <span class="q-ref">Q007</span> { #q007 }

A portable ("embeddable") Python reads a `._pth` file beside the interpreter to decide where to import code from. Change that file and you change what runs at startup.

Sysmon's file-create rule did not log every file tar wrote, but tar sets each file's timestamp back to the one stored in the archive, and Sysmon logs that as event 2 (file creation time changed). Filter out the DLLs to see what is left:

```bql
event_id="2" image=$"\\tar.exe" | target_file!=/\.(pyd|dll)$/i | sort(timestamp) | table(timestamp, target_file, previous_creation_utc_time, creation_utc_time)
```
<!-- shot: q007-tar-event2 | Non-DLL files tar restored, oldest first. | rows=6 -->

Six files: the renamed interpreter, `LICENSE.txt`, `python312.zip`, `python.cat`, **`python312._pth`** and `DocumentResources.dat`.

!!! finding "Finding · Q007"
    The path configuration file is **python312._pth**.

!!! info "Not timestomping"
    Event 2 often flags attackers back-dating files. Here it is tar restoring archived timestamps, which every file in the bundle gets. Event 2 also has no `bifract_category`, so filter it by `event_id`.

## The file that does not belong <span class="q-ref">Q008</span> { #q008 }

A stock embeddable Python ships `python312.zip`, `python312._pth`, `python.cat` and `LICENSE.txt`. One file in that list is not part of Python: **`DocumentResources.dat`**, written right after the `._pth`. It is a zip archive with a harmless-looking extension, added to the import path so Python loads the attacker's code from it.

The telemetry does not show the `._pth` contents or a read of the `.dat`, so this is an inference from the extraction set. A full-text search for `"DocumentResources"` finds this one event in the entire dataset.

!!! finding "Finding · Q008"
    The sidecar archive is **DocumentResources.dat**.

## What did the loader start? <span class="q-ref">Q009</span> { #q009 }

Follow the loader's process forward with `ptg()`, which walks the process tree from a `process_guid`:

```bql
ptg(start="9D045BEA-5269-6AE3-CC3D-000000001100", direction=forward, depth=1)
```
<!-- shot: q009-ptg | The loader's one child. | rows=2 -->

!!! finding "Finding · Q009"
    The loader started **QuickConnect.Service.exe** at 14:04:30, the first foothold.

!!! tip "Give ptg() a direction"
    For this seed, `ptg()` with the default `direction=both` can be very slow. Pass `direction=forward` (or `backward`) explicitly.

## See everything it touched

`pgr()` goes further than `ptg()`. It rebuilds the process tree, scores every file, network and DNS action by how rare it is across the fleet, and folds away everyday noise. Start it on the loader and draw it with `pgraph()`:

```bql
pgr(start="9D045BEA-5269-6AE3-CC3D-000000001100", limit=3000) | pgraph()
```
<!-- shot: q009-pgr | The provenance graph from the loader. Red marks actions rare across the fleet. | graph wait=9000 -->

Use the **‹ ›** arrows next to **N rare** to step through the processes with rare activity. You will meet most of the next four chapters here: discovery commands, the renamed RustDesk, a registry Run key, a loop over `net use`, and PAExec reaching for WS03.

!!! info "Raise the limit"
    RustDesk spawns the same `cmd.exe` hundreds of times. At the default `limit`, those repeats can crowd out file and network actions, so this query raises it to 3000.

Next: [the attacker's hands on the keyboard](04-hands-on-keyboard.md).
