---
title: "Lab 002 setup"
---

# Set up the lab

<p class="lb-lede">Load the logs, add the lookup and models, and backfill them.</p>

## No Bifract yet? Use Codespaces

[Open Bifract in Codespaces](https://codespaces.new/zaneGittins/bifract?quickstart=1){ .md-button .md-button--primary }

Codespaces runs Bifract with **lab 001 loaded by default**. Continue below to add lab 002 to the same instance. Completing lab 001 isn't required.

Find Bifract's address and admin password in `WELCOME.md`. Enter the address under [Start hunting](#start-hunting).

Stop the Codespace when you're done to conserve your GitHub allowance. See the [Codespaces guide](https://docs.bifract.io/getting-started/codespaces/) for details.

## Add the dataset

You need a tenant admin account. Endpoint analytics isn't needed for this lab.

In **Exchange**, select **Datasets**, **Lab 002: Larkspur baselines**, then **Add**. The import creates a fractal named `bifract-labs-002`.

??? note "Prefer the CLI?"
    Create a fractal named `bifract-labs-002` and an ingest token for it **with no normalizer**, then:

    ```bash
    bifract --ingest --url https://YOUR-BIFRACT:8443 --token "$TOKEN" dataset:bifract-labs-002
    ```

    The file is also on [GitHub Releases](https://github.com/zaneGittins/bifract-labs/releases) if you'd rather pass a local `.jsonl.zst`.

## Add the models

**Backfill** processes historical events to populate the model's baseline.

With the `bifract-labs-002` fractal selected:

1. **Add the LOLRMM lookup.** In **Exchange**, find the **LOLRMM tools** lookup and click **Add**.
2. **Import the lab models.** Download [rmm_tool_per_user.yaml](https://github.com/zaneGittins/bifract-labs/raw/main/labs/002/bifract/models/rmm_tool_per_user.yaml), [commandline_per_user.yaml](https://github.com/zaneGittins/bifract-labs/raw/main/labs/002/bifract/models/commandline_per_user.yaml) and lab 001's [remote_tools_first_seen.yaml](https://github.com/zaneGittins/bifract-labs/raw/main/labs/001/bifract/models/remote_tools_first_seen.yaml), then use **Analytics**, **Import YAML** for each.
3. **Backfill all three.** Open each model, click **Backfill**, pick **Custom range** from **October 4th, 2026** to **November 5th, 2026**, and start it.

Backfilled models may show **Stale** because the events are historical.

!!! note "Why a backfill and not a window"
    A rolling window eventually excludes this fixed dataset. These models use all history so the exercise stays reproducible.

## Start hunting

Search with the **Dataset range** in the time picker, or a custom range of **October 4th to November 5th, 2026**. `count()` should return 203,705.

Enter your Bifract's address so the walkthrough's **Open in Bifract** buttons go to your instance:

<div class="lb-instance" data-lab="002"></div>

Then start the [walkthrough](walkthrough/index.md) or the [questions](questions.md).
