---
title: "8. Infrastructure and scope"
---

<p class="lb-kicker">Chapter 8 · Q026 to Q031</p>

# Infrastructure and scope

<p class="lb-lede">With the story mostly worked out, the last step is pinning down the attacker's infrastructure, so it can be blocked and hunted for elsewhere, and making sure we know every host it reached.</p>

!!! warning "Don't contact these indicators"
    The domains below are made up and the IPs are from documentation ranges. Don't resolve, browse to or connect to any of them.

## The attacker's domains <span class="q-ref">Q026</span> { #q026 }

Zeek logs every DNS query on the network. Here's what WS02 looked up most:

```bql
channel="dns" src_ip="10.1.10.22" | groupBy(query) | sort(_count, order=desc) | head(10)
```
<!-- shot: q026-dns-top | WS02's most queried names. Two aren't Microsoft. | rows=10 -->

Two unfamiliar names rank above every Microsoft service, each queried thousands of times. Sysmon ties each one to a process:

```bql
event_id="22" query=~"update-cache","support-assist" | groupBy(hostname, image, query, query_results)
```
<!-- shot: q026-dns-process | Which process resolved each domain, and to what. | rows=4 -->

PowerShell (for the download) and the implants look up `update-cache-m9tdco18phmc.com`. RustDesk looks up `support-assist-7wfncs.online`, the attacker's own relay server.

!!! finding "Finding · Q026"
    The attacker domains are **update-cache-m9tdco18phmc.com** and **support-assist-7wfncs.online**.

## Domains to IPs <span class="q-ref">Q027</span> { #q027 }

```bql
channel="dns" query=~"update-cache-m9tdco18phmc.com","support-assist-7wfncs.online" answers=* | groupBy(query, answers)
```
<!-- shot: q027-answers | What each attacker domain resolved to. | rows=2 -->

!!! finding "Finding · Q027"
    `update-cache-m9tdco18phmc.com` → **203.0.113.87** and `support-assist-7wfncs.online` → **192.0.2.146**.

## The implant channel <span class="q-ref">Q028</span> { #q028 }

```bql
event_id="3" dst_ip="203.0.113.87" | groupBy(hostname, image, dst_port) | sort(_count, order=desc)
```
<!-- shot: q028-8888 | Everything that connected to 203.0.113.87, by port. | rows=5 -->

Greenshot, the implant on both hosts, and two connections Sysmon attributes to `tasklist.exe` all go to port 8888. The single 443 connection is PowerShell downloading the bundle.

!!! finding "Finding · Q028"
    The implant's command and control port is **8888**.

## RustDesk's ports <span class="q-ref">Q029</span> <span class="q-ref">Q030</span> { #q029 }

<a id="q030"></a>

RustDesk uses a few ports on its server: **21116** for signaling (the client checks in and finds its peer), **21117** for the relay that carries the session, and **21115** for a NAT test at startup. Look at completed connections only:

```bql
channel="conn" dst_ip="192.0.2.146" conn_state="SF" | groupBy(dst_port, function=multi(count(), max(duration, as=longest), max(orig_bytes, as=max_out))) | sort(dst_port)
```
<!-- shot: q029-rustdesk-ports | Completed connections to the relay server, by port. | rows=3 -->

| Port | Connections | Profile |
|---|---|---|
| 21116 | 2,775 | Tiny, repeated check-ins: signaling |
| 21117 | 1 | One session, 84 minutes, 2.1 MB out: the relay carrying the remote desktop |
| 21115 | 1 | 6 bytes at startup: the NAT test |

Zeek also shows thousands of unanswered attempts to 21114 (`S0`), which don't count.

!!! finding "Finding · Q029"
    Signaling and relay traffic used **21116** and **21117**.

Sysmon confirms the full set of ports the RustDesk client reached:

```bql
event_id="3" image=~rustdesk dst_ip="192.0.2.146" | groupBy(dst_port, function=multi(count(), min(timestamp, as=first))) | sort(_count, order=desc)
```
<!-- shot: q030-rustdesk-sysmon | RustDesk's connections to the relay server from Sysmon. | rows=3 -->

!!! finding "Finding · Q030"
    The additional port is **21115**, a single short connection at 14:18:18.

## Every host that called back <span class="q-ref">Q031</span> { #q031 }

To scope it, I use endpoint logs: which processes on which hosts reached the C2 port?

```bql
event_id="3" dst_ip="203.0.113.87" dst_port="8888" | groupBy(hostname, user, image, function=multi(count(), min(timestamp, as=first), max(timestamp, as=last))) | sort(first)
```
<!-- shot: q031-callbacks | Every C2 callback by host and process. | rows=4 -->

WS02 (the implant, then Greenshot until Oct 30 13:22) and WS03 (the implant, as SYSTEM, at 15:29). Nothing from WS01 or DC01.

!!! warning "DC01 isn't infected"
    If you count DNS lookups of the C2 domain by source, DC01 looks infected too, with almost as many as WS02. It's the DNS server, so it forwards the workstations' lookups. Scope from endpoint logs instead of DNS sources.

!!! info "Two quirks"
    Zeek has no `conn` record for WS03's callback, only an `ssl` record, so scoping from `conn` alone misses WS03. WS03's Sysmon network event is also stamped about 4 seconds before the process that made it, so allow some slack when lining up timestamps.

!!! finding "Finding · Q031"
    The implant called back from **WS02** and **WS03**.

Next: [the whole intrusion on one page](09-summary.md).
