---
title: "Lab 001 setup"
---

<p class="lb-kicker">Lab 001 · Setup</p>

# Set up the lab

<p class="lb-lede">Load the logs, add four models, then start hunting. If you don't run Bifract yet, Codespaces is the quickest way in.</p>

## No Bifract yet? Use Codespaces

[Open lab 001 in Codespaces](https://codespaces.new/zaneGittins/bifract-labs?quickstart=1){ .md-button .md-button--primary }

This starts Bifract on a GitHub cloud machine and imports lab 001 with endpoint analytics on. When the browser tab opens, sign in with the credentials printed in the Codespace terminal, then skip ahead to [check the count](#3-check-the-count).

Codespaces usage counts against your GitHub account's free monthly allowance, so stop the Codespace when you're done.

## Have Bifract? Add it from the Exchange

You need a tenant admin account. To run your own Bifract, see the [installation guide](https://docs.bifract.io/getting-started/installation/).

### 1. Turn on endpoint analytics first

The provenance graph (`pgr()`) needs baselines, which Bifract builds as logs arrive. Logs imported before you turn it on are never counted, so do this first.

1. Open **Settings** in the admin section of the sidebar, then the **Platform** tab.
2. Under **Endpoint analytics**, turn on **Collect baselines**.

<!-- shot: setup-analytics | Endpoint analytics builds process lineage and behavior baselines for `pgr()` as logs arrive. -->

It runs on every log you ingest, so on a production instance leave it off unless you use `pgr()`.

### 2. Add the dataset

1. Open **Exchange** in the sidebar.
2. Under **Datasets**, pick **Lab 001: Meridian workstation intrusion** and click **Add**.

<!-- shot: setup-dataset | The lab 001 dataset in the Exchange. -->

Bifract creates a fractal named `bifract-labs-001`, downloads the dataset, checks its size, SHA-256 and log count, and imports it in the background. The Exchange item shows progress, and **Open** switches to the fractal. You can search it while it fills. The import takes 10 to 20 minutes on a small instance.

??? note "Prefer the CLI, or an existing fractal?"
    The `bifract` CLI can download and verify the same dataset into any fractal. Create the fractal (name it `bifract-labs-001` so the guide's links work), then create an ingest token for it **with no normalizer**, since the dataset is already normalized:

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
    The data runs from Oct 27 to Oct 30, 2026. A fractal added from the Exchange opens on that range, and the time picker offers it as **Dataset range**. If you loaded the data another way, set a custom range of **Oct 27 to Nov 1, 2026**. "Last 24 hours" shows nothing.

## Add the hunting content

The walkthrough uses four models: one from an Exchange bundle and three that come with the lab. Select the `bifract-labs-001` fractal before adding them.

### Remote management tool hunting

This Exchange bundle is built on [Magic Sword's LOLRMM](https://lolrmm.io) list of remote monitoring and management tools. It adds a lookup, a per-user rarity model called `rmm_users`, an alert, a saved search and a dashboard.

1. Open **Exchange**, find the **Remote management tool hunting** bundle, and click **Add all**.
2. Review the list of items it adds, then click **Add 5 items**.

<!-- shot: setup-exchange | The remote management tool hunting bundle. -->

### The lab models

The other three models are YAML files in the lab repo:

| Model | Type | What it asks |
|---|---|---|
| `remote_tools_first_seen` | First / Last Seen | When did each remote access or remote execution tool first run on each host? |
| `outbound_beacons` | Beacon | Which internal host talks to one outside destination on a steady rhythm? |
| `outbound_long_connections` | Long Connection | Which outbound sessions stay open far longer than normal? |

1. Download [remote_tools_first_seen.yaml](https://github.com/zaneGittins/bifract-labs/raw/main/labs/001/bifract/models/remote_tools_first_seen.yaml), [outbound_beacons.yaml](https://github.com/zaneGittins/bifract-labs/raw/main/labs/001/bifract/models/outbound_beacons.yaml) and [outbound_long_connections.yaml](https://github.com/zaneGittins/bifract-labs/raw/main/labs/001/bifract/models/outbound_long_connections.yaml).
2. Open **Analytics** in the sidebar.
3. Click **Import YAML** and load each file.

### Backfill the models

A model only records logs that arrive after it's created, and these logs are already in. Backfill fills a model from logs you already have:

1. Open the model and click **Backfill**.
2. Pick **Custom range**, set **Oct 27, 2026** to **Nov 1, 2026**, and click **Start backfill**.

Do this for `rmm_users` and `remote_tools_first_seen`. The two network models can't be backfilled. They score a rolling window when you open them, and [chapter 1](walkthrough/01-baselines.md) shows how to use that.

<!-- shot: setup-models | The four models on the Analytics page. -->

!!! info "Stale and Learning are expected"
    The newest event is from Oct 30, 2026, so the backfilled models show **Stale** (newest event over two days old) and the network models show **Learning**. That's normal for a lab. Open a model and use **All rows** to see what it recorded.

## Point this guide at your Bifract

Every query in the walkthrough has an **Open in Bifract** button. Enter your Bifract's address so the buttons open your instance:

<div class="lb-instance" data-lab="001"></div>

That's it. Start the [walkthrough](walkthrough/index.md), or hunt on your own with the [questions](questions.md).
