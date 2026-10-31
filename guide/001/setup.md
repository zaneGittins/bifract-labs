---
title: "Lab 001 setup"
---

<p class="lb-kicker">Lab 001 · Setup</p>

# Set up the lab

<p class="lb-lede">Get the Meridian logs into a Bifract, add the models the walkthrough uses, and you are ready to hunt. Pick the path that fits.</p>

<div class="lb-grid" markdown>
<a class="lb-card" href="#no-bifract-yet-use-codespaces" markdown>
:material-cloud-outline:{ .lg }

#### No Bifract yet

One click starts Bifract in GitHub Codespaces with lab 001 already loaded. Nothing to install.
</a>
<a class="lb-card" href="#have-bifract-add-it-from-the-exchange" markdown>
:material-swap-horizontal:{ .lg }

#### Have Bifract

Add the dataset from the Exchange. Bifract downloads, verifies and imports it into a new fractal.
</a>
</div>

## No Bifract yet? Use Codespaces

[Open lab 001 in Codespaces](https://codespaces.new/zaneGittins/bifract-labs?quickstart=1){ .md-button .md-button--primary }

GitHub starts a cloud machine, runs Bifract on it, and imports lab 001 with endpoint analytics on. When the browser tab opens, sign in with the credentials shown in the Codespace terminal, then continue at [add the hunting content](#add-the-hunting-content).

Codespaces bills against your GitHub account's free monthly allowance. Stop the Codespace when you are done.

## Have Bifract? Add it from the Exchange

You need a tenant admin account. Don't have Bifract yet and want your own? See the [installation guide](https://docs.bifract.io/getting-started/installation/).

### 1. Turn on endpoint analytics first

The provenance graph (`pgr()`) needs baselines, and Bifract builds them as logs arrive. Logs imported before you turn it on are never counted, so do this first.

1. Open **Settings** in the admin section of the sidebar, then the **Platform** tab.
2. Under **Endpoint analytics**, turn on **Collect baselines**.

<!-- shot: setup-analytics | Endpoint analytics builds process lineage and behavior baselines for `pgr()` as logs arrive. -->

It runs on every ingested log. On a production instance, leave it off unless you use `pgr()`.

### 2. Add the dataset

1. Open **Exchange** in the sidebar.
2. Under **Datasets**, pick **Lab 001: Meridian workstation intrusion** and click **Add**.

<!-- shot: setup-dataset | The lab 001 dataset in the Exchange. -->

Bifract creates a fractal named `bifract-labs-001`, downloads the dataset, checks its size, SHA-256 and log count, and imports it in the background. The item shows progress; **Open** switches to the fractal, which you can search while it fills. The import takes 10 to 20 minutes on a small instance.

??? note "Prefer the CLI, or an existing fractal?"
    The `bifract` CLI can fetch and verify the same dataset into any fractal. Use an ingest token **with no normalizer** (the dataset is already normalized):

    ```bash
    bifract --ingest --url https://YOUR-BIFRACT:8443 --token "$TOKEN" dataset:bifract-labs-001
    ```

    Or download `bifract-labs-001.jsonl.zst` and `SHA256SUMS` from [GitHub Releases](https://github.com/zaneGittins/bifract-labs/releases), check it with `sha256sum -c SHA256SUMS`, and pass the `.jsonl.zst` file instead.

### 3. Check the count

Open **Query** in the new fractal and count everything:

```bql
count()
```
<!-- shot: setup-count | All 2,083,151 events loaded. | rows=1 -->

!!! tip "Use the dataset's time range"
    The data runs from Oct 27 to Oct 30, 2026. A fractal added from the Exchange opens on that range, and the time picker offers it as **Dataset range**. If you loaded it another way, set a custom range of **Oct 27 to Nov 1, 2026**. "Last 24 hours" will show nothing.

## Add the hunting content

The walkthrough uses four models. With the `bifract-labs-001` fractal selected:

### Remote management tool hunting

The Exchange has a bundle built on [Magic Sword's LOLRMM](https://lolrmm.io) list of remote monitoring and management tools: a lookup, a per-user rarity model, an alert, a saved search and a dashboard.

1. Open **Exchange**, find the **Remote management tool hunting** bundle, and click **Add all**.
2. Review the list of items it adds, then click **Add 5 items**.

<!-- shot: setup-exchange | The remote management tool hunting bundle. -->

### The lab models

Three more models come with the lab, in [labs/001/bifract/models](https://github.com/zaneGittins/bifract-labs/tree/main/labs/001/bifract/models):

| Model | Type | What it asks |
|---|---|---|
| `remote_tools_first_seen` | First / Last Seen | When did each remote access or remote execution tool first run on each host? |
| `outbound_beacons` | Beacon | Which internal host talks to one outside destination on a steady rhythm? |
| `outbound_long_connections` | Long Connection | Which outbound sessions stay open far longer than normal? |

1. Open **Analytics** in the sidebar.
2. Click **Import YAML** and load each file.

### Backfill the models

Models record new logs from the moment they are created, and these logs are from the past. Seed each one with the lab's history:

1. Open the model and click **Backfill**.
2. Pick **Custom range**, set **Oct 27, 2026** to **Nov 1, 2026**, and click **Start backfill**.

Do this for `rmm_users` and `remote_tools_first_seen`. The two network models cannot be backfilled: they score a rolling window on demand, which the walkthrough shows how to use.

<!-- shot: setup-models | The four lab models on the Analytics page. -->

!!! info "Stale and Learning are expected"
    The newest event is from Oct 30, 2026, so the backfilled models show **Stale** (newest event over two days old) and the network models show **Learning**. That is normal for a lab. Open a model and use **All rows** to see what it recorded.

## Point this guide at your Bifract

Every query in the walkthrough has an **Open in Bifract** button. Tell it where your instance is:

<div class="lb-instance" data-lab="001"></div>

You are ready. Start the [walkthrough](walkthrough/index.md), or hunt on your own with the [questions](questions.md).
