# Contribute — verification

Run on 2026-11-09 with `curl` against the API and with a Playwright walk of the app at 390 px (geolocation granted, position near Hotel Marlow). Fixtures: `room.jpg` (1600×1200 with EXIF `DateTimeOriginal 2026:10:14 09:12:00`), `bath.png`, `clip.gif`.

| Criterion | Check | Result |
|---|---|---|
| C1 | `POST /uploads` with `clip.gif` and only `hotelId` → 400 `["clip.gif isn't a supported format. Use JPG, PNG or HEIC.", "Tell us roughly when you stayed (month and year).", "Choose the room type, or pick “Not sure”."]`. With 4 files → `['4 photos were sent; the limit is 3 per submission.']`. Valid 2-file request → `{"id":…,"status":"pending","photoIds":[…,…]}`. Oversized file: client-side check only (15 MB named message); server 15 MB check not exercised. | **verified** (oversize server path: not run) |
| C2 | `GET /uploads/:id` → photos `[(1600,1200,'2026-10-14T09:12:00.000Z'),(800,600,None)]`; thumbnails served (`…/1.thumb.jpg` → 200, 24 000 bytes for a seed thumb). | **verified** |
| C3 | `POST /uploads/:id/location-check {lat:38.7125,lng:-9.1298}` → `{"result":"near"}`; the `upload` entity has no coordinate columns (`api/src/entities.ts`), so nothing is stored. Stateless preview `POST /hotels/marlow/location-preview` → `{"result":"near"}`. | **verified** |
| C4 | `POST /uploads` without a token → 401. `POST /auth/dev {"name":"Alex Rivera"}` → token. | **verified** |
| C5 | App walk at 390 px: with the stay month missing, "Sign in and submit" shows `Before you continue, one thing is missing: Tell us roughly when you stayed (month and year).`; after filling it, the sign-in page reads `Signing in submits these 2 photos for review…` with `Hotel Marlow · Standard Double · stay October 2026`; signing in lands on `#submitted-<id>` with `Your photos were received · Pending review`, label `Location checked`. Screenshots `rs-upload-files-phone.png`, `rs-signin-phone.png`, `rs-submitted-phone.png`. | **verified** |
| C6 | After creation: `GET /hotels/marlow/uploads` → 6 (unchanged); moderation queue lists the new upload; after approve → 7, new upload first. | **verified** |
| C7 | Confirmation shows hotel, room type, photo count and the trust label the photos will carry (`Location checked` after a near check). | **verified** |

## Evidence

- Location flow in the app: `Your device is near Hotel Marlow. These photos will show Location checked.` (geolocation preview), then the stored result after submit.
- File errors in the app: `clip.gif isn't a supported format. Use JPG, PNG or HEIC.` shown beside two accepted thumbnails.
- Not run: HEIC input (no fixture), oversized file against the server, the correction resubmission loop end to end in the UI.
