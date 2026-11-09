# Contribute — verification

Results start as **not run**.

| Criterion | Check | Command / where | Result |
|---|---|---|---|
| C1 | create upload, refuse 4th / wrong type / oversized | `api` e2e `uploads.e2e-spec.ts` | not run |
| C2 | thumbnail + EXIF capture date | e2e with a fixture JPEG carrying `DateTimeOriginal` | not run |
| C3 | location check stores near/far only | e2e; then `SELECT location_check FROM upload` shows no coordinates column | not run |
| C4 | 401 without token; dev token issued | e2e | not run |
| C5 | sign in submits; missing fields summarised | manual in the app, phone width | not run |
| C6 | pending invisible to browse | e2e: hotel uploads endpoint excludes it | not run |
| C7 | confirmation content | screenshot | not run |

## Evidence

(none yet)
