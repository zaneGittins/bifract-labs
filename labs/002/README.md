# Lab 002: Larkspur baselines

Practice first seen, rarity and coverage on a month of synthetic events.

**Setup, the walkthrough and the questions are at [labs.bifract.io/002](https://labs.bifract.io/002/).**

## The data

| | |
|---|---|
| **Company** | Larkspur, domain `larkspur.internal`. Users are `larkspur\<first name>`. |
| **Hosts** | `WS01` to `WS34`, one per person: 15 laptops and 19 desktops |
| **Time** | October 4th to November 4th, 2026 (UTC), 203,705 events |
| **Source** | Sysmon process creation (event 1), in the same format as lab 001 |
| **What's in it** | Weekends, three people joining and one leaving, two weeks of leave, Patch Tuesday on October 13th, and staggered Edge, Teams, OneDrive and Defender updates |

## Download

`bifract-labs-002.jsonl.zst` and `SHA256SUMS` are on [Releases](https://github.com/zaneGittins/bifract-labs/releases). Each line is one JSON object with `timestamp`, `log_id`, `fractal_id` and `fields`, newest first.

```bash
sha256sum -c SHA256SUMS
zstd -d bifract-labs-002.jsonl.zst
```

To load it with the CLI instead of the Exchange, see [setup](https://labs.bifract.io/002/setup/).

## In this folder

- [questions.json](questions.json): 14 questions with answers.
- [bifract/models](bifract/models/): the two lab models. The walkthrough also uses lab 001's `remote_tools_first_seen` and the LOLRMM lookup from the Exchange.

## Don't contact indicators

There are no real indicators in this lab. Host names are fictional `larkspur.internal` names (`.internal` can't be registered), and the one public looking IP is from a documentation range. Don't resolve or connect to anything from the dataset.
