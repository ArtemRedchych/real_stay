# Browse — verification

Run on 2026-11-09 against the API on the workstation database (seeded) and the Vite dev app; browser checks by Playwright (Chromium) at 320, 390 and 1440 px. Commands and outputs are quoted, not paraphrased.

| Criterion | Check | Result |
|---|---|---|
| B1 | `GET /hotels?q=Hotel Marlow Lisbon` → `mode=exact openDirectly=marlow ['Hotel Marlow']`; `q=Marlowe` → `mode=fuzzy ['Hotel Marlow','Marlow Residences','The Marlow House']`; `q=Grand Budapest` → `mode=none hotels=[] near=[]`. Unit tests `src/domain/trust.spec.ts` (8 passed) cover word order, accents, typo tolerance, strict mode. | **verified** |
| B2 | `GET /hotels/marlow` → `photoCount 8, uploadCount 6, latestStay 2026-10, roomTypes [('Standard Double',4,'2026-10',False),('Superior King',3,'2026-10',False),('Junior Suite',1,'2025-06',True),('Family Room',0,None,False)]` | **verified** |
| B3 | `GET /hotels/marlow/uploads` → 6 uploads, published only (a pending upload created in the Contribute checks did not appear until approved), photos grouped (2+1+1+2+1+1), default order by stay month then upload date; `sort=added` re-orders by upload date (checked in the app walk). | **verified** |
| B4 | Browser walk: cards read `Standard Double×2 | Superior King×2 | Standard Double | …`; aria-label of a card: `Open 2 photos from one stay: Standard Double, stay October 2026, added 9 Nov 2026, Location checked`. Screenshots `docs/screenshots/rs-hotel-phone.png`, `rs-hotel-desktop.png`. | **verified** |
| B5 | Junior Suite filter shows the stale notice; screenshot `rs-hotel-stale-phone.png`. API marks the chip `stale: true`. | **verified** |
| B6 | Walk: open a 2-photo card → counter `1 of 2`; ArrowRight → `2 of 2`, next disabled; Escape → focus returns to element with class `pcard`. Swipe handler present, not exercised in headless. | **verified** (swipe: not run) |
| B7 | Viewer facts (desktop): `October 2026 · reported by the contributor | 9 Nov 2026 | 14 Oct 2026 · from the file's own data | Alex R. · 1 contribution`; a photo without EXIF shows "Not available in the file" (seed photos). | **verified** |
| B8 | 390 px: header, hotel name, all five chips, freshness line and first row of cards on the first screen (`rs-hotel-phone.png`); 320 px: no horizontal overflow (`rs-hotel-320.png`); walk reports `no console errors, no failed requests, no overflow`. | **verified** |
| B9 | `#hotel-marlow-house` → `No guest photos yet` empty state with one contribution button. | **verified** |

## Evidence

- `npx jest src/domain --maxWorkers=2` → `Tests: 8 passed, 8 total`.
- Browser walk: a Playwright script run from the development machine (not included in this repository); its output is summarised above and the screenshots are in `docs/screenshots/`.
- One defect found and fixed during verification: the inline SVG icon sprite took 150 px of layout at the top of every page in the Vite build (the prototype's host supplied `[hidden]{display:none}`); fixed in `app/src/styles.css`, re-shot, header at 0 px on every page.
