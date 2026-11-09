# Contribute — requirements

**State: APPROVED** · owner: Artem Redchych · 2026-11-09 · scope approved on the build-plan page (rev 2)

> Marks: **[V]** verified · **[A]** assumption · **[?]** open product decision.

## 1. Problem and outcome

Guests who want to help the next traveler have no place to put a photo of their room that is tied to a hotel and a room type and dated honestly. After this slice a guest can, from a phone, pick the hotel and room type, add up to three photos, say which month they stayed, optionally check their location, sign in as the last step, and get a confirmation that the photos are pending review.

## 2. Scope

**In scope**
- Upload form: hotel pick (or "add a hotel"), room type pick with "Not sure", 1–3 photos (JPG, PNG, HEIC, WebP; 15 MB each), stay month and year, optional note (140 chars), display name choice, optional location check.
- Server: multipart upload, validation, thumbnail generation, EXIF capture date extraction, storage behind an interface (local disk, GCS).
- Location check: browser geolocation sent once; server computes distance to the hotel and stores only `near` or `far`.
- Sign-in as the last step through a provider interface; the dev provider issues a signed token for a typed name. Google via Firebase Auth is a stretch.
- Confirmation screen with status pending.

**Non-goals**
- Apple sign-in, email notifications, editing a submission after sending, in-browser camera capture beyond the native file input, correction loop UI (slice 3 defines the state; the UI is a stretch).

## 3. Verified existing behaviour **[V]**

None in this repo. Prototyped in `upload`, `validate`, `addFiles`, `signin` of the clickable prototype, including twelve designed states.

## 4. Definitions

| Term | Definition | Boundary | Edge cases |
|---|---|---|---|
| Upload | hotel, room type, stay month, contributor, display preference, note, location result, status `pending` on creation | 1 to 3 photos; a 4th is refused with a message | A failed file blocks submission until retried or removed; nothing is dropped silently |
| Accepted file | MIME `image/jpeg|png|heic|heif|webp` or `.heic/.heif` name, size ≤ 15 MB | 15 MB inclusive | HEIC is stored as received and converted for thumbnails where `sharp` can; otherwise the original is shown |
| Capture date | `DateTimeOriginal` from EXIF, if present | Stored as a date, shown as "from the file's own data" | Missing → `null`, shown as "Not available in the file" |
| Location check | distance from the device position to the hotel ≤ 500 m → `near`, else `far`; never run → `not_run` | 500 m inclusive | Permission declined → `not_run`; coordinates are not persisted or logged |
| Contributor | the signed-in account; display as `First L.` or `Anonymous` | Browsing never needs one | The dev provider is clearly marked as development-only in the UI and README |

## 5. Authorization and privacy

Writes require a bearer token. Only `near`/`far` is stored from the location check; the request handler must not log the body. Photos are private objects; the API serves them. The contributor's email is never shown.

## 6. Acceptance criteria

- **C1** `POST /uploads` with a valid token, 1–3 image files and the fields creates an upload with status `pending` and returns its id and photo ids; a 4th file, an unsupported type or a 16 MB file is rejected with a specific message naming the file.
- **C2** Each stored photo has a thumbnail and a `capturedAt` read from EXIF when present.
- **C3** `POST /uploads/:id/location-check` with `{lat, lng}` stores `near` or `far` and returns it; the coordinates are not stored.
- **C4** Without a token, `POST /uploads` returns 401; `POST /auth/dev {name}` returns a token (only when `AUTH_PROVIDER=dev`).
- **C5** In the app, pressing "Sign in and submit" with a complete form leads to sign-in and, on success, straight to the confirmation; with a missing field it shows the summary of what is missing with links to the fields.
- **C6** A pending upload is not visible on the hotel page (browse) but is visible in the moderation queue (slice 3).
- **C7** The confirmation names the hotel, room type, photo count and the trust label the photos will carry.

## 7. Assumptions

- **[A]** Hotel coordinates are seeded; a hotel added by a contributor has none, so its uploads are always `not_run`.
- **[A]** 500 m is a reasonable "at the hotel" radius for city hotels; resorts may need more. Configurable constant.
- **[A]** The dev sign-in is acceptable for the reviewer because the README explains the provider swap; Google sign-in is attempted only if time remains.
