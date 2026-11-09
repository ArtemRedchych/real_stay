# Moderate — verification

Run on 2026-11-09 with `curl` and a Playwright walk of the moderation page at 1440 px.

| Criterion | Check | Result |
|---|---|---|
| M1 | `GET /moderation/queue` with a moderator token → pending uploads oldest first (`Marlow Residences · Kinsley Hotel · Palm Court Resort`, then the newly created one), each with photos, facts and three signals; with a non-moderator token → 403. | **verified** |
| M2 | `POST /moderation/:id/approve` → `status: published`; `GET /hotels/marlow/uploads` grows from 6 to 7 and the hotel page shows the new card first (`Open 2 photos from one stay: Standard Double, stay October 2026, added 9 Nov 2026, Location checked`). | **verified** |
| M3 | `reject` with `{}` → 400 `Choose a reason: Not a hotel room, …`; with `Duplicate of an existing photo` → `rejected`; `GET /hotels/palm-court/uploads?roomType=Family Villa` → 0. | **verified** |
| M4 | `request-correction {reason:"Wrong room type", message:"These look like a Superior King…"}` → `correction_requested`; the contributor's `GET /uploads/:id` returns `correction_requested | Wrong room type | These look like a Superior King (the room with the sofa). Could you check your booking?`. The confirmation screen renders this state (component `Submitted`, state `correction_requested`); not screenshot in the walk. | **verified** (UI render: not run) |
| M5 | Seeded cases in the queue output: near → `sig-ok Location check: device was near…`; far + 2024 capture date → `sig-warn Location check: device was not near…`, `sig-warn Photo data: a capture date of 2024-02-02 does not match the reported stay (2026-11)`; new account → `sig-neutral Account: new (0 days old)…`. Screenshot `rs-mod-desktop.png`. | **verified** |
| M6 | Second `approve` on the same upload → 409. | **verified** |

## Evidence

- Walk output: `queue → Marlow Residences | Kinsley Hotel | Palm Court Resort | Hotel Marlow`, `toast → Approved · Marlow Residences · contributor notified`.
- Not run: concurrent moderators (by design a single moderator is assumed), reports surfaced to moderators (not built).
