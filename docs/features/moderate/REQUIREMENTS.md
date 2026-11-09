# Moderate — requirements

**State: APPROVED** · owner: Artem Redchych · 2026-11-09 · scope approved on the build-plan page (rev 2)

> Marks: **[V]** verified · **[A]** assumption · **[?]** open product decision.

## 1. Problem and outcome

Guest photos are only trustworthy if something stands between upload and publication: a person checks that each photo shows a hotel room and nothing private. After this slice a moderator sees pending uploads with the signals the system knows (location result, EXIF capture date versus reported stay, account age), and approves, rejects with a reason, or requests a correction. Only approved uploads reach browsers.

## 2. Scope

**In scope**
- Queue of pending uploads, oldest first, with photos, facts and signals.
- Approve → `published`; Reject (reason from a fixed list, optional message) → `rejected`; Request correction (reason, message) → `correction_requested`.
- Contributor-facing status on the confirmation screen for the submission they just made.
- A moderator flag on the account; the dev provider can issue a moderator token.

**Non-goals**
- Multiple moderators and assignment, audit export, appeal flow, automated image classification, notifications to the contributor.

## 3. Verified existing behaviour **[V]**

None in this repo. Prototyped in `moderation`, `seedQueue`, `modResolve` of the clickable prototype.

## 4. Definitions

| Term | Definition | Boundary | Edge cases |
|---|---|---|---|
| Publication state | `pending → published \| rejected \| correction_requested`; `correction_requested → pending` on resubmission | Only these transitions; others return 409 | Approving an already-published upload is a no-op with 200 |
| Signal | A fact the system knows, shown as ok / warn / neutral: location near, far or not run; capture date present and within 60 days before the stay month or long before it; duplicate check (stretch) | Signals inform, they never decide | Missing EXIF is neutral, not a warning |
| Reason | One of a fixed list per action (reject: not a hotel room, identifiable people, personal information, professional image, duplicate, offensive, other; correction: wrong room type, wrong hotel, too dark or blurry, stay date looks wrong) | Free text is optional and shown to the contributor | — |

## 5. Authorization and privacy

Moderation endpoints require a token whose account has `isModerator = true`; otherwise 403. Moderators see the contributor's display name and account age, never an email. Decisions are stored with the moderator id and time.

## 6. Acceptance criteria

- **M1** `GET /moderation/queue` returns pending uploads oldest first with photos, facts and signals; 403 without the moderator flag.
- **M2** `POST /moderation/:id/approve` sets `published`; the upload then appears in `GET /hotels/:id/uploads` and on the hotel page.
- **M3** `POST /moderation/:id/reject {reason, message?}` requires a reason from the list and sets `rejected`; the upload never appears to browsers.
- **M4** `POST /moderation/:id/request-correction {reason, message?}` sets `correction_requested`; the contributor's confirmation screen shows the moderator's note.
- **M5** The moderation page shows the three signals with the right severity for the seeded cases (near, far, capture date two years before the stay).
- **M6** A decision on an upload that is no longer pending returns 409 and the UI refreshes the queue.

## 7. Assumptions

- **[A]** One moderator at a time; no locking.
- **[A]** The seed includes one pending upload per signal case so the screen is reviewable without creating data.
