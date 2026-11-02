---
title: "Lab 001 setup"
---

# Set up the lab

<p class="lb-lede">Load the logs, add four models, and you're ready.</p>

## No Bifract yet? Use Codespaces

[Open lab 001 in Codespaces](https://codespaces.new/zaneGittins/bifract?quickstart=1){ .md-button .md-button--primary }

This runs Bifract on a GitHub cloud machine with lab 001 loaded and endpoint analytics on, so skip to [add the models](#add-the-models). When the editor opens, `WELCOME.md` shows Bifract's address and admin password. Enter that address under [Start hunting](#start-hunting) so the guide's **Open in Bifract** buttons go to your Codespace.

Codespaces usage counts against your GitHub account's free allowance, so stop it when you're done. See the [Codespaces guide](https://docs.bifract.io/getting-started/codespaces/) for more.

## Have Bifract? Add the dataset

You need a tenant admin account.

1. **Turn on endpoint analytics first.** Open **Settings**, then **Platform**, and turn on **Collect baselines** under **Endpoint analytics**. `pgr()` only builds baselines from logs that arrive after this is on.
2. **Add the dataset.** Open **Exchange**, pick **Lab 001: Meridian workstation intrusion** under **Datasets**, and click **Add**. Bifract imports it into a new fractal called `bifract-labs-001` in 10 to 20 minutes. You can search it while it fills.

??? note "Prefer the CLI?"
    Create a fractal named `bifract-labs-001` and an ingest token for it **with no normalizer**, then:

    ```bash
    bifract --ingest --url https://YOUR-BIFRACT:8443 --token "$TOKEN" dataset:bifract-labs-001
    ```

    The files are also on [GitHub Releases](https://github.com/zaneGittins/bifract-labs/releases) if you'd rather pass a local `.jsonl.zst`.

## Add the models

With the `bifract-labs-001` fractal selected:

1. **Add the remote management tool bundle.** In **Exchange**, open **Remote management tool hunting**, click **Add all**, then **Add 5 items**. This adds the `rmm_users` model.
2. **Import the lab models.** Download [remote_tools_first_seen.yaml](https://github.com/zaneGittins/bifract-labs/raw/main/labs/001/bifract/models/remote_tools_first_seen.yaml), [outbound_beacons.yaml](https://github.com/zaneGittins/bifract-labs/raw/main/labs/001/bifract/models/outbound_beacons.yaml) and [outbound_long_connections.yaml](https://github.com/zaneGittins/bifract-labs/raw/main/labs/001/bifract/models/outbound_long_connections.yaml), then use **Analytics**, **Import YAML** for each.
3. **Backfill two of them.** Open `rmm_users`, click **Backfill**, pick **Custom range** from **Oct 27, 2026** to **Nov 1, 2026**, and start it. Do the same for `remote_tools_first_seen`.
4. **Score the network models.** Open `outbound_beacons` and click **Score range**. If you added the lab from the Exchange, the range is already filled in. Otherwise enter **2026-10-27 00:00** to **2026-10-31 00:00**. Click **Score range** again. Do the same for `outbound_long_connections`.

On the models list, backfilled models show **Stale** and network models show **Scored** with the end of the range. That's expected for a dataset from the past.

## Start hunting

Search with the **Dataset range** in the time picker, or a custom range of **Oct 27 to Nov 1, 2026**. `count()` should return 2,083,151.

Enter your Bifract's address so the walkthrough's **Open in Bifract** buttons go to your instance:

<div class="lb-instance" data-lab="001"></div>

Then start the [walkthrough](walkthrough/index.md) or the [questions](questions.md).
