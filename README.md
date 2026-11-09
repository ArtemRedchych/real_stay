# RealStay

**See what previous guests actually saw.** Search a hotel, pick the room type you booked, and see recent photos shared by guests who stayed in it: each one labeled with how it was checked and when the stay was. Stayed somewhere? Share up to three photos of your room in about a minute; you sign in only at the last step, and a moderator looks at every upload before it is published.

A take-home for Mews, built in a three-hour window on 9 Nov 2026 after a design pass the day before. It is a functional prototype: real API, real database, real uploads, real moderation. It is not finished software, and this README says where the edges are.

- **Run it:** `docker compose up` then open <http://localhost:8080> (API at <http://localhost:4000>, seeded on first boot).
- **Hosted:** `https://realstay.dialogislabs.com` once the infrastructure PR is applied (see Deployment).
- **Moderate:** footer → "Moderation (internal)" → sign in with any name; the prototype grants the moderator flag to that development sign-in.
- **Design prototype** (what the build was ported from, with the design system and the UX critique): open `docs/prototype/index.html` in a browser.

## The five decisions that shaped it

1. **An upload is the unit, not a photo.** A guest shares up to three photos of one stay; they share a hotel, room type, stay month, contributor and location result. So they are stored, moderated and shown together: one card per upload with a count badge, and a viewer that moves within the upload. Mixing every photo of a hotel into one carousel would blur which photos came from which stay.
2. **Dates are three facts, and the stay month is the one on the card.** "Stayed Oct 2026" answers the traveler's question (what did the room look like recently). The upload date answers a provenance question and the file's capture date a forensic one; both are in the viewer, labeled with their source. A bare "3 days ago" would invite reading an upload time as the room's current condition. Galleries sort by stay month; "Recently added" is one choice away.
3. **Two honest trust labels, derived, never stored.** "Location checked" when the device was near the hotel at upload (with the sentence "This does not prove where the photo was taken"), otherwise "Community photo". No scores, no percentages, no "verified" claim we cannot back. The rule is a pure function of stored facts (`api/src/domain/trust.ts`), unit-tested, used by both the API and the moderation signals.
4. **Browsing never asks for an account, and signing in is the submit.** Authentication is a cost paid only by contributors, once, after they have invested effort. The sign-in screen restates exactly what will be submitted; a complete draft goes straight to review when the account comes back.
5. **Moderation gates publication, with signals rather than scores.** Only `published` uploads leave the read endpoints. The moderator sees what the system knows (location result, EXIF capture date versus the reported stay, account age and history) and decides; rejection and correction need a reason from a fixed list so the contributor gets something actionable.

## Assumptions

- A hotel catalogue exists (seeded here). A contributor can add a hotel; it stays invisible until a moderator approves an upload for it.
- Room type names are the hotel's own. Contributors pick from that list or "Not sure".
- Moderation is human, one moderator at a time. Signals inform, they never decide.
- The location check runs on the device at upload time, with the contributor's consent, and only `near` / `far` is kept. 500 m is a reasonable "at the hotel" radius for city hotels; resorts may need more (configurable).
- Volume is small: search runs in process over the hotel list; thumbnails are made in the request.
- The reviewer can run Docker, or open the hosted URL.

## Trade-offs made on purpose

| Choice | Instead of | Why, and what it costs |
|---|---|---|
| React + Vite | Flutter (the team's mobile stack) | The design prototype was already HTML/CSS/JS; porting kept the UI and accessibility work intact in under an hour. Costs: a second front-end stack. |
| NestJS + TypeORM + Postgres | Firebase | Relational model and SQL-shaped queries (group by upload, order by stay, stale per room type); the reviewer can run it without creating a cloud project. Costs: no hosted auth for free. |
| `synchronize: true` schema | generated migrations | Three-hour budget; the entities are the schema. A production service would switch to migrations before the first real deploy. |
| Development sign-in (a name becomes an account) behind a provider interface | Google / Apple sign-in | Real OAuth needs a consent screen and project configuration the reviewer must reproduce. The whole flow runs; the swap is one provider class and one button. Costs: the prototype's accounts are not real identities. |
| Thumbnails and EXIF in the upload request | a queue | Simplicity; fine for 1–3 files. First thing to move at 10×. |
| Local disk in compose, GCS when hosted | one storage everywhere | Zero setup for the reviewer; one interface, two implementations. |
| Hash routing, no state library | a router and a store | The app has eight screens and one draft; the draft lives in memory for the session. With a redirecting OAuth provider it would move to IndexedDB. |

## What was built, in order

| Slice | Covers | Status |
|---|---|---|
| [Browse](docs/features/browse/REQUIREMENTS.md) | tolerant search, hotel page with room-type chips and staleness, gallery grouped by upload, viewer with provenance | built and [verified](docs/features/browse/VERIFICATION.md) |
| [Contribute](docs/features/contribute/REQUIREMENTS.md) | upload form, 1–3 photos with validation, EXIF capture date, stay month, location check, sign-in as the last step, confirmation | built and [verified](docs/features/contribute/VERIFICATION.md) |
| [Moderate](docs/features/moderate/REQUIREMENTS.md) | queue with signals, approve / reject / request correction, 409 on double decisions, contributor sees the outcome | built and [verified](docs/features/moderate/VERIFICATION.md) |

Design and system notes: [docs/architecture.md](docs/architecture.md) (components, data model, trust derivation, state machine, what breaks first at 10×). Plan and time boxes: [docs/PLAN.md](docs/PLAN.md). Screenshots from the running app: `docs/screenshots/`.

## Not built, and why

- **Google and Apple sign-in.** Provider interface and UI slot exist; configuration time was spent on the system instead.
- **Email notifications.** The confirmation screen says we email; nothing sends. Needs a sender.
- **Report handling.** Reports are stored; no moderator UI for them yet.
- **Duplicate detection.** The moderation screen has the slot; a perceptual hash per photo is the obvious next signal.
- **Rate limiting, image classification, multi-moderator locking, a CDN.** See the "10×" section of the architecture doc.
- **Hosting is wired, not yet live.** The Cloud Run / static-origin / database definitions live in a separate infrastructure PR; `.github/workflows/ci-deploy.yml` deploys on push to `main` once that is applied and the repository variables listed at its top are set.

## The next three hours

1. Google sign-in via Firebase Auth (the provider swap), then turn the development provider off in the hosted build.
2. Reports queue for moderators and a perceptual-hash duplicate signal.
3. Migrations instead of `synchronize`, and the thumbnail job off the request path.
4. A proper e2e suite over the API (today: domain unit tests plus a scripted browser walk; see the verification files).

## Repository map

```
api/        NestJS API: entities.ts, domain/ (trust, search), hotels/, uploads/, moderation/, auth/, storage/, seed.ts
app/        React + Vite app: pages/ (Home, Search, Hotel, Upload, SignIn, Submitted, Moderation), components/SearchBox, draft.ts, api.ts
docs/       PLAN.md, architecture.md, features/<slice>/{REQUIREMENTS,VERIFICATION}.md, screenshots/, prototype/ (the design prototype)
docker-compose.yml, .github/workflows/ci-deploy.yml
```

## Sample content

Hotels are fictional. Photos are Unsplash images edited to resemble guest uploads, labeled as sample content in the app's footer. Nothing here is a real contribution or a real hotel.
