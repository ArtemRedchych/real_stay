# RealStay — build plan

**State: VERIFIED** (slices 1–3 built and verified; hosting pending the infra PR) · 2026-11-09 · budget: 3 hours · approved by Artem Redchych on the build-plan page (rev 2)

## Approach

Monorepo: `api/` (NestJS + TypeORM + Postgres), `app/` (React + Vite, a port of the clickable prototype), `docs/`. Hosted on the Dialogis production GCP project through the existing `dialogis_infra` modules (separate PR), reviewers also get `docker compose up`.

Three slices in order of user value, each with its own REQUIREMENTS and VERIFICATION under `docs/features/`:

| # | Slice | Covers | Time box |
|---|---|---|---|
| 0 | Scaffold | compose, Nest, Vite, schema, seed, first push | 0:00–0:15 |
| 1 | [Browse](features/browse/REQUIREMENTS.md) | B1–B9 | 0:15–1:00 |
| 2 | [Contribute](features/contribute/REQUIREMENTS.md) | C1–C7 | 1:00–1:50 |
| 3 | [Moderate](features/moderate/REQUIREMENTS.md) | M1–M6 | 1:50–2:25 |
| 4 | Deploy, README, architecture, verification evidence | — | 2:25–2:50 |

## Data model

`hotel` (id slug, name, type, area, city, country, lat, lng, listingPhoto?, status seeded|pending) → `room_type` (hotel, name, position) → `upload` (hotel, roomType nullable + roomTypeLabel, stayMonth `YYYY-MM`, account, displayName `name|anonymous`, note, locationCheck `not_run|near|far`, status, decisionReason, decisionMessage, decidedBy, decidedAt, createdAt) → `photo` (upload, position, originalKey, thumbKey, width, height, capturedAt nullable, mime, bytes). `account` (id, provider, subject, name, isModerator, createdAt). `report` (photo, reason, createdAt).

Trust label and staleness are derived in one pure module (`api/src/domain/`), unit-tested, used by both API responses and the moderation signals.

## Guardrails

- No coordinates persisted or logged. No scores. "Stay verified" exists nowhere in code.
- Only `published` uploads leave the read endpoints.
- Storage behind `PhotoStorage` with `LocalDiskStorage` and `GcsStorage`.
- Auth behind `AuthProvider` with `DevAuthProvider`; Firebase is a documented swap.

## Risks

- HEIC thumbnails depend on the `sharp` build; fallback is serving the original.
- Time. If slice 3 runs over, the moderation UI is cut to approve/reject without correction and the README says so.
