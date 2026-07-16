# Estate patches — upstream status

Annotation required by PRJ-2026-032 #91 (asset-003-governance). One line of
truth per commit on `estate` above the pinned base (tag `estate-base-v0.42.53.0`
→ `814258dd`). Upstream = `garrytan/gbrain`. Rebase/upgrade procedure =
RBK-2026-0006 (asset-007-hermes-runtime `docs/runbooks/`).

Statuses: **pending-upstream** (offered, PR open), **estate-only** (never
offered — estate-specific by design), **dropped-at-rebase** (upstream fixed it
independently; commit disappears at the next rebase).

| Commit | What | Status |
|---|---|---|
| `c9181ad4` | Wikilink fix #1+#2 — stale-path basename resolution + path-style resolution | **pending-upstream** — [garrytan/gbrain#2868](https://github.com/garrytan/gbrain/pull/2868) |
| `9cae326e` | Wikilink fix #3 — slugify DIR_PATTERN targets with spaces/uppercase | **pending-upstream** — [garrytan/gbrain#2868](https://github.com/garrytan/gbrain/pull/2868) (same PR) |
| `9eb3e17a` | `LINK_EXTRACTOR_VERSION_TS` pinned to deploy-moment 2026-07-04 | **estate-only** — deploy-specific re-extraction pin; expected end-state drift (#79 resolution) |
| `85eb8fee` | WIP snapshot: RJQD write-verify guard + 6DP8 identity gate / protected-overwrite / `written_by` stamping | **split**: the import read-back portion is pending-upstream via [#2869](https://github.com/garrytan/gbrain/pull/2869); the identity gate + protected-overwrite are **estate-only** (upstream `put_page` has no identity gate). Squash into `a1da8ae4` at the next rebase (#79 housekeeping) |
| `a1da8ae4` | RJQD fix — ingest-log record on read-back failure | **pending-upstream** — [garrytan/gbrain#2869](https://github.com/garrytan/gbrain/pull/2869) |
| `a90bd905` + `3def8ed3` (fork PR #3) | Thread agent identity into subagent tool context | **estate-only** — depends on the estate identity gate; verified 2026-07-16 that the bug does **not** exist on pristine upstream v0.42.59.0 (gate is ours), correcting the earlier "unfixed upstream" note on governance #87 |
| `80ee1120` (fork PR #4) | Never delete put_page pages under pruned dirs on incremental sync | **pending-upstream** — [garrytan/gbrain#2870](https://github.com/garrytan/gbrain/pull/2870) |

Upstream-offered branches live on this fork as `fix/*` (clean rewrites on
upstream v0.42.59.0 head `5008b287`, estate references stripped). Checked
2026-07-16: no estate patch was independently fixed in upstream
v0.42.54–v0.42.59 — nothing dropped-at-rebase yet. When an upstream PR merges,
the corresponding estate commit drops at the next RBK-2026-0006 rebase.
