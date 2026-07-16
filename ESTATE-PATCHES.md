# Estate patches — upstream status

Annotation required by PRJ-2026-032 #91 (asset-003-governance). One line of
truth per commit on `estate` above the pinned base (tag `estate-base-v0.42.59.0`
→ `5008b287`, first RBK-2026-0006 rebase executed 2026-07-16 from
`estate-base-v0.42.53.0`/`814258dd`). Upstream = `garrytan/gbrain`.
Rebase/upgrade procedure = RBK-2026-0006 (asset-007-hermes-runtime
`docs/runbooks/`).

Statuses: **pending-upstream** (offered, PR open), **estate-only** (never
offered — estate-specific by design), **dropped-at-rebase** (upstream fixed it
independently; commit disappears at the next rebase).

| Commit | What | Status |
|---|---|---|
| `0a1921f9` | Wikilink fix #1+#2 — stale-path basename resolution + path-style resolution | **pending-upstream** — [garrytan/gbrain#2868](https://github.com/garrytan/gbrain/pull/2868) |
| `55f7b461` | Wikilink fix #3 — slugify DIR_PATTERN targets with spaces/uppercase | **pending-upstream** — [garrytan/gbrain#2868](https://github.com/garrytan/gbrain/pull/2868) (same PR) |
| `acfa643c` | `LINK_EXTRACTOR_VERSION_TS` pinned to deploy-moment 2026-07-04 | **estate-only** — deploy-specific re-extraction pin; expected end-state drift (#79 resolution) |
| `24d3f00e` | RJQD write-verify guard + ingest-log read-back fix + 6DP8 identity gate / protected-overwrite (WIP snapshot squashed into its follow-up at the 2026-07-16 rebase, per #79 housekeeping) | **split**: the import read-back portion is pending-upstream via [#2869](https://github.com/garrytan/gbrain/pull/2869); the identity gate + protected-overwrite are **estate-only** (upstream `put_page` has no identity gate) |
| `07309dee` + `a8f1000c` (fork PR #3) | Thread agent identity into subagent tool context | **estate-only** — depends on the estate identity gate; verified 2026-07-16 that the bug does **not** exist on pristine upstream v0.42.59.0 (gate is ours), correcting the earlier "unfixed upstream" note on governance #87 |
| `22d48b9b` (fork PR #4) | Never delete put_page pages under pruned dirs on incremental sync | **pending-upstream** — [garrytan/gbrain#2870](https://github.com/garrytan/gbrain/pull/2870) |

Pre-rebase SHAs (branch history at base v0.42.53.0, for the record): `c9181ad4`
→ `0a1921f9` · `9cae326e` → `55f7b461` · `9eb3e17a` → `acfa643c` · `85eb8fee` +
`a1da8ae4` → `24d3f00e` (squashed) · `a90bd905` → `07309dee` · `3def8ed3` →
`a8f1000c` · `80ee1120` → `22d48b9b`.

Upstream-offered branches live on this fork as `fix/*` (clean rewrites on
upstream v0.42.59.0 head `5008b287`, estate references stripped). Checked
2026-07-16 at the rebase: no estate patch was independently fixed in upstream
v0.42.54–v0.42.59 — nothing dropped-at-rebase yet. When an upstream PR merges,
the corresponding estate commit drops at the next RBK-2026-0006 rebase.
