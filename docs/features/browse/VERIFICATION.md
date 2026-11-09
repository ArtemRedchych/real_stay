# Browse — verification

Results start as **not run**. Filled in with real output at the end of the build.

| Criterion | Check | Command / where | Result |
|---|---|---|---|
| B1 | search tolerance | `api` unit test `hotels.search.spec.ts` + `curl "$API/hotels?q=Hotel%20Marlow%20Lisbon"` | not run |
| B2 | hotel summary | `curl $API/hotels/marlow` | not run |
| B3 | uploads grouped, sorted, published only | `api` e2e test `hotels.e2e-spec.ts` | not run |
| B4 | card anatomy | screenshot of hotel page, desktop | not run |
| B5 | stale notice | screenshot, Junior Suite filter | not run |
| B6 | viewer scoped to upload | manual: open a 2-photo upload, press → twice, Esc | not run |
| B7 | three dates | screenshot of the viewer side panel | not run |
| B8 | phone first screen, no overflow | Playwright script at 390 and 320 | not run |
| B9 | zero-photo hotel | screenshot of The Marlow House | not run |

## Evidence

(none yet)
