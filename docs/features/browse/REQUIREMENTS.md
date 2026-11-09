# Browse — requirements

**State: APPROVED** · owner: Artem Redchych · 2026-11-09 · scope approved on the build-plan page (rev 2), criteria derived from the clickable prototype rev 3

> Marks: **[V]** verified with a reference · **[A]** assumption · **[?]** open product decision.

## 1. Problem and outcome

A traveler who has booked, or is about to book, a specific room type cannot tell what that room really looks like: listing photos are staged and reviews are text. After this slice they can search the hotel the way their booking names it, open it, pick the room type, and see guest photos newest-stay first, each labeled with how it was checked and when the stay was.

## 2. Scope

**In scope**
- Hotel search by name or city, tolerant of word order, accents and one typo.
- Hotel page: room types with photo counts and a staleness mark, photos grouped by upload, sorted by stay month, with a stale warning per filter.
- Photo viewer scoped to one upload, showing the trust label, its explanation, and the three dates (stay, upload, capture).
- Homepage with search and the hotels with the newest contributions.

**Non-goals**
- Booking, prices, availability, maps, reviews, accounts for browsing, "verified stay" (reserved, never shown).

## 3. Verified existing behaviour **[V]**

Nothing exists in this repo before this slice (initial commit holds an 11-byte README). The behaviour below was prototyped and screenshot-tested in the clickable prototype (`app.js`, functions `search`, `hotelScreen`, `photoCard`, `viewer`), which this slice ports to React against the real API.

## 4. Definitions

| Term | Definition | Boundary | Edge cases |
|---|---|---|---|
| Upload | One submission by one contributor: hotel, room type, stay month, 1–3 photos, status | Photos of one upload are never split across cards | An upload with 0 published photos is not shown |
| Published photo | Photo whose upload has `status = published` | Pending, rejected and correction-requested uploads are invisible to browsers | Moderation changes take effect on the next request, no cache |
| Stay month | The month the contributor reported, `YYYY-MM` | Shown as "Stayed Oct 2026"; day never shown or stored | Reported by the contributor, so labeled as such in the viewer |
| Stale | Latest stay of the set is more than 12 whole months before today | Exactly 12 months is not stale; 13 is | Computed per filter (all, or one room type) and per chip |
| Latest stay | Max stay month of the published photos in the set, ties broken by upload date | — | Set with no photos: "No guest photos yet" |
| Trust label | `location_check = near` → "Location checked", otherwise "Community photo" | Derived, never stored; a function of stored facts | `far` and `not_run` both yield "Community photo" |
| Search match | Every query word matches, as a prefix, a word of hotel name, type, area, city or country; accents stripped; words of 5+ letters tolerate one edit | Zero query words → all hotels | A city match lists the city's hotels; one unambiguous hotel match opens it directly |

## 5. Authorization and privacy

Browsing needs no account **[A, from the brief]**. Contributor names are shown as first name and initial or "Anonymous contributor", as the contributor chose. No coordinates are ever stored or shown; only near/far.

## 6. Acceptance criteria

- **B1** `GET /hotels?q=Hotel Marlow Lisbon` returns Hotel Marlow first; `q=Marlowe` returns the three Marlow properties; `q=Grand Budapest` returns an empty list.
- **B2** `GET /hotels/:id` returns room types with `photoCount` and `latestStay`, and the hotel's `latestStay`.
- **B3** `GET /hotels/:id/uploads?roomType=&sort=stay|added|oldest` returns only published uploads, each with its photos in position order, sorted as requested, default `stay`.
- **B4** The hotel page shows one card per upload with a count badge when it has more than one photo, "Stayed <Mon YYYY>", the trust label, and a clock mark when the stay is stale.
- **B5** Selecting a room type with no photos from the last 12 months shows the stale notice naming the most recent stay month.
- **B6** The viewer moves only within the opened upload's photos; keyboard arrows, Escape and swipe work; focus returns to the card on close.
- **B7** The viewer shows stay month (labeled "reported by the contributor"), upload date, and capture date from EXIF or "not available in the file".
- **B8** At 390px wide the first screen of a hotel page shows the hotel name, every room type chip, the freshness line and the first row of photos; no horizontal overflow at 320px.
- **B9** A hotel with zero published photos shows an empty state with a single contribution prompt.

## 7. Assumptions

- **[A]** Room type names are the hotel's own; contributors pick from that list or "Not sure".
- **[A]** The hotel catalogue is seeded; adding hotels from the upload form creates a pending hotel visible only to moderators (slice 2).
- **[A]** Volume is small; search runs in SQL `ILIKE` plus an in-process ranker, no search engine.

## 8. Open questions

None blocking.
