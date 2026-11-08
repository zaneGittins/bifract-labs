---
title: "Lab 002: Larkspur baselines"
---

![](../assets/art/lab-002-cover.webp){ .lb-cover .lb-cover--page .no-zoom width="1600" height="640" }

<p class="lb-kicker">Lab 002</p>

# Larkspur baselines

Practice first seen, rarity, and coverage on a month of synthetic process creation events. Learn what to count and when a rarity finding is worth investigating.

<div class="lb-actions" markdown>
[1. Set up <small>15 min</small>](setup.md){ .md-button .md-button--primary }
[2. Walkthrough](walkthrough/index.md){ .md-button }
[or Questions](questions.md){ .md-button }
</div>

<p class="lb-facts">34 hosts · 34 users · Sysmon process creation · October 4th to November 4th, 2026 (UTC) · 203,705 events</p>

!!! warning "Don't contact indicators"
    There are no real indicators in this lab. Host names are made up `larkspur.internal` names, and the one public looking IP is from a documentation range. Don't resolve or connect to anything from the dataset.

??? info "About the data"
    | | |
    |---|---|
    | **Company** | Larkspur, domain `larkspur.internal`. Users are `larkspur\<first name>`. |
    | **Hosts** | `WS01` to `WS34`, one per person: 15 laptops and 19 desktops |
    | **People** | IT and service desk (6), finance (5), HR (2), sales (5), office (4), engineering (6), plant (6) |
    | **Source** | Sysmon process creation (event 1) in the same format as lab 001, so the same models run on both |
    | **What's in it** | Weekends, when laptops are off and desktops keep running. Three people join (Theo on October 12th, Nora on October 19th, Sam on October 28th), Felix leaves after October 23rd, and two people take a week off. Patch Tuesday is October 13th, and MS Edge, Teams, OneDrive and Defender update on different days per host. |
