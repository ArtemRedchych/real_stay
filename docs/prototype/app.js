/* RealStay prototype — single-file app: data, router, renderers, interactions. */
(function () {
  'use strict';
  const TODAY = new Date('2026-11-08T12:00:00');

  // ---------- sample data (all fictional; photos are illustrative samples) ----------
  const HOTELS = [
    { id: 'marlow', name: 'Hotel Marlow', type: 'Hotel', area: 'Alfama', city: 'Lisbon', country: 'Portugal', cats: ['Standard Double', 'Superior King', 'Junior Suite', 'Family Room'] },
    { id: 'marlow-res', name: 'Marlow Residences', type: 'Aparthotel', area: 'Parque das Nações', city: 'Lisbon', country: 'Portugal', cats: ['Studio', 'One-Bedroom Apartment'] },
    { id: 'marlow-house', name: 'The Marlow House', type: 'Guesthouse', area: 'Ribeira', city: 'Porto', country: 'Portugal', cats: ['Double Room', 'Twin Room', 'Attic Suite'] },
    { id: 'palm-court', name: 'Palm Court Resort', type: 'Resort', area: 'Bophut Beach', city: 'Koh Samui', country: 'Thailand', cats: ['Garden Villa', 'Beachfront Villa', 'Family Villa'], listing: 'p08' },
    { id: 'kinsley', name: 'Kinsley Hotel', type: 'Hotel', area: 'New Town', city: 'Edinburgh', country: 'United Kingdom', cats: ['Classic Double', 'Twin Room', 'Family Room'] },
  ];
  const PHOTOS = [
    { id: 1, sub: 's1', hotel: 'marlow', cat: 'Superior King', img: 'p03', up: '2026-11-05', stay: '2026-10', trust: 'location', by: 'Marta S.', byN: 4, taken: '2026-10-14', note: 'Room 412, taken from the door. Sofa is a bit worn but clean.' },
    { id: 2, sub: 's2', hotel: 'marlow', cat: 'Standard Double', img: 'p02', up: '2026-11-02', stay: '2026-10', trust: 'community', by: null, taken: null, note: '5th floor, street side. The window doesn’t fully open.' },
    { id: 3, sub: 's3', hotel: 'marlow', cat: 'Standard Double', img: 'p06', up: '2026-10-21', stay: '2026-09', trust: 'community', by: 'Jonas W.', byN: 1, taken: '2026-09-28', note: null },
    { id: 4, sub: 's4', hotel: 'marlow', cat: 'Standard Double', img: 'p04', up: '2026-09-14', stay: '2026-09', trust: 'location', by: 'Priya R.', byN: 2, taken: null, note: 'Darker than the listing photos. All lamps are warm bulbs.' },
    { id: 5, sub: 's5', hotel: 'marlow', cat: 'Superior King', img: 'p09', up: '2026-08-30', stay: '2026-08', trust: 'community', by: null, taken: null, note: null },
    { id: 6, sub: 's1', hotel: 'marlow', cat: 'Superior King', img: 'p13', up: '2026-11-05', stay: '2026-10', trust: 'location', by: 'Marta S.', byN: 4, taken: '2026-10-14', note: 'Bathroom of 412. Tub only, no shower screen.' },
    { id: 7, sub: 's4', hotel: 'marlow', cat: 'Standard Double', img: 'p12', up: '2026-09-14', stay: '2026-09', trust: 'location', by: 'Priya R.', byN: 2, taken: null, note: 'Bathroom. Small but renovated.' },
    { id: 8, sub: 's8', hotel: 'marlow', cat: 'Junior Suite', img: 'p11', up: '2025-07-12', stay: '2025-06', trust: 'community', by: 'Tom H.', byN: 3, taken: '2025-06-30', note: 'Living area of the suite.' },
    { id: 9, sub: 's9', hotel: 'marlow-res', cat: 'Studio', img: 'p10', up: '2026-10-02', stay: '2026-09', trust: 'community', by: null, taken: null, note: 'Top floor studio. Kitchenette is behind the camera.' },
    { id: 10, sub: 's10', hotel: 'marlow-res', cat: 'One-Bedroom Apartment', img: 'p14', up: '2026-05-20', stay: '2026-05', trust: 'location', by: 'Nils F.', byN: 5, taken: '2026-05-08', note: null },
    { id: 11, sub: 's11', hotel: 'palm-court', cat: 'Garden Villa', img: 'p01', up: '2026-11-01', stay: '2026-10', trust: 'location', by: 'Daniel O.', byN: 6, taken: '2026-10-22', note: 'Evening, lights on. Matches the listing fairly well.' },
    { id: 12, sub: 's12', hotel: 'palm-court', cat: 'Beachfront Villa', img: 'p05', up: '2026-09-09', stay: '2026-08', trust: 'community', by: null, taken: null, note: 'Morning light. The bed decoration was only there on arrival day.' },
    { id: 13, sub: 's13', hotel: 'kinsley', cat: 'Twin Room', img: 'p07', up: '2026-10-28', stay: '2026-10', trust: 'community', by: 'Ewan M.', byN: 1, taken: null, note: 'Ground floor twin. The ceiling light is harsh; bring the lamps closer.' },
  ];
  const TRUST = {
    community: { label: 'Community photo', icon: 'i-camera', cls: 'trust-community', why: 'Uploaded by a guest. The stay has not been independently verified.' },
    location: { label: 'Location checked', icon: 'i-pin', cls: 'trust-location', why: 'The contributor’s device was near the hotel when they uploaded. This does not prove where the photo was taken.' },
    verified: { label: 'Stay verified', icon: 'i-shield', cls: 'trust-verified', why: 'Linked to evidence of a real stay. Not available yet.' },
  };
  const REJECT_REASONS = ['Not a hotel room', 'People are identifiable', 'Personal information is visible', 'Professional or marketing image', 'Duplicate of an existing photo', 'Offensive content', 'Other'];
  const CORRECT_REASONS = ['Wrong room type', 'Wrong hotel', 'Too dark or blurry to be useful', 'Stay date looks wrong'];
  const REPORT_REASONS = ['Not a hotel room', 'Wrong hotel or room type', 'People or personal information visible', 'Looks like a professional or marketing photo', 'Offensive content', 'Something else'];
  const SAMPLE_FILES = [
    { name: 'IMG_4471.jpg', size: 2.8, url: 'img/t_p02.jpg' },
    { name: 'IMG_4472.jpg', size: 3.1, url: 'img/t_p12.jpg' },
    { name: 'IMG_4480.jpg', size: 2.4, url: 'img/t_p06.jpg' },
  ];

  // ---------- state ----------
  const S = {
    screen: 'home', q: '', sugOpen: false, sugIdx: -1,
    hotelId: null, cat: 'all', sort: 'stay', loading: false,
    viewer: null, viewerReturn: null, modal: null,
    user: null,
    up: freshUpload(),
    sub: { status: 'pending', hotelId: 'marlow', cat: 'Standard Double', files: SAMPLE_FILES.slice(0, 3) },
    mod: { queue: [], sel: null, mode: null, reason: '', msg: '' },
    toastT: null,
  };
  function freshUpload() {
    return { hotelId: null, cat: null, newHotel: null, hotelQ: '', files: [], fileErrors: [], month: '', year: '', note: '', loc: 'idle', locSim: 'near', display: 'name', attempted: false, draftKept: false, ctxOpen: false };
  }

  // ---------- helpers ----------
  const $ = (sel, root) => (root || document).querySelector(sel);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ic = (id, cls) => `<svg class="ic${cls ? ' ' + cls : ''}" aria-hidden="true"><use href="#${id}"/></svg>`;
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const hotel = (id) => HOTELS.find((h) => h.id === id);
  const photosOf = (id) => PHOTOS.filter((p) => p.hotel === id);
  const byNewest = (a, b) => (a.up < b.up ? 1 : -1);
  const byStay = (a, b) => (a.stay === b.stay ? byNewest(a, b) : a.stay < b.stay ? 1 : -1);
  const SORTS = { stay: byStay, added: byNewest, old: (a, b) => -byStay(a, b) };
  const sorter = () => SORTS[S.sort] || byStay;
  function monthsAgo(ym) { const [y, m] = ym.split('-').map(Number); return (TODAY.getFullYear() - y) * 12 + (TODAY.getMonth() + 1 - m); }
  function isStaleStay(ym) { return monthsAgo(ym) > 12; }
  // one upload (submission) = up to three photos from one stay; the gallery shows one card per upload
  function groupUploads(sorted) { const seen = new Map(); sorted.forEach((p) => { if (!seen.has(p.sub)) seen.set(p.sub, []); seen.get(p.sub).push(p); }); return [...seen.values()].map((ph) => ph.sort((a, b) => a.id - b.id)); }
  function uploadPhotos(sub) { return PHOTOS.filter((p) => p.sub === sub).sort((a, b) => a.id - b.id); }
  function latestStay(list) { return list.length ? list.slice().sort(byStay)[0] : null; }
  function fmtMonthShort(ym) { const [y, m] = ym.split('-').map(Number); return `${MON[m - 1]} ${y}`; }
  // search matching: accent-insensitive, any word order, word-prefix match, one typo tolerated on longer words
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const tokens = (q) => norm(q).split(' ').filter(Boolean);
  const hayWords = (h) => norm([h.name, h.type, h.area, h.city, h.country].join(' ')).split(' ');
  function lev(a, b) { if (Math.abs(a.length - b.length) > 1) return 9; let prev = Array.from({ length: b.length + 1 }, (_, j) => j); for (let i = 1; i <= a.length; i++) { const cur = [i]; for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; } return prev[b.length]; }
  const tokHit = (words, t, strict) => words.some((w) => w.startsWith(t) || (!strict && t.length >= 5 && lev(t, w) <= 1));
  function matchHotel(h, q, strict) { const t = tokens(q); if (!t.length) return false; const w = hayWords(h); return t.every((x) => tokHit(w, x, strict)); }
  function nearHotels(q) { const t = tokens(q).filter((x) => x.length >= 3); return t.length ? HOTELS.filter((h) => t.some((x) => tokHit(hayWords(h), x))) : []; }
  function fmtDate(iso) { const [y, m, d] = iso.split('-').map(Number); return `${d} ${MON[m - 1]} ${y}`; }
  function fmtMonth(ym) { const [y, m] = ym.split('-').map(Number); return `${MONTHS[m - 1]} ${y}`; }
  function daysAgo(iso) { return Math.round((TODAY - new Date(iso + 'T12:00:00')) / 86400000); }
  function rel(iso) {
    const d = daysAgo(iso);
    if (d < 1) return 'today';
    if (d === 1) return 'yesterday';
    if (d < 7) return `${d} days ago`;
    if (d < 35) { const w = Math.round(d / 7); return `${w} week${w > 1 ? 's' : ''} ago`; }
    if (d < 730) { const m = Math.round(d / 30.4); return `${m} month${m > 1 ? 's' : ''} ago`; }
    const y = Math.round(d / 365); return `${y} year${y > 1 ? 's' : ''} ago`;
  }
  function isStale(iso) { return daysAgo(iso) > 365; }
  function newest(list) { return list.length ? list.slice().sort(byNewest)[0] : null; }
  function placeLine(h) { return `${h.type} · ${h.area}, ${h.city}`; }
  function trustTag(kind, extra) { const t = TRUST[kind]; return `<span class="trust ${t.cls}${extra ? ' ' + extra : ''}">${ic(t.icon)}${t.label}</span>`; }
  function plural(n, one, many) { return `${n} ${n === 1 ? one : many || one + 's'}`; }
  function catLabel(cat) { return cat === 'Not sure' ? 'Room type not specified' : cat; }

  // ---------- routing ----------
  function go(hash) { if (location.hash !== '#' + hash) location.hash = hash; else route(); }
  function route() {
    const h = (location.hash || '#home').slice(1);
    S.sugOpen = false; S.viewer = null; S.modal = null;
    if (h.startsWith('hotel-')) {
      const id = h.slice(6);
      if (hotel(id)) { if (S.hotelId !== id) { S.cat = 'all'; S.sort = 'stay'; } S.hotelId = id; S.screen = 'hotel'; }
      else { S.screen = 'home'; }
    } else if (['home', 'search', 'upload', 'signin', 'submitted', 'moderation', 'system', 'decisions'].includes(h)) {
      S.screen = h;
    } else { S.screen = 'home'; }
    if (S.screen === 'moderation' && !S.mod.queue.length && !S.mod.seeded) seedQueue();
    render();
    window.scrollTo(0, 0); const app = $('#app'); if (app) app.scrollTop = 0;
    const h1 = $('#main h1'); if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
    const sel = $('#protoScreen'); if (sel) { const v = S.screen === 'hotel' ? 'hotel-marlow' : S.screen; if ([...sel.options].some((o) => o.value === v)) sel.value = v; }
  }

  // ---------- render ----------
  function render() {
    const active = document.activeElement; const activeId = active && active.id; const selStart = active && typeof active.selectionStart === 'number' ? active.selectionStart : null;
    $('#topbar').innerHTML = topbar();
    $('#main').innerHTML = ({ home, search, hotel: hotelScreen, upload, signin, submitted, moderation, system, decisions })[S.screen]();
    $('#sitefoot').innerHTML = (S.screen === 'home' || S.screen === 'search' || S.screen === 'hotel' || S.screen === 'system' || S.screen === 'decisions') ? sitefoot() : '';
    $('#layers').innerHTML = (S.viewer != null ? viewer() : '') + (S.modal ? modal() : '');
    if (S.screen === 'system') paintContrast();
    const selChip = $('.chips-scroll .chip[aria-checked="true"]'); if (selChip && selChip.scrollIntoView) selChip.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    if (activeId) { const el = document.getElementById(activeId); if (el) { el.focus({ preventScroll: true }); if (selStart != null && el.setSelectionRange) try { el.setSelectionRange(selStart, selStart); } catch (e) {} } }
    if (S.viewer != null && !S.modal) { const c = $('#viewerClose'); if (c && !(activeId && document.getElementById(activeId) && $('.viewer').contains(document.activeElement))) c.focus({ preventScroll: true }); }
    if (S.modal) { const first = $('.modal [autofocus], .modal input, .modal select, .modal button'); if (first && !$('.modal').contains(document.activeElement)) first.focus({ preventScroll: true }); }
  }

  function topbar() {
    const showSearch = S.screen === 'hotel' || S.screen === 'upload' || S.screen === 'system' || S.screen === 'decisions';
    return `<div class="wrap">
      <a class="logo" href="#home" aria-label="RealStay home"><span class="mark">${ic('i-aperture')}</span>RealStay</a>
      ${showSearch ? `<div class="topbar-search"><form data-form="search" role="search"><label class="sr-only" for="tq">Search hotels</label><div class="input-wrap">${ic('i-search', 'ic-lead')}<input class="input" id="tq" name="q" type="search" placeholder="Hotel name or city" value="${esc(S.q)}" autocomplete="off"></div></form></div>` : ''}
      <div class="topbar-actions">${S.screen === 'moderation' ? `<span class="status status-neutral">${ic('i-lock', 'ic-sm')}Internal</span>` : (S.screen === 'upload' || S.screen === 'signin' || S.screen === 'submitted') ? '' : `<a class="btn btn-secondary btn-sm" href="#upload">${ic('i-camera')}Share photos</a>`}</div>
    </div>`;
  }
  function sitefoot() {
    return `<div class="wrap">
      <span class="sample-note">${ic('i-info')}<span>Prototype with sample content. Hotels are fictional and photos are illustrative (Unsplash, edited to resemble guest uploads), not real contributions.</span></span>
      <nav aria-label="Secondary"><a href="#moderation">Moderation (internal)</a><a href="#system">Design system</a><a href="#decisions">UX decisions</a></nav>
    </div>`;
  }

  // ---------- search pieces ----------
  function searchbox(opts) {
    const o = Object.assign({ id: 'q', big: true, label: 'Search for a hotel by name or city' }, opts || {});
    return `<div class="searchbox" data-searchbox>
      <form data-form="search" role="search">
        <label class="sr-only" for="${o.id}">${o.label}</label>
        <div class="input-wrap">${ic('i-search', 'ic-lead')}<input class="input" id="${o.id}" name="q" type="search" placeholder="Hotel name or city" value="${esc(S.q)}" autocomplete="off" role="combobox" aria-expanded="${S.sugOpen ? 'true' : 'false'}" aria-controls="sug-${o.id}" aria-autocomplete="list" aria-activedescendant="${S.sugIdx >= 0 ? `sug-${o.id}-${S.sugIdx}` : ''}">${S.q ? `<button type="button" class="btn-clear" data-act="clear-q" aria-label="Clear search">${ic('i-x')}</button>` : ''}</div>
        <button class="btn btn-primary" type="submit">Search</button>
      </form>
      <div class="suggest-host" id="sug-${o.id}" role="listbox" aria-label="Suggestions">${S.sugOpen ? suggestList(o.id) : ''}</div>
    </div>`;
  }
  function suggestions(q) {
    const t = tokens(q); if (norm(q).length < 2) return [];
    const items = [];
    const cities = {};
    HOTELS.forEach((h) => { const w = norm(`${h.city} ${h.country}`).split(' '); if (t.length && t.every((x) => tokHit(w, x))) { const k = `${h.city}, ${h.country}`; cities[k] = (cities[k] || 0) + 1; } });
    Object.entries(cities).forEach(([k, c]) => items.push({ kind: 'city', label: k, q: k.split(',')[0], count: c }));
    HOTELS.filter((h) => matchHotel(h, q)).forEach((h) => items.push({ kind: 'hotel', hotel: h }));
    return items.slice(0, 6);
  }
  function suggestList(boxId) {
    const items = suggestions(S.q);
    if (!items.length) return `<div class="suggest"><ul><li><div class="s-sub">No hotel matches “${esc(S.q)}”. Press Enter to search anyway.</div></li></ul></div>`;
    return `<div class="suggest"><ul>${items.map((it, i) => {
      const sel = i === S.sugIdx ? 'true' : 'false';
      if (it.kind === 'city') return `<li id="sug-${boxId}-${i}" role="option" aria-selected="${sel}"><button type="button" data-act="sug-city" data-q="${esc(it.q)}">${ic('i-pin')}<span><span class="s-main">${esc(it.label)}</span><br><span class="s-sub">Destination</span></span><span class="s-right">${plural(it.count, 'hotel')}</span></button></li>`;
      const ph = photosOf(it.hotel.id); const ls = latestStay(ph);
      return `<li id="sug-${boxId}-${i}" role="option" aria-selected="${sel}"><button type="button" data-act="sug-hotel" data-id="${it.hotel.id}">${ic('i-building')}<span><span class="s-main">${esc(it.hotel.name)}</span><br><span class="s-sub">${esc(placeLine(it.hotel))}</span></span><span class="s-right">${ph.length ? `${plural(ph.length, 'photo')} · latest ${fmtMonthShort(ls.stay)}` : 'No photos yet'}</span></button></li>`;
    }).join('')}</ul></div>`;
  }
  function searchResults(q, strict) {
    if (!norm(q)) return HOTELS.slice();
    return HOTELS.filter((h) => matchHotel(h, q, strict)).sort((a, b) => photosOf(b.id).length - photosOf(a.id).length);
  }
  // Enter / Search: one unambiguous hotel opens directly; a city or several matches show the list.
  function openSearch() {
    const strict = searchResults(S.q, true); const n = norm(S.q);
    if (n && strict.length === 1 && !HOTELS.some((h) => norm(h.city) === n)) go('hotel-' + strict[0].id); else go('search');
  }

  // ---------- screens ----------
  function home() {
    const featured = HOTELS.filter((h) => photosOf(h.id).length).map((h) => ({ h, nw: newest(photosOf(h.id)), ls: latestStay(photosOf(h.id)), n: photosOf(h.id).length })).sort((a, b) => byNewest(a.nw, b.nw)).slice(0, 4);
    return `<section class="hero wrap">
      <h1>See what your hotel room really looks like.</h1>
      <p class="lede">Explore recent room photos shared by travelers who stayed there.</p>
      ${searchbox({ id: 'q' })}
      <div class="hero-foot"><span>No account needed to browse.</span><span>Try: <button type="button" data-act="try" data-q="Hotel Marlow">Hotel Marlow</button> or <button type="button" data-act="try" data-q="Lisbon">Lisbon</button></span></div>
    </section>
    <section class="section wrap">
      <div class="section-head"><h2>Recent guest photos</h2><span class="muted small">Hotels with the newest contributions</span></div>
      <div class="hgrid">${featured.map(({ h, nw, ls, n }) => `<a class="hcard" href="#hotel-${h.id}">
        <div class="ph"><img src="img/t_${nw.img}.jpg" alt="Most recent guest photo of ${esc(h.name)}: ${esc(nw.cat)}">${trustTag(nw.trust)}</div>
        <h3>${esc(h.name)}</h3><p class="sub">${esc(h.area)}, ${esc(h.city)}</p>
        <p class="meta"><b>${plural(n, 'guest photo')}</b><span class="dot"> · </span><span>latest stay ${fmtMonthShort(ls.stay)}</span></p></a>`).join('')}</div>
    </section>
    <section class="section wrap">
      <div class="section-head"><h2>How RealStay works</h2></div>
      <div class="how">
        <div class="step"><span class="num">${ic('i-search')}</span><div><h3>Find your hotel</h3><p>Search by name or city. No account, no booking.</p></div></div>
        <div class="step"><span class="num">${ic('i-eye')}</span><div><h3>See what guests saw</h3><p>Photos from real stays, newest first, by room type. Each one says how it was checked.</p></div></div>
        <div class="step"><span class="num">${ic('i-camera')}</span><div><h3>Add your own</h3><p>After a stay, share up to three photos. You sign in only at the last step.</p></div></div>
      </div>
    </section>
    <section class="section wrap"><div class="cta-band">
      <div><h2>Stayed somewhere recently?</h2><p>Three photos of your room help the next traveler know what to expect. It takes about a minute.</p></div>
      <a class="btn btn-secondary btn-lg" href="#upload">${ic('i-camera')}Share your photos</a>
    </div></section>`;
  }

  function search() {
    const strictRes = searchResults(S.q, true); const res = strictRes.length ? strictRes : searchResults(S.q); const n = norm(S.q);
    const fuzzy = !strictRes.length && res.length > 0;
    const near = res.length ? [] : nearHotels(S.q);
    const cityHit = HOTELS.find((h) => norm(h.city) === n);
    const title = !n ? 'All hotels' : cityHit ? `Hotels in ${esc(cityHit.city)}` : fuzzy ? `Closest ${res.length === 1 ? 'match' : 'matches'} for “${esc(S.q)}”` : res.length ? `${plural(res.length, 'hotel')} match “${esc(S.q)}”` : `No hotel matches “${esc(S.q)}”`;
    const list = (arr) => `<ul class="results">${arr.map((h) => {
        const ph = photosOf(h.id); const nw = newest(ph); const ls = latestStay(ph);
        return `<li><a class="res" href="#hotel-${h.id}">
          <div class="th">${nw ? `<img src="img/t_${nw.img}.jpg" alt="">` : ic('i-building')}</div>
          <div><h3>${esc(h.name)}</h3><p class="sub">${esc(h.type)} · ${esc(h.area)}, ${esc(h.city)}, ${esc(h.country)}</p>
            <p class="meta">${ph.length ? `<b>${plural(ph.length, 'guest photo')}</b><span class="muted">latest stay ${fmtMonthShort(ls.stay)}</span>` : `<span class="none">No guest photos yet</span>`}</p></div>
          <span class="go">${ic('i-chev-r')}</span></a></li>`;
      }).join('')}</ul>`;
    return `<div class="wrap">
      <div style="padding-top:16px">${searchbox({ id: 'q' })}</div>
      <div class="results-head"><h1>${title}</h1>${res.length > 1 ? `<span class="muted small">Hotels with photos first</span>` : ''}</div>
      ${res.length ? list(res) : `<div class="empty">${ic('i-search')}<h3>We couldn’t find that hotel</h3><p>Check the spelling, or try the city name. Word order and accents don’t matter.</p>${near.length ? '' : `<p class="small muted">Not listed? <button class="inline-link" data-act="add-hotel-from-search">Add it when you share photos</button></p>`}</div>
        ${near.length ? `<div class="closest"><h2>Hotels that share a word with “${esc(S.q)}”</h2>${list(near)}<p class="hint" style="margin-top:12px">None of these? <button class="inline-link" data-act="add-hotel-from-search">Add “${esc(S.q)}” when you share photos</button></p></div>` : ''}`}
    </div>`;
  }

  function hotelScreen() {
    const h = hotel(S.hotelId); const all = photosOf(h.id);
    const counts = {}; h.cats.forEach((c) => (counts[c] = all.filter((p) => p.cat === c)));
    const covered = h.cats.filter((c) => counts[c].length).length;
    const lsAll = latestStay(all);
    const list = (S.cat === 'all' ? all.slice() : (counts[S.cat] || []).slice()).sort(sorter());
    const ls = latestStay(list);
    const stale = ls && isStaleStay(ls.stay);
    // chips: count + a clock when a room type has nothing from the last 12 months, so stale categories are visible before tapping
    const chip = (label, key, ph) => { const n = ph.length; const old = n > 0 && isStaleStay(latestStay(ph).stay); return `<button type="button" role="radio" class="chip${n === 0 ? ' is-empty' : ''}" aria-checked="${S.cat === key}" data-act="cat" data-cat="${esc(key)}" aria-label="${esc(label)}, ${plural(n, 'photo')}${old ? ', none from the last 12 months' : ''}">${old ? ic('i-clock', 'ic-old') : ''}${esc(label)}<span class="count">${n}</span></button>`; };
    const shareBtn = (cls, cat, label) => `<button class="btn ${cls}" data-act="upload-for" data-id="${h.id}"${cat ? ` data-cat="${esc(cat)}"` : ''}>${ic('i-camera')}${label || 'Share your photos of this hotel'}</button>`;
    const listing = h.listing ? `<div class="listing-ph"><img src="img/t_${h.listing}.jpg" alt="The hotel’s own listing photo"><p class="t"><b>Hotel’s listing photo</b>For comparison. Not a guest contribution.</p></div>` : '';
    const sortSel = `<div class="sort"><label for="sort" class="small sort-label">Sort</label><select class="input" id="sort" data-act="sort">${[['stay', 'Most recent stay'], ['added', 'Recently added'], ['old', 'Oldest stay first']].map(([v, l]) => `<option value="${v}" ${S.sort === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>`;
    return `<div class="wrap">
      <a class="crumb" href="${S.q ? '#search' : '#home'}">${ic('i-arrow-l')}${S.q ? 'Back to results' : 'Back'}</a>
      <div class="hotel-head">
        <div>
          <h1>${esc(h.name)}</h1>
          <p class="addr">${esc(h.type)} · ${esc(h.area)}, ${esc(h.city)}, ${esc(h.country)}</p>
          <p class="summary">${all.length ? `<span><b>${plural(all.length, 'guest photo')}</b> · latest stay ${fmtMonthShort(lsAll.stay)}</span><span class="sep">·</span><span>${covered} of ${h.cats.length} room types</span>` : `<span class="muted">No guest photos yet</span>`}</p>
        </div>
        ${listing || all.length ? `<div class="stack only-wide" style="gap:12px">${listing}${all.length ? `<div class="actions">${shareBtn('btn-secondary')}</div>` : ''}</div>` : ''}
      </div>
      ${all.length ? `<div class="gallery-tools">
        <div class="chips" role="radiogroup" aria-label="Room type">
          ${chip('All', 'all', all)}${h.cats.map((c) => chip(c, c, counts[c])).join('')}
        </div>
        <div class="toolbar">
          <p class="fresh" aria-live="polite">${list.length ? `<span class="n">${plural(list.length, 'photo')}${S.cat !== 'all' ? ` of ${esc(S.cat)}` : ''} · </span>Latest stay <b>${fmtMonthShort(ls.stay)}</b>` : `No photos of ${esc(S.cat)} yet`}</p>
          ${sortSel}
        </div>
      </div>
      ${S.loading ? `<div class="gallery" aria-busy="true" aria-label="Loading photos">${Array.from({ length: 8 }).map(() => `<div><div class="skel skel-ph"></div><div class="skel skel-line"></div><div class="skel skel-line short"></div></div>`).join('')}<span class="sr-only">Loading photos</span></div>`
        : list.length ? `${stale ? `<div class="notice notice-warn stale">${ic('i-clock')}<div><p><b>No photos from stays in the last 12 months${S.cat !== 'all' ? ` in ${esc(S.cat)}` : ''}.</b> The most recent stay shown is ${fmtMonth(ls.stay)}, so these may not show the room as it is now.</p><p><button class="inline-link" data-act="upload-for" data-id="${h.id}" data-cat="${esc(S.cat)}">Share a recent photo</button></p></div></div>` : ''}
          <div class="gallery">${groupUploads(list).map((g) => photoCard(g[0], g.length)).join('')}</div>`
        : `<div class="empty">${ic('i-camera')}<h3>No guest photos yet for ${esc(S.cat)}</h3><p>Stayed in one? Your photos would be the first, and they help the next traveler know what to expect.</p><button class="btn btn-primary" data-act="upload-for" data-id="${h.id}" data-cat="${esc(S.cat)}">Share photos of a ${esc(S.cat)}</button></div>`}
      <div class="contrib-band only-narrow">${listing}<div><p><b>Stayed at ${esc(h.name)}?</b></p><p class="hint">Three photos of your room help the next traveler know what to expect. About a minute; you sign in only at the end.</p></div>${shareBtn('btn-secondary', S.cat !== 'all' ? S.cat : null, 'Share your photos')}</div>`
      : `<div class="empty" style="margin-top:24px">${ic('i-camera')}<h3>No guest photos yet</h3><p>Nobody has shared photos of ${esc(h.name)} so far. If you stayed here, you can be the first.</p><button class="btn btn-primary" data-act="upload-for" data-id="${h.id}">Share your photos</button></div>${listing ? `<div class="contrib-band only-narrow">${listing}</div>` : ''}`}
    </div>`;
  }
  function photoCard(p, n) {
    const old = isStaleStay(p.stay); n = n || 1;
    return `<button type="button" class="pcard" id="pc-${p.sub}" data-act="open-photo" data-sub="${p.sub}" aria-label="Open ${n === 1 ? 'photo' : `${n} photos from one stay`}: ${esc(p.cat)}, stay ${fmtMonth(p.stay)}${old ? ' (over a year ago)' : ''}, added ${fmtDate(p.up)}, ${TRUST[p.trust].label}">
      <div class="ph"><img src="img/t_${p.img}.jpg" alt="" loading="lazy">${n > 1 ? `<span class="pbadge" aria-hidden="true">${ic('i-image', 'ic-sm')}${n}</span>` : ''}</div>
      <div class="l1"><b>${esc(p.cat)}</b><span class="when${old ? ' is-old' : ''}">${old ? ic('i-clock') : ''}Stayed ${fmtMonthShort(p.stay)}</span></div>
      <div class="l2">${trustTag(p.trust)}</div></button>`;
  }

  function viewer() {
    const h = hotel(S.hotelId); const list = viewerList(); const i = S.viewer.i; const p = list[i]; if (!p) return '';
    const t = TRUST[p.trust];
    const facts = `<dl>
      <dt>Stay</dt><dd>${fmtMonth(p.stay)} <span class="sub">· reported by the contributor</span></dd>
      <dt>Uploaded</dt><dd>${fmtDate(p.up)}</dd>
      <dt>Photo taken</dt><dd>${p.taken ? `${fmtDate(p.taken)} <span class="sub">· from the file’s own data</span>` : '<span class="sub">Not available in the file</span>'}</dd>
      <dt>Shared by</dt><dd>${p.by ? `${esc(p.by)} <span class="sub">· ${plural(p.byN, 'contribution')}</span>` : 'Anonymous contributor'}</dd>
    </dl>${p.note ? `<p class="note">“${esc(p.note)}”</p>` : ''}`;
    return `<div class="layer viewer" role="dialog" aria-modal="true" aria-label="Photo ${i + 1} of ${list.length}, ${esc(h.name)}" id="viewerRoot">
      <div class="viewer-top">
        <button class="btn btn-icon btn-light" id="viewerClose" data-act="close-viewer" aria-label="Close photo viewer">${ic('i-x')}</button>
        <span class="counter">${list.length > 1 ? `${i + 1} of ${list.length}` : 'One photo'}</span><span class="counter-sub">${list.length > 1 ? 'from this stay' : ''}</span><span class="spacer"></span>
        <button class="btn btn-light btn-sm" data-act="report">${ic('i-flag')}Report</button>
      </div>
      <div class="viewer-stage" id="viewerStage">
        <div class="viewer-img-wrap"><img src="img/${p.img}.jpg" alt="Guest photo ${i + 1} of ${list.length} of a ${esc(p.cat)} at ${esc(h.name)}, stay ${fmtMonth(p.stay)}"></div>
        <button class="btn btn-icon btn-light viewer-nav prev" data-act="prev" aria-label="Previous photo" ${i === 0 ? 'disabled' : ''}>${ic('i-chev-l')}</button>
        <button class="btn btn-icon btn-light viewer-nav next" data-act="next" aria-label="Next photo" ${i === list.length - 1 ? 'disabled' : ''}>${ic('i-chev-r')}</button>
      </div>
      <div class="viewer-info">
        <div><h2>${esc(h.name)}</h2><p class="sub">${esc(p.cat)} · ${esc(h.area)}, ${esc(h.city)}</p>${list.length > 1 ? `<p class="sub">${list.length} photos shared together by ${p.by ? esc(p.by) : 'one guest'} after one stay. Arrows move within them.</p>` : ''}</div>
        <div>${trustTag(p.trust)}<p class="trust-why">${t.why}</p></div>
        <div class="more">${facts}<p class="sub" style="margin-top:12px"><span class="kbd">←</span> <span class="kbd">→</span> move between photos · <span class="kbd">Esc</span> closes</p></div>
        <div class="more-m"><p class="sub">Stay ${fmtMonth(p.stay)}${isStaleStay(p.stay) ? ' (over a year ago)' : ''} · uploaded ${fmtDate(p.up)}</p><details><summary>${ic('i-chev-d', 'ic-sm')}More about this photo</summary>${facts}</details></div>
      </div>
    </div>`;
  }
  function viewerList() { return S.viewer ? uploadPhotos(S.viewer.sub) : []; }

  function modal() {
    const m = S.modal;
    if (m.kind === 'report') {
      return `<div class="layer modal-layer" data-act="modal-backdrop"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="mTitle">
        <h2 id="mTitle">Report this photo</h2>
        <p class="muted">Tell us what’s wrong. A moderator looks at every report, and the photo stays visible until then.</p>
        <div class="radios" role="radiogroup" aria-label="Reason">${REPORT_REASONS.map((r, i) => `<label><input type="radio" name="rr" value="${esc(r)}" ${i === 0 ? 'autofocus' : ''} ${m.reason === r ? 'checked' : ''} data-act="report-reason">${esc(r)}</label>`).join('')}</div>
        <div class="actions"><button class="btn btn-secondary" data-act="close-modal">Cancel</button><button class="btn btn-primary" data-act="send-report" ${m.reason ? '' : 'disabled'}>Send report</button></div>
      </div></div>`;
    }
    return '';
  }

  // ---------- upload ----------
  function upload() {
    const u = S.up; const h = u.hotelId ? hotel(u.hotelId) : null;
    const errs = u.attempted ? validate(u) : {};
    const cats = h ? h.cats.concat(['Not sure']) : [];
    const uploading = u.files.some((f) => f.status === 'uploading');
    const years = [2026, 2025, 2024, 2023];
    const stepCls = (k) => `step-card${errs[k] ? ' has-error' : ''}`;
    const err = (k) => (errs[k] ? `<p class="error" id="err-${k}">${ic('i-alert')}${errs[k]}</p>` : '');
    const locBlock = () => {
      const name = h ? h.name : 'the hotel';
      if (u.loc === 'checking') return `<p class="row" aria-live="polite"><span class="spin" aria-hidden="true"></span>Checking your location…</p>`;
      if (u.loc === 'near') return `<div class="notice notice-ok">${ic('i-pin')}<p>Your device is near ${esc(name)}. These photos will show <b>Location checked</b>.</p></div>`;
      if (u.loc === 'far') return `<div class="notice">${ic('i-info')}<div><p>You don’t seem to be near ${esc(name)} right now. No problem: you can still submit, and the photos will show as <b>Community photo</b>.</p></div></div>`;
      if (u.loc === 'declined') return `<div class="notice notice-warn">${ic('i-alert')}<div><p>Location permission was declined, so we couldn’t check. You can still submit; the photos will show as <b>Community photo</b>.</p><p><button class="inline-link" data-act="loc-check">Try again</button> · <button class="inline-link" data-act="loc-retry-help">How to allow location</button></p></div></div>`;
      return `<div><button class="btn btn-secondary" data-act="loc-check">${ic('i-pin')}Check my location now</button></div>`;
    };
    return `<div class="wrap wrap-narrow">
      <div class="upload-head"><h1>Share your photos</h1><p>Up to three photos of your room. It takes about a minute, and you sign in only at the end.</p></div>
      <div class="stack">
      ${u.draftKept ? `<div class="notice notice-ok">${ic('i-check')}<p>Welcome back${S.user ? `, ${esc(S.user.name.split(' ')[0])}` : ''}. Your draft was kept exactly as you left it.</p></div>` : ''}
      ${u.attempted && Object.keys(errs).length ? `<div class="notice notice-danger valid-summary" role="alert">${ic('i-alert')}<div><p><b>Before you continue, ${Object.keys(errs).length === 1 ? 'one thing is' : `${Object.keys(errs).length} things are`} missing:</b></p><ul>${Object.entries(errs).map(([k, v]) => `<li><a href="#" data-act="jump" data-to="step-${k}">${v}</a></li>`).join('')}</ul></div></div>` : ''}
      <div class="steps">
        <section class="${stepCls('hotel')}" id="step-hotel" aria-labelledby="st1">
          <header><span class="n" aria-hidden="true">1</span><h2 id="st1">Which hotel?</h2></header>
          ${h ? `<div class="picked">${(() => { const nw = newest(photosOf(h.id)); return nw ? `<img src="img/t_${nw.img}.jpg" alt="">` : `<span class="ph">${ic('i-building')}</span>`; })()}<div class="t"><b>${esc(h.name)}</b><span>${esc(placeLine(h))}, ${esc(h.country)}</span></div><button class="btn btn-secondary btn-sm" data-act="up-change-hotel">Change</button></div>`
            : u.newHotel ? `<div class="picked"><span class="ph">${ic('i-plus')}</span><div class="t"><b>${esc(u.newHotel.name || 'New hotel')}</b><span>${esc(u.newHotel.city || 'City not set')} · will be added after review</span></div><button class="btn btn-secondary btn-sm" data-act="up-change-hotel">Change</button></div>
               <div class="date-row"><div class="field"><label for="nhName">Hotel name</label><input class="input" id="nhName" value="${esc(u.newHotel.name || '')}" data-act="nh-name" autocomplete="off"></div><div class="field"><label for="nhCity">City</label><input class="input" id="nhCity" value="${esc(u.newHotel.city || '')}" data-act="nh-city" autocomplete="off"></div></div>`
            : `<div class="field"><label for="uq">Hotel name or city</label><div class="searchbox" data-searchbox><div class="input-wrap">${ic('i-search', 'ic-lead')}<input class="input" id="uq" type="search" value="${esc(u.hotelQ)}" placeholder="Start typing, e.g. Marlow" autocomplete="off" data-act="up-hotel-q" ${errs.hotel ? 'aria-invalid="true" aria-describedby="err-hotel"' : ''}></div><div class="suggest-host">${u.hotelQ.length >= 2 ? upSuggest() : ''}</div></div><p class="hint">Not listed? <button class="inline-link" data-act="up-new-hotel">Add a hotel</button></p></div>`}
          ${err('hotel')}
        </section>
        <section class="${stepCls('cat')}" id="step-cat" aria-labelledby="st2">
          <header><span class="n" aria-hidden="true">2</span><h2 id="st2">Which room type?</h2></header>
          ${h || u.newHotel ? `<div class="chips" role="radiogroup" aria-label="Room type">${(h ? cats : ['Standard room', 'Superior room', 'Suite', 'Family room', 'Not sure']).map((c) => `<button type="button" role="radio" class="chip" aria-checked="${u.cat === c}" data-act="up-cat" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}</div><p class="hint">Use the name from your booking if you can. “Not sure” is fine.</p>` : `<p class="hint">Pick the hotel first.</p>`}
          ${err('cat')}
        </section>
        <section class="${stepCls('files')}" id="step-files" aria-labelledby="st3">
          <header><span class="n" aria-hidden="true">3</span><h2 id="st3">Your photos</h2><span class="opt tnum">${u.files.length} of 3</span></header>
          ${u.files.length ? `<div class="thumbs">${u.files.map((f) => `<div class="thumb${f.status === 'uploading' ? ' is-uploading' : ''}${f.status === 'failed' ? ' is-failed' : ''}">
              <img src="${f.url}" alt="Preview of ${esc(f.name)}">
              ${f.status === 'uploading' ? `<div class="prog" role="progressbar" aria-label="Uploading ${esc(f.name)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${f.progress}"><span style="width:${f.progress}%"></span></div>` : ''}
              ${f.status === 'failed' ? `<div class="fail"><span>Upload failed</span><button class="btn btn-primary" data-act="file-retry" data-fid="${f.id}">${ic('i-retry', 'ic-sm')}Retry</button></div>` : `<span class="fname">${esc(f.name)}</span>`}
              <button type="button" class="rm" data-act="file-rm" data-fid="${f.id}" aria-label="Remove ${esc(f.name)}">${ic('i-x', 'ic-sm')}</button>
            </div>`).join('')}</div>` : ''}
          ${u.files.some((f) => f.status === 'failed') ? `<div class="thumb-errors" role="alert">${u.files.filter((f) => f.status === 'failed').map((f) => `<p class="error">${ic('i-alert')}<span><b>${esc(f.name)}</b> didn’t finish uploading. Usually the connection dropped; your other photos are fine.</span><button type="button" class="btn btn-primary btn-sm" data-act="file-retry" data-fid="${f.id}">${ic('i-retry', 'ic-sm')}Retry</button><button type="button" class="btn btn-secondary btn-sm" data-act="file-rm" data-fid="${f.id}">Remove</button></p>`).join('')}</div>` : ''}
          ${u.fileErrors.length ? `<div class="file-errors" role="alert">${u.fileErrors.map((e, i) => `<p class="error">${ic('i-alert')}<span><b>${esc(e.name)}</b> ${e.msg}</span><button type="button" data-act="file-err-dismiss" data-i="${i}" aria-label="Dismiss">OK</button></p>`).join('')}</div>` : ''}
          ${u.files.length < 3 ? `<div class="dropzone" id="dropzone">
            ${ic('i-upload')}
            <p class="drop-desktop">Drag photos here, or</p>
            <div class="btns">
              <label class="btn btn-secondary drop-mobile">${ic('i-camera')}Take a photo<input type="file" class="sr-only" accept="image/*" capture="environment" data-act="files" aria-describedby="limits"></label>
              <label class="btn btn-secondary drop-mobile">${ic('i-image')}Choose from library<input type="file" class="sr-only" accept="image/*" multiple data-act="files" aria-describedby="limits"></label>
              <label class="btn btn-secondary drop-desktop">${ic('i-image')}Choose photos<input type="file" class="sr-only" accept="image/*" multiple data-act="files" aria-describedby="limits"></label>
            </div>
            <p class="limits" id="limits"><span>${u.files.length ? `${3 - u.files.length} more` : '1 to 3 photos'}</span><span>JPG, PNG or HEIC</span><span>up to 15 MB each</span></p>
            <p class="hint xs">Prototype: <button class="inline-link" data-act="sample-files">use sample photos</button></p>
          </div>` : `<p class="hint">That’s the maximum of three. Remove one to swap it.</p>`}
          ${err('files')}
        </section>
        <section class="${stepCls('date')}" id="step-date" aria-labelledby="st4">
          <header><span class="n" aria-hidden="true">4</span><h2 id="st4">When did you stay?</h2></header>
          <div class="date-row">
            <div class="field"><label for="upMonth">Month</label><select class="input" id="upMonth" data-act="up-month" ${errs.date ? 'aria-invalid="true" aria-describedby="err-date"' : ''}><option value="">Month</option>${MONTHS.map((m, i) => `<option value="${i + 1}" ${String(u.month) === String(i + 1) ? 'selected' : ''}>${m}</option>`).join('')}</select></div>
            <div class="field"><label for="upYear">Year</label><select class="input" id="upYear" data-act="up-year" ${errs.date ? 'aria-invalid="true"' : ''}><option value="">Year</option>${years.map((y) => `<option value="${y}" ${String(u.year) === String(y) ? 'selected' : ''}>${y}</option>`).join('')}</select></div>
          </div>
          <p class="hint">Roughly is fine. We show the month, never the exact dates.</p>
          ${err('date')}
        </section>
        <section class="step-card" id="step-ctx" aria-labelledby="st5">
          <header><span class="n" aria-hidden="true">5</span><h2 id="st5">Add context</h2><span class="opt">Optional</span></header>
          <details class="disclosure" ${u.ctxOpen ? 'open' : ''} data-act="ctx-toggle">
            <summary>${ic('i-pin')}Location check, a note, how your name appears${ic('i-chev-d')}</summary>
            <div class="body">
              <div class="loc-box">
                <div><p><b>Location check</b></p><p class="hint">If you’re at the hotel right now, we can confirm your device is nearby. We keep only “near” or “not near”, never your position. It doesn’t prove where the photo was taken, which is why such photos are labeled “Location checked”, not “verified”.</p></div>
                ${locBlock()}
              </div>
              <div class="field"><label for="upNote">Note for future guests</label><textarea class="input" id="upNote" maxlength="140" placeholder="e.g. Room 412, 5th floor, taken from the door" data-act="up-note">${esc(u.note)}</textarea><p class="hint tnum">${u.note.length} / 140</p></div>
              <div class="field"><span class="legend" id="dispLegend">Show your name as</span><div class="seg-radio" role="radiogroup" aria-labelledby="dispLegend"><label><input type="radio" name="disp" value="name" ${u.display === 'name' ? 'checked' : ''} data-act="up-display">First name and initial</label><label><input type="radio" name="disp" value="anon" ${u.display === 'anon' ? 'checked' : ''} data-act="up-display">Anonymous</label></div></div>
            </div>
          </details>
        </section>
      </div>
      </div>
      <div class="submitbar">
        <p class="hint">${S.user ? `Signed in as ${esc(S.user.name)}.` : 'Next: sign in with Google or Apple. That submits your photos.'}</p>
        <button class="btn btn-primary btn-lg" data-act="up-continue" ${uploading ? 'aria-disabled="true"' : ''}>${uploading ? `<span class="spin" aria-hidden="true"></span>Uploading…` : S.user ? `Submit ${u.files.length ? plural(u.files.length, 'photo') : 'photos'}` : 'Sign in and submit'}</button>
      </div>
    </div>`;
  }
  function upSuggest() {
    const items = suggestions(S.up.hotelQ).filter((i) => i.kind === 'hotel');
    if (!items.length) return `<div class="suggest"><ul><li><div class="s-sub">No hotel called “${esc(S.up.hotelQ)}”. <button class="inline-link" data-act="up-new-hotel">Add it</button></div></li></ul></div>`;
    return `<div class="suggest"><ul>${items.map((it) => `<li><button type="button" data-act="up-pick-hotel" data-id="${it.hotel.id}">${ic('i-building')}<span><span class="s-main">${esc(it.hotel.name)}</span><br><span class="s-sub">${esc(placeLine(it.hotel))}</span></span></button></li>`).join('')}</ul></div>`;
  }
  function validate(u) {
    const e = {};
    if (!u.hotelId && !(u.newHotel && u.newHotel.name && u.newHotel.city)) e.hotel = 'Choose the hotel (or add its name and city).';
    if (!u.cat) e.cat = 'Choose the room type, or pick “Not sure”.';
    const done = u.files.filter((f) => f.status === 'done'); const failed = u.files.filter((f) => f.status === 'failed');
    // a failed photo is never dropped silently: it blocks until the contributor retries or removes it
    if (failed.length) e.files = `${plural(failed.length, 'photo')} didn’t finish uploading. Retry or remove ${failed.length === 1 ? 'it' : 'them'} first.`;
    else if (!done.length) e.files = 'Add at least one photo.';
    if (!u.month || !u.year) e.date = 'Tell us roughly when you stayed (month and year).';
    return e;
  }
  let fileSeq = 100;
  function addFiles(fileList) {
    const u = S.up; const room = 3 - u.files.length; const arr = Array.from(fileList);
    arr.forEach((f, i) => {
      const ok = /^image\/(jpeg|png|heic|heif|webp)$/i.test(f.type) || /\.(heic|heif)$/i.test(f.name);
      if (!ok) { u.fileErrors.push({ name: f.name, msg: 'isn’t a supported format. Use JPG, PNG or HEIC.' }); return; }
      if (f.size > 15 * 1024 * 1024) { u.fileErrors.push({ name: f.name, msg: `is ${(f.size / 1048576).toFixed(0)} MB. The limit is 15 MB per photo.` }); return; }
      if (i >= room) { u.fileErrors.push({ name: f.name, msg: 'wasn’t added: the limit is three photos per submission.' }); return; }
      const rec = { id: ++fileSeq, name: f.name, size: f.size / 1048576, url: '', status: 'uploading', progress: 0 };
      u.files.push(rec);
      try { const r = new FileReader(); r.onload = () => { rec.url = r.result; render(); }; r.readAsDataURL(f); } catch (e) { rec.url = ''; }
      simulateUpload(rec);
    });
    render();
  }
  function simulateUpload(rec, failAt) {
    const tick = () => {
      if (rec.status !== 'uploading') return;
      rec.progress = Math.min(100, rec.progress + 9 + Math.round(Math.random() * 10));
      if (failAt && rec.progress >= failAt) { rec.status = 'failed'; render(); return; }
      if (rec.progress >= 100) { rec.status = 'done'; render(); return; }
      render(); setTimeout(tick, 180);
    };
    setTimeout(tick, 200);
  }
  function sampleFile(i, status, progress) { const s = SAMPLE_FILES[i]; return { id: ++fileSeq, name: s.name, size: s.size, url: s.url, status: status || 'done', progress: progress == null ? 100 : progress }; }

  function signin() {
    const u = S.up; const h = u.hotelId ? hotel(u.hotelId) : null; const n = u.files.filter((f) => f.status === 'done').length;
    const ready = n > 0 && !Object.keys(validate(u)).length;
    const stay = u.month && u.year ? fmtMonth(`${u.year}-${String(u.month).padStart(2, '0')}`) : '';
    return `<div class="wrap"><div class="auth-wrap">
      <a class="crumb" href="#upload">${ic('i-arrow-l')}Back to your photos</a>
      <div><h1>Sign in to submit</h1><p class="muted" style="margin-top:8px">${ready ? `Signing in submits ${n === 1 ? 'this photo' : `these ${n} photos`} for review. Nothing else happens, and you can edit them first.` : 'Your draft is saved on this device. After signing in you can finish it.'}</p></div>
      ${n ? `<div class="sub-summary"><div class="thumbs-mini">${u.files.filter((f) => f.status === 'done').map((f) => `<img src="${f.url}" alt="">`).join('')}</div><span class="muted small">${h ? esc(h.name) : u.newHotel && u.newHotel.name ? esc(u.newHotel.name) : ''}${u.cat ? ` · ${esc(catLabel(u.cat))}` : ''}${stay ? ` · stay ${stay}` : ''}</span></div>` : ''}
      <div class="stack" style="gap:10px">
        <button class="btn btn-secondary btn-lg btn-block" data-act="auth" data-p="Google"><span class="idp idp-g" aria-hidden="true">G</span>Continue with Google</button>
        <button class="btn btn-secondary btn-lg btn-block" data-act="auth" data-p="Apple"><span class="idp idp-a" aria-hidden="true"></span>Continue with Apple</button>
      </div>
      <div class="why"><p><b>Why sign in?</b></p><ul>
        <li>${ic('i-lock')}<span>Every photo is tied to an account so we can act on misuse. That is the only reason we ask.</span></li>
        <li>${ic('i-eye')}<span>We never post anywhere on your behalf, and there is no profile to fill in.</span></li>
        <li>${ic('i-user')}<span>You choose whether your first name is shown or you stay anonymous.</span></li>
        <li>${ic('i-search')}<span>Browsing RealStay never needs an account.</span></li>
      </ul></div>
    </div></div>`;
  }

  function submitted() {
    const s = S.sub; const h = hotel(s.hotelId); const n = s.files.length;
    const summary = `<div class="sub-summary"><div class="thumbs-mini">${s.files.map((f) => `<img src="${f.url}" alt="">`).join('')}</div><span class="small"><b>${plural(n, 'photo')}</b> · ${esc(h.name)} · ${esc(catLabel(s.cat))}</span></div>`;
    const back = `<a class="btn btn-secondary" href="#hotel-${h.id}">Back to ${esc(h.name)}</a>`;
    const status = {
      pending: () => `<div class="okmark">${ic('i-check')}</div><div><h1>Your photos were received</h1><p class="muted" style="margin-top:8px">Thanks for helping the next traveler know what to expect.</p></div>${summary}<span class="status status-pending">${ic('i-clock', 'ic-sm')}Pending review</span>
        <div><p><b>What happens next</b></p><ul class="next-steps" style="margin-top:10px">
          <li>${ic('i-eye')}<span>A moderator checks that each photo shows a hotel room and nothing private. Usually within two days.</span></li>
          <li>${ic('i-image')}<span>Once approved, they appear in the ${esc(h.name)} gallery, newest first, labeled “${S.up.loc === 'near' ? 'Location checked' : 'Community photo'}”.</span></li>
          <li>${ic('i-mail')}<span>We email you when they’re published, or if something needs a correction.</span></li></ul></div>
        <div class="row"><a class="btn btn-primary" href="#hotel-${h.id}">Back to ${esc(h.name)}</a><button class="btn btn-secondary" data-act="new-upload">Share photos of another stay</button></div>`,
      published: () => `<div class="okmark">${ic('i-check')}</div><div><h1>Your photos are published</h1><p class="muted" style="margin-top:8px">They now appear in the ${esc(h.name)} gallery, newest first.</p></div>${summary}<span class="status status-ok">${ic('i-check', 'ic-sm')}Published · ${fmtDate('2026-11-08')}</span>
        <div class="row"><a class="btn btn-primary" href="#hotel-${h.id}">See them in the gallery</a><button class="btn btn-secondary" data-act="new-upload">Share photos of another stay</button></div>`,
      correction: () => `<div class="okmark is-warn">${ic('i-alert')}</div><div><h1>One thing to fix</h1><p class="muted" style="margin-top:8px">Your photos are fine; a moderator thinks one detail is off.</p></div>${summary}<span class="status status-pending">${ic('i-clock', 'ic-sm')}Correction requested</span>
        <div class="notice notice-warn">${ic('i-info')}<div><p><b>Moderator’s note:</b> “These look like a Superior King (the room with the sofa), not a Standard Double. Could you check your booking?”</p></div></div>
        <div class="row"><button class="btn btn-primary" data-act="fix-cat">Change the room type</button><button class="btn btn-secondary" data-act="keep-cat">It is a Standard Double</button></div>`,
      rejected: () => `<div class="okmark is-danger">${ic('i-x')}</div><div><h1>These photos weren’t published</h1><p class="muted" style="margin-top:8px">Thanks for contributing. One of the photos broke a rule, so the submission was not published.</p></div>${summary}<span class="status status-danger">${ic('i-x', 'ic-sm')}Not published</span>
        <div class="notice notice-danger">${ic('i-alert')}<div><p><b>Reason:</b> people are identifiable in photo 2. RealStay doesn’t publish photos that show faces.</p><p><b>What you can do:</b> crop or retake that photo and submit again. Photos 1 and 3 were fine and can be resubmitted as they are.</p></div></div>
        <div class="row"><button class="btn btn-primary" data-act="resubmit">Submit again</button>${back}</div>`,
    }[s.status]();
    return `<div class="wrap"><div class="confirm-wrap">${status}</div></div>`;
  }

  // ---------- moderation ----------
  function seedQueue() {
    S.mod.seeded = true;
    const mine = S.up.files.filter((f) => f.status === 'done');
    S.mod.queue = [
      { id: 'q1', hotelId: S.up.hotelId || 'marlow', cat: S.up.cat || 'Standard Double', files: mine.length ? mine.map((f) => f.url) : ['img/t_p02.jpg', 'img/t_p12.jpg'], stay: S.up.month && S.up.year ? `${S.up.year}-${String(S.up.month).padStart(2, '0')}` : '2026-10', when: '2 h ago', uploaded: '8 Nov 2026, 14:10', by: S.user ? S.user.name : 'Alex R.', account: 'account 1 day old · 0 approved · 0 rejected', display: S.up.display === 'anon' ? 'anonymous' : 'first name and initial', note: S.up.note || '5th floor, street side.', loc: S.up.loc === 'declined' || S.up.loc === 'idle' ? 'none' : S.up.loc, exif: null, dup: null },
      { id: 'q2', hotelId: 'palm-court', cat: 'Family Villa', files: ['img/t_p05.jpg'], stay: '2026-08', when: '5 h ago', uploaded: '8 Nov 2026, 11:02', by: 'Anonymous', account: 'account 3 months old · 2 approved · 0 rejected', display: 'anonymous', note: null, loc: 'none', exif: '14 Aug 2026', dup: 'Photo 1 looks very similar to an approved photo in Beachfront Villa (photo 12). Possibly the wrong room type.' },
      { id: 'q3', hotelId: 'kinsley', cat: 'Classic Double', files: ['img/t_p06.jpg', 'img/t_p04.jpg', 'img/t_p13.jpg'], stay: '2026-11', when: 'yesterday', uploaded: '7 Nov 2026, 22:41', by: 'Chris D.', account: 'account 1 day old · 0 approved · 0 rejected', display: 'first name and initial', note: null, loc: 'far', exif: '2 Feb 2024', dup: null },
      { id: 'q4', hotelId: 'marlow-res', cat: 'Studio', files: ['img/t_p14.jpg'], stay: '2026-10', when: '2 days ago', uploaded: '6 Nov 2026, 09:15', by: 'Nils F.', account: 'account 2 years old · 5 approved · 0 rejected', display: 'first name and initial', note: 'Studio on the 3rd floor, afternoon.', loc: 'near', exif: null, dup: null },
    ];
    S.mod.sel = 'q1';
  }
  function moderation() {
    const m = S.mod; const q = m.queue; const cur = q.find((x) => x.id === m.sel) || q[0];
    const sig = (cls, icon, text) => `<li class="sig-${cls}">${ic(icon)}<span>${text}</span></li>`;
    const detail = !cur ? `<div class="empty">${ic('i-check')}<h3>All caught up</h3><p>No pending submissions. New ones appear here as they come in.</p></div>` : (() => {
      const h = hotel(cur.hotelId);
      const signals = [
        cur.loc === 'near' ? sig('ok', 'i-pin', '<b>Location check:</b> device was near the property at upload (about 300 m).') : cur.loc === 'far' ? sig('warn', 'i-pin', '<b>Location check:</b> device was about 12 km from the property at upload.') : sig('neutral', 'i-pin', '<b>Location check:</b> not performed.'),
        cur.exif ? (cur.exif.endsWith('2024') ? sig('warn', 'i-camera', `<b>Photo data:</b> capture date ${cur.exif}, which is long before the reported stay (${fmtMonth(cur.stay)}).`) : sig('ok', 'i-camera', `<b>Photo data:</b> capture date ${cur.exif}, phone camera.`)) : sig('neutral', 'i-camera', '<b>Photo data:</b> no capture date in the file.'),
        cur.dup ? sig('warn', 'i-image', `<b>Duplicate check:</b> ${cur.dup}`) : sig('ok', 'i-image', '<b>Duplicate check:</b> no similar photo found.'),
      ];
      const reasons = m.mode === 'reject' ? REJECT_REASONS : CORRECT_REASONS;
      return `<div class="mod-detail card card-pad">
        <div><h2 style="font-size:1.25rem">${esc(h.name)}</h2><p class="muted small">${esc(cur.cat)} · ${plural(cur.files.length, 'photo')} · submitted ${cur.when}</p></div>
        <div class="mod-photos">${cur.files.map((u, i) => `<button type="button" aria-label="Photo ${i + 1}, open larger" data-act="mod-zoom" data-src="${u}"><img src="${u}" alt=""></button>`).join('')}</div>
        <dl class="kv">
          <dt>Hotel</dt><dd>${esc(h.name)} · ${esc(placeLine(h))}</dd>
          <dt>Room type</dt><dd>${esc(cur.cat)}</dd>
          <dt>Stay</dt><dd>${fmtMonth(cur.stay)} <span class="muted">· reported</span></dd>
          <dt>Uploaded</dt><dd>${cur.uploaded}</dd>
          <dt>Contributor</dt><dd>${esc(cur.by)} <span class="muted">· ${cur.account}</span></dd>
          <dt>Shown as</dt><dd>${cur.display}</dd>
          ${cur.note ? `<dt>Note</dt><dd>“${esc(cur.note)}”</dd>` : ''}
        </dl>
        <div><h3 style="font-size:1rem;margin-bottom:8px">Signals</h3><ul class="signals">${signals.join('')}</ul></div>
        ${m.mode ? `<div class="mod-reason" role="group" aria-labelledby="rsnT">
          <p id="rsnT"><b>${m.mode === 'reject' ? 'Reject this submission' : 'Request a correction'}</b></p>
          <div class="field"><label for="rsn">Reason</label><select class="input" id="rsn" data-act="mod-reason" autofocus><option value="">Choose a reason</option>${reasons.map((r) => `<option ${m.reason === r ? 'selected' : ''}>${esc(r)}</option>`).join('')}</select></div>
          <div class="field"><label for="rsnMsg">Message to the contributor <span class="muted">(optional)</span></label><textarea class="input" id="rsnMsg" data-act="mod-msg" placeholder="${m.mode === 'reject' ? 'e.g. Photo 2 shows a person’s face.' : 'e.g. These look like a Superior King. Could you check your booking?'}">${esc(m.msg)}</textarea></div>
          <div class="row" style="justify-content:flex-end"><button class="btn btn-secondary" data-act="mod-cancel">Cancel</button><button class="btn ${m.mode === 'reject' ? 'btn-danger' : 'btn-primary'}" data-act="mod-send" ${m.reason ? '' : 'disabled'}>${m.mode === 'reject' ? 'Reject and notify' : 'Send request'}</button></div>
        </div>` : `<div class="mod-actions"><button class="btn btn-primary" data-act="mod-approve">${ic('i-check')}Approve</button><button class="btn btn-secondary" data-act="mod-mode" data-mode="correct">Request correction</button><button class="btn btn-danger" data-act="mod-mode" data-mode="reject">Reject</button></div>`}
      </div>`;
    })();
    return `<div class="wrap mod">
      <div class="mod-head"><div><span class="eyebrow">Internal</span><h1>Moderation queue</h1></div><span class="status ${q.length ? 'status-pending' : 'status-ok'}">${q.length ? `${q.length} pending` : 'Nothing pending'}</span></div>
      <div class="mod-grid">
        <ul class="mod-list" aria-label="Pending submissions">${q.map((x) => { const h = hotel(x.hotelId); return `<li><button type="button" class="mod-item" aria-current="${x.id === (cur && cur.id)}" data-act="mod-sel" data-id="${x.id}"><img src="${x.files[0]}" alt=""><span><b>${esc(h.name)}</b><span>${esc(x.cat)} · ${plural(x.files.length, 'photo')}</span></span><span class="when">${x.when}</span></button></li>`; }).join('')}</ul>
        ${detail}
      </div>
    </div>`;
  }

  // ---------- design system page ----------
  function system() {
    const colors = [
      ['--bg', 'Background', 'page'], ['--surface', 'Surface', 'cards, inputs'], ['--surface-2', 'Surface 2', 'chips, skeletons'], ['--ink', 'Ink', 'text'], ['--ink-2', 'Ink 2', 'secondary text'], ['--line', 'Line', 'borders'], ['--line-strong', 'Line strong', 'input borders'],
      ['--accent', 'Accent', 'primary actions'], ['--accent-soft', 'Accent soft', 'location label'], ['--ok', 'OK', 'success'], ['--warn', 'Warning', 'pending, stale'], ['--danger', 'Danger', 'errors, reject'],
    ];
    return `<div class="wrap doc">
      <div><span class="eyebrow">Design system</span><h1 style="margin-top:6px">RealStay components</h1></div>
      <p class="lede">A small system sized for the MVP: tokens that map one-to-one to a Tailwind theme, and the twelve components the eight screens are built from. Every control here is the live component, not a picture of it. Light and dark follow the viewer’s system setting.</p>
      <section><h2>Color tokens</h2><p>Warm neutrals with one deep teal accent. Semantic colors are separate from the accent and never the only carrier of meaning: every status also has an icon and a word. Contrast is computed live against the surface each token is used on.</p>
        <div class="swatches">${colors.map(([v, n, use]) => `<div class="sw"><div class="c" style="background:var(${v})"></div><div class="t"><b>${n}</b><span data-token="${v}">${v}</span><span class="muted">${use}</span></div></div>`).join('')}</div></section>
      <section><h2>Typography</h2><p>Bricolage Grotesque for headlines (600), Figtree for everything else. Body is 16px at every width; the smallest text in the product is 14px and only for labels and metadata, always at 4.5:1 or better.</p>
        <div class="type-scale">
          <div><span class="lab">Display · 40–52</span><h1 style="font-size:2.5rem">See what your room really looks like.</h1></div>
          <div><span class="lab">H1 · 28–36</span><h1 style="font-size:1.75rem">Hotel Marlow</h1></div>
          <div><span class="lab">H2 · 22</span><h2 style="font-size:1.375rem;border:0;padding:0">Recent guest photos</h2></div>
          <div><span class="lab">H3 · 17/600</span><h3>Standard Double</h3></div>
          <div><span class="lab">Body · 16</span><p>Explore recent room photos shared by travelers who stayed there.</p></div>
          <div><span class="lab">Small · 15</span><p class="small muted">Uploaded 5 Nov 2026 · reported stay October 2026</p></div>
          <div><span class="lab">Label · 14/600</span><p class="xs" style="font-weight:600">Location checked</p></div>
        </div></section>
      <section><h2>Spacing and radii</h2><p>A 4px scale (4, 8, 12, 16, 24, 32, 48, 64). Four radii: 6 for small chips and inline elements, 10 for buttons and inputs, 14 for cards and thumbnails, 20 for large containers. Photos use 14 so they read as objects, not screenshots.</p>
        <div class="spacing">${[4, 8, 12, 16, 24, 32, 48].map((s) => `<div style="width:${s}px;height:${s}px" title="${s}px"></div>`).join('')}<span class="muted xs">4 → 48</span></div>
        <div class="radii"><div style="border-radius:6px">6</div><div style="border-radius:10px">10</div><div style="border-radius:14px">14</div><div style="border-radius:20px">20</div></div></section>
      <section><h2>Buttons</h2><p>Minimum 44px tall; 52px for the single primary action of a screen. One primary per view. Icon buttons are 44×44 circles. Focus is a 2px accent ring with offset, on every control.</p>
        <div class="demo"><button class="btn btn-primary">Share your photos</button><button class="btn btn-secondary">${ic('i-camera')}Share photos</button><button class="btn btn-ghost">Share a recent photo</button><button class="btn btn-danger">Reject</button><button class="btn btn-primary" disabled>Submit 0 photos</button><button class="btn btn-icon btn-secondary" aria-label="Close">${ic('i-x')}</button><button class="btn btn-primary btn-lg">Sign in and submit</button></div></section>
      <section><h2>Inputs</h2><p>48px tall, labels always present (visible or screen-reader only for the single hero search). Errors are red text with an icon under the field and are repeated in a summary at the top of long forms.</p>
        <div class="demo-grid">
          <div class="field"><label for="ds-i1">Hotel name or city</label><div class="input-wrap">${ic('i-search', 'ic-lead')}<input class="input" id="ds-i1" placeholder="e.g. Hotel Marlow"></div></div>
          <div class="field"><label for="ds-i2">Month</label><select class="input" id="ds-i2"><option>October</option></select></div>
          <div class="field"><label for="ds-i3">Hotel name</label><input class="input" id="ds-i3" aria-invalid="true" aria-describedby="ds-e3" value=""><p class="error" id="ds-e3">${ic('i-alert')}Choose the hotel (or add its name and city).</p></div>
          <div class="field"><label for="ds-i4">Note for future guests</label><textarea class="input" id="ds-i4" placeholder="e.g. Room 412, taken from the door"></textarea></div>
        </div></section>
      <section><h2>Filter chips</h2><p>Room types are a radio group of chips with counts; they wrap rather than scroll so every type is visible on a phone. A clock marks a type whose most recent stay is over a year old (icon plus accessible text, never colour alone). The selected chip is ink-filled, so it never competes with the teal primary action. Zero-count chips stay selectable (dashed) and lead to an empty state with a contribution prompt.</p>
        <div class="demo"><span class="chip" role="radio" aria-checked="true">All<span class="count">8</span></span><span class="chip" role="radio" aria-checked="false">Standard Double<span class="count">4</span></span><span class="chip" role="radio" aria-checked="false">Superior King<span class="count">3</span></span><span class="chip" role="radio" aria-checked="false" aria-label="Junior Suite, 1 photo, none from the last 12 months">${ic('i-clock', 'ic-old')}Junior Suite<span class="count">1</span></span><span class="chip is-empty" role="radio" aria-checked="false">Family Room<span class="count">0</span></span></div></section>
      <section><h2>Provenance labels</h2><p>Two labels ship in the MVP. The third is reserved and appears nowhere in the product screens. Each label has a one-sentence explanation that shows in the viewer; labels never use color alone (icon + text). Upload date and reported stay are always two separate facts.</p>
        <div class="demo-grid">
          <div class="trust-row">${trustTag('community')}<p>${TRUST.community.why}</p></div>
          <div class="trust-row">${trustTag('location')}<p>${TRUST.location.why}</p></div>
          <div class="trust-row">${trustTag('verified', 'trust-future')}<p><b>Future.</b> For photos linked to trustworthy evidence of a real stay (for example a booking confirmation). Not implemented and not shown in any MVP screen; included here so the system has a reserved slot and the two shipped labels are never mistaken for it.</p></div>
          <div class="trust-row"><div class="row"><span class="status status-pending">${ic('i-clock', 'ic-sm')}Pending review</span><span class="status status-ok">${ic('i-check', 'ic-sm')}Published</span><span class="status status-danger">${ic('i-x', 'ic-sm')}Not published</span><span class="status status-neutral">${ic('i-lock', 'ic-sm')}Internal</span></div><p>Submission status pills (contributor and moderation views).</p></div>
        </div></section>
      <section><h2>Cards and thumbnails</h2><p>Hotel cards and photo cards share one anatomy: 4:3 image with radius 14, then two lines of text, then a label. A card is one upload, not one photo: when a guest shared several photos of the same stay, the card shows the first with a count badge, and the viewer flips through only that upload. The card’s date is always the stay month (“Stayed Oct 2026”), marked with a clock when over a year old; the upload date lives in the viewer. Cards are buttons; the whole card is the target.</p>
        <div class="gallery">${photoCard(PHOTOS[0], 2)}${photoCard(PHOTOS[7])}<a class="hcard" href="#hotel-marlow"><div class="ph"><img src="img/t_p03.jpg" alt="">${trustTag('location')}</div><h3>Hotel Marlow</h3><p class="sub">Alfama, Lisbon</p><p class="meta"><b>8 guest photos</b> · latest stay Oct 2026</p></a><div><div class="skel skel-ph"></div><div class="skel skel-line"></div><div class="skel skel-line short"></div></div></div></section>
      <section><h2>Notices, empty states, toasts, dialogs</h2>
        <div class="stack">
          <div class="notice">${ic('i-info')}<p>Neutral notice: You don’t seem to be near the hotel right now. You can still submit.</p></div>
          <div class="notice notice-warn">${ic('i-clock')}<p>Warning: No photos from the last 12 months in Junior Suite.</p></div>
          <div class="notice notice-ok">${ic('i-check')}<p>Success: Your device is near Hotel Marlow.</p></div>
          <div class="notice notice-danger">${ic('i-alert')}<p>Error: IMG_2231.gif isn’t a supported format. Use JPG, PNG or HEIC.</p></div>
          <div class="empty">${ic('i-camera')}<h3>No guest photos yet for Family Room</h3><p>Stayed in one? Your photos would be the first.</p><button class="btn btn-primary">Share photos of a Family Room</button></div>
          <div class="row"><button class="btn btn-secondary" data-act="demo-toast">Show a toast</button><button class="btn btn-secondary" data-act="demo-dialog">Open the report dialog</button></div>
        </div></section>
      <section><h2>Implementation notes (React + Tailwind)</h2>
        <p>Tokens above become <code>theme.extend.colors</code> (bg, surface, ink, line, accent, ok, warn, danger) with CSS variables for dark mode. Components: <b>Button</b> (primary, secondary, ghost, danger, icon; sm, md, lg), <b>Input</b>/<b>Select</b>/<b>Textarea</b> with <b>Field</b> wrapper, <b>SearchBox</b> with combobox suggestions, <b>Chip</b> radio group, <b>TrustLabel</b>, <b>StatusPill</b>, <b>HotelCard</b>, <b>PhotoCard</b>, <b>Gallery</b> (grid + skeleton + empty), <b>PhotoViewer</b> (dialog with focus trap, keyboard and swipe), <b>Dropzone</b> + <b>Thumb</b>, <b>Notice</b>, <b>EmptyState</b>, <b>Toast</b>, <b>Dialog</b>. Breakpoints used here: 560, 640, 760, 900, 1024; as Tailwind screens: sm 640, md 768, lg 1024. Everything in this prototype is plain HTML and CSS, so each component maps directly to JSX with class names.</p></section>
    </div>`;
  }
  function paintContrast() {
    const cs = getComputedStyle(document.documentElement);
    const parse = (v) => { v = v.trim(); if (v.startsWith('#')) { const h = v.slice(1); const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h; return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16)); } const m = v.match(/\d+(\.\d+)?/g); return m ? m.slice(0, 3).map(Number) : [0, 0, 0]; };
    const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const ratio = (a, b) => { const l1 = lum(parse(a)), l2 = lum(parse(b)); return ((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(1); };
    const bg = cs.getPropertyValue('--bg'), surface = cs.getPropertyValue('--surface'), onAccent = cs.getPropertyValue('--on-accent');
    document.querySelectorAll('[data-token]').forEach((el) => {
      const t = el.dataset.token; const val = cs.getPropertyValue(t).trim();
      let extra = '';
      if (['--ink', '--ink-2', '--accent', '--ok', '--warn', '--danger'].includes(t)) extra = ` · ${ratio(val, surface)}:1 on surface`;
      if (t === '--accent') extra += ` · ${ratio(onAccent, val)}:1 as button`;
      el.textContent = `${val.toUpperCase()}${extra}`;
    });
  }

  // ---------- decisions page ----------
  function decisions() {
    const d = (tag, title, body) => `<div class="decision"><span class="tag">${tag}</span><h3>${title}</h3><p>${body}</p></div>`;
    const row = (q, v, w) => `<tr><td>${q}</td><td>${v}</td><td>${w}</td></tr>`;
    return `<div class="wrap doc">
      <div><span class="eyebrow">Rationale</span><h1 style="margin-top:6px">UX decisions and self-critique</h1></div>
      <p class="lede">The product has one job: tell a traveler what a room is likely to look like, and let them say so after their stay. Every decision below was tested against that job; anything that didn’t serve it was cut.</p>
      <section><h2>Decisions</h2><div class="decisions">
        ${d('Homepage', 'The search field is the hero; photography is the evidence, not the backdrop.', 'A full-bleed hero photo would compete with the one thing a visitor must do first. The headline and search take the first screen; the first photos appear directly under it as proof of what the product contains. The whole page is five blocks and under 120 words.')}
        ${d('Access', 'Browsing never asks for an account. Sign-in is the last step of contributing, and signing in is the submit.', 'Authentication is a cost paid only by contributors, only once, and only after they have invested effort. The sign-in screen restates exactly what will be submitted (photos, hotel, room type, stay month); a complete draft goes straight to review when the account comes back, with no second press of a submit button. The draft is kept on the device if anything is still missing.')}
        ${d('Trust', 'Two honest labels, plain words, one sentence of explanation each.', '“Community photo” and “Location checked” describe what actually happened. Neither claims verification, and the location label spells out its own limit. “Stay verified” exists in the system as a reserved slot and nowhere in the product. No scores, percentages or badges: a single label per photo, always with an icon and text.')}
        ${d('Dates', 'The stay month is the date that matters to a traveler, so it is the one on every card. Upload and capture dates stay separate and labeled.', '“Stayed Oct 2026” answers the traveler’s question (what did the room look like recently?). The upload date answers a provenance question and the file’s capture date a forensic one; both are in the viewer, each labeled with where it comes from. Showing a bare “3 days ago” would invite reading an upload time as the room’s current condition. Galleries sort by stay month by default, with “Recently added” one choice away.')}
        ${d('Gallery', 'Room types are chips with counts and a staleness mark; the key question is answered before scrolling.', '“Are there recent photos of the room I’m considering?” is answered by the chip row (a clock on any room type with nothing from the last twelve months), the freshness line under it, and a warning when the filtered set is all older than a year. Chips wrap instead of scrolling, so every room type is visible on a phone. Zero-count chips remain selectable and lead to an empty state that asks for the missing photo.')}
        ${d('Search', 'Search accepts how people actually type a hotel, and similar names are told apart by type, district and city.', 'Travelers paste from a booking confirmation (“Hotel Marlow Lisbon”), reorder words, drop accents and make one-letter typos. Matching is word-based in any order, accent-insensitive, and tolerates one typo on longer words; a single unambiguous hit opens the hotel directly. When nothing matches, hotels that share a word are offered before the fallback of adding a hotel. Three “Marlow” properties in two cities are the realistic ambiguity case; each result shows type, neighbourhood, city, country and photo count.')}
        ${d('Honesty', 'Small real numbers over impressive fake ones.', 'A hotel with two photos says two photos. There are no view counters, “trending” tags, urgency or leaderboards, and the sample content is labeled as sample on every public screen.')}
        ${d('Upload', 'One page, five short steps, optional parts folded away, almost nothing to type.', 'Hotel and room type are picks, photos are a tap, the stay is two selects. Location check, a note and the display-name choice sit inside one disclosure. Validation errors appear under the field and are summarised at the top with links. A photo that fails to upload is listed in words under the thumbnails with Retry and Remove, and it blocks submission until resolved: nothing the contributor chose is ever dropped silently.')}
        ${d('Mobile', 'On a phone the photos come right after the hotel name; the contributor prompt moves below the gallery.', 'A traveler arrives to look, not to upload. On narrow widths the “Share your photos” button and the listing-photo comparison sit in a band after the gallery, and the room-type chips wrap rather than scroll. The first screen spends its space on the hotel, the room types and the first photos instead of on a prompt to upload. On desktop there is room for both at the top.')}
        ${d('Viewer', 'A card is one upload; the viewer flips only through that upload’s photos.', 'A guest shares up to three photos of one stay (bed, bathroom, view), and they belong together: same room, same date, same contributor. So the gallery shows one card per upload with a count badge, and the carousel moves within that upload only, with “2 of 3 · from this stay” as the counter. Mixing every photo of the hotel into one endless carousel would blur which photos came from which stay. Keyboard arrows, Escape, visible focus, 44px previous/next buttons and swipe all work; the mobile panel keeps the key facts visible and folds the rest.')}
        ${d('Moderation', 'Signals, not scores; three actions; reasons are a short list.', 'The moderator sees what is known (location result, file capture date, duplicate check, account history) and decides. Rejection and correction each need a reason from a fixed list so the contributor gets an actionable message.')}
        ${d('Layout', 'One set of components from 320px to 1440px, driven by container width.', 'The same markup serves the phone and desktop previews; the grid goes from two columns to four, the viewer’s panel moves from bottom to side, the upload submit bar is sticky only on narrow widths. Nothing is designed twice.')}
      </div></section>
      <section><h2>Research review, revision 2</h2><p>A skeptical pass over the first version, asking one question: what stops a first-time traveler on a phone from quickly finding recent, trustworthy photos of the room they booked? Five problems were found and fixed; none of the fixes is cosmetic.</p>
        <div class="table-wrap"><table class="crit"><thead><tr><th>Problem found</th><th>Principle</th><th>Change made</th></tr></thead><tbody>
          ${row('Search only matched a contiguous substring. “Hotel Marlow Lisbon” (as a booking confirmation reads), “Marlow Hotel” or “Marlowe” all ended in “No hotel matches”, and the only way out was a contributor action.', 'Error tolerance and flexibility (Nielsen 5, 7); the search box is the single entry point, so a miss here is a total failure.', 'Word-based matching in any order, accent-insensitive, one typo tolerated on longer words. One unambiguous hit opens the hotel. No match shows hotels that share a word before offering to add one.')}
          ${row('On a 390px phone the first guest photo was about 600px down: the contributor button, the listing-photo block and a two-line summary came first. The room-type chips scrolled sideways with the scrollbar hidden, so types past the edge were invisible.', 'Primary task first; visibility of options (Nielsen 1, 8); no hidden content on touch.', 'Narrow widths move the share button and listing comparison into a band after the gallery. Chips wrap so every room type is visible. The first screen now holds the hotel, every room type with its count and staleness, the freshness line and the first row of photos.')}
          ${row('The only date on a card was an unlabeled relative time (“3 days ago”) that meant the upload, not the stay. It read as how current the room is, which is exactly the conflation the brief warns about. Chips showed counts but not whether a type had anything recent.', 'Match the system to the real world (Nielsen 2); honest provenance.', 'Cards show “Stayed Oct 2026”, with a clock mark when the stay is over a year old. Galleries sort by stay month; “Recently added” remains a choice. Chips carry the same clock mark. The viewer lists stay, upload and capture dates, each labeled.')}
          ${row('Pressing the primary button sent contributors to sign in, then back to the form to find and press Submit a second time.', 'Minimise steps and memory load (Nielsen 6); every extra step after an OAuth round trip loses people.', 'The sign-in screen restates what will be submitted and signing in submits it. The button on the form now says “Sign in and submit”. The form is shown again only if something is still missing.')}
          ${row('A photo whose upload failed was quietly left out at submission as long as another photo had succeeded. Its only message was a small overlay on a one-third-width thumbnail.', 'Error prevention and recovery (Nielsen 5, 9); never discard user input silently.', 'A failed photo is listed in words under the thumbnails with Retry and Remove at full size, and it blocks submission until the contributor decides.')}
        </tbody></table></div>
        <p><b>Steps removed from the core journeys.</b> Browsing: a search with one clear hit skips the results page, so the common path is search → hotel → room type → photo. Contributing: the return to the form after sign-in is gone, so the path is form → sign in → confirmation. Considered and kept: the stay-month step (two selects; defaulting it would fabricate a fact), the “How it works” strip on the homepage (it is the only place that says what a “guest photo” is), and the teal colour of “Location checked” (it is the stronger of the two labels and says so in one sentence; testing should watch for over-trust).</p></section>
      <section><h2>Cut on purpose</h2><p>Booking, prices and availability (RealStay is not a booking site). Maps (a district name identifies a property well enough for this task). Profiles, follows, feeds, likes and leaderboards. Trust scores and “verified” claims we cannot back. Per-photo comments. Account creation beyond Google and Apple sign-in.</p></section>
      <section><h2>Staff critique</h2><p>The nine questions from the brief, answered against the screens as built.</p>
        <div class="table-wrap"><table class="crit"><thead><tr><th>Question</th><th>Verdict</th><th>What to watch in testing</th></tr></thead><tbody>
          ${row('Can a first-time visitor understand RealStay immediately?', 'Yes. Headline, one sentence, a search field, and real photos above the fold.', 'Whether “guest photos” is read as reviews. The “How it works” strip exists for that case.')}
          ${row('Can someone find relevant room photos with minimal effort?', 'Type the hotel as the booking names it, land on the hotel, tap the room type. On a phone the first photos are on the first screen; chips show count and staleness before a tap.', 'Room-type names differ between booking sites and hotels; “Not sure” on upload may put photos in the wrong bucket.')}
          ${row('Is the difference between authentic-looking and actually verified clear?', 'Nothing in the MVP is called verified. Both labels explain themselves in the viewer.', 'Users may still over-trust “Location checked”. The explanation is one sentence away; test whether anyone reads it.')}
          ${row('Is uploading from a smartphone simple?', 'Camera and library buttons, 1–3 photos, two selects for the date, optional context folded away, sticky submit, and sign-in is the submit.', 'HEIC handling and large files on slow connections; the retry state covers failure but not slowness.')}
          ${row('Is the UI accessible and usable without instructions?', 'Labels on every input, 44px targets, visible focus, keyboard and swipe in the viewer, live regions for toasts and progress, reduced motion respected.', 'The hero search uses a screen-reader-only label; a visible label is the fallback if testing shows confusion.')}
          ${row('Are the screens visually consistent?', 'One token set, one card anatomy, one chip style, one label style across all eight screens and both widths.', 'The moderation screen is deliberately plainer; keep it from drifting into a dashboard.')}
          ${row('Are empty and failure states understandable?', 'Twelve designed states, each with a plain sentence and one next action.', 'Copy length on 320px screens; a few notices run three lines there.')}
          ${row('Is the design realistically implementable in a short sprint?', 'Twelve components, no library beyond React and Tailwind, no maps or payments. This prototype is already semantic HTML and CSS.', 'The photo viewer (focus trap, gestures) and the dropzone are the two components that need real engineering time.')}
          ${row('Does every prominent feature serve the core purpose?', 'Search, gallery, viewer, upload. Everything else is secondary navigation or an internal tool.', 'Resist adding a “helpful” vote before the gallery has enough photos for it to mean anything.')}
        </tbody></table></div></section>
    </div>`;
  }

  // ---------- toasts ----------
  function toast(msg, danger) {
    const host = $('#toasts'); host.innerHTML = `<div class="toast${danger ? ' is-danger' : ''}">${ic(danger ? 'i-alert' : 'i-check')}<span>${msg}</span></div>`;
    clearTimeout(S.toastT); S.toastT = setTimeout(() => { host.innerHTML = ''; }, 3200);
  }

  // ---------- events ----------
  document.addEventListener('submit', (e) => {
    const f = e.target.closest('[data-form="search"]'); if (!f) return;
    e.preventDefault();
    const inp = f.querySelector('input[name="q"]'); S.q = inp.value; S.sugOpen = false; S.sugIdx = -1;
    openSearch();
  });
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.matches('[data-form="search"] input[name="q"]')) { S.q = t.value; S.sugOpen = t.closest('[data-searchbox]') != null && t.value.trim().length >= 2; S.sugIdx = -1; const host = t.closest('[data-searchbox]') && t.closest('[data-searchbox]').querySelector('.suggest-host'); if (host) host.innerHTML = S.sugOpen ? suggestList(t.id) : ''; t.setAttribute('aria-expanded', S.sugOpen ? 'true' : 'false'); const clr = t.parentElement.querySelector('.btn-clear'); if (!clr && t.value) render(); if (clr && !t.value) render(); return; }
    const act = t.dataset.act;
    if (act === 'up-hotel-q') { S.up.hotelQ = t.value; const host = t.closest('[data-searchbox]').querySelector('.suggest-host'); host.innerHTML = t.value.trim().length >= 2 ? upSuggest() : ''; return; }
    if (act === 'up-note') { S.up.note = t.value; const c = t.parentElement.querySelector('.hint.tnum'); if (c) c.textContent = `${t.value.length} / 140`; return; }
    if (act === 'nh-name') { S.up.newHotel.name = t.value; const b = $('#step-hotel .picked b'); if (b) b.textContent = t.value || 'New hotel'; return; }
    if (act === 'nh-city') { S.up.newHotel.city = t.value; const s = $('#step-hotel .picked span'); if (s) s.textContent = `${t.value || 'City not set'} · will be added after review`; return; }
    if (act === 'mod-msg') { S.mod.msg = t.value; return; }
  });
  document.addEventListener('change', (e) => {
    const t = e.target; const act = t.dataset.act;
    if (act === 'sort') { S.sort = t.value; render(); }
    else if (act === 'files') { addFiles(t.files); t.value = ''; }
    else if (act === 'up-month') { S.up.month = t.value; render(); }
    else if (act === 'up-year') { S.up.year = t.value; render(); }
    else if (act === 'up-display') { S.up.display = t.value; }
    else if (act === 'report-reason') { S.modal.reason = t.value; render(); }
    else if (act === 'mod-reason') { S.mod.reason = t.value; render(); }
  });
  document.addEventListener('toggle', (e) => { const d = e.target; if (d.matches && d.matches('[data-act="ctx-toggle"]')) S.up.ctxOpen = d.open; }, true);
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) { if (S.sugOpen && !e.target.closest('[data-searchbox]')) { S.sugOpen = false; document.querySelectorAll('.suggest-host').forEach((h) => (h.innerHTML = '')); } return; }
    const act = el.dataset.act; const d = el.dataset;
    switch (act) {
      case 'try': S.q = d.q; openSearch(); break;
      case 'clear-q': S.q = ''; S.sugOpen = false; render(); { const i = $('#q') || $('#tq'); if (i) i.focus(); } break;
      case 'sug-city': S.q = d.q; S.sugOpen = false; go('search'); break;
      case 'sug-hotel': S.sugOpen = false; S.q = hotel(d.id).name; go('hotel-' + d.id); break;
      case 'add-hotel-from-search': S.up = freshUpload(); S.up.newHotel = { name: S.q, city: '' }; go('upload'); break;
      case 'cat': S.cat = d.cat; render(); break;
      case 'upload-for': S.up.hotelId = d.id; S.up.newHotel = null; if (d.cat && d.cat !== 'all') S.up.cat = d.cat; go('upload'); break;
      case 'open-photo': S.viewer = { sub: d.sub, i: 0 }; S.viewerReturn = el.id; render(); break;
      case 'close-viewer': closeViewer(); break;
      case 'prev': if (S.viewer.i > 0) { S.viewer.i--; render(); } break;
      case 'next': if (S.viewer.i < viewerList().length - 1) { S.viewer.i++; render(); } break;
      case 'report': S.modal = { kind: 'report', reason: '' }; render(); break;
      case 'modal-backdrop': if (e.target === el) { S.modal = null; render(); } break;
      case 'close-modal': S.modal = null; render(); break;
      case 'send-report': S.modal = null; render(); toast('Thanks. A moderator will review this photo.'); break;
      case 'jump': e.preventDefault(); { const s = document.getElementById(d.to); if (s) { s.scrollIntoView({ block: 'start', behavior: 'smooth' }); const f = s.querySelector('input, select, button.chip, .btn'); if (f) f.focus({ preventScroll: true }); } } break;
      case 'up-change-hotel': S.up.hotelId = null; S.up.newHotel = null; S.up.cat = null; S.up.hotelQ = ''; render(); { const i = $('#uq'); if (i) i.focus(); } break;
      case 'up-pick-hotel': S.up.hotelId = d.id; S.up.newHotel = null; render(); break;
      case 'up-new-hotel': S.up.newHotel = { name: S.up.hotelQ, city: '' }; S.up.hotelId = null; render(); { const i = $('#nhName'); if (i) i.focus(); } break;
      case 'up-cat': S.up.cat = d.cat; render(); break;
      case 'sample-files': { const need = Math.min(3 - S.up.files.length, 2); for (let i = 0; i < need; i++) { const f = sampleFile(S.up.files.length % 3, 'uploading', 0); S.up.files.push(f); simulateUpload(f); } render(); break; }
      case 'file-rm': S.up.files = S.up.files.filter((f) => f.id !== Number(d.fid)); render(); break;
      case 'file-retry': { const f = S.up.files.find((x) => x.id === Number(d.fid)); if (f) { f.status = 'uploading'; f.progress = 0; simulateUpload(f); render(); } break; }
      case 'file-err-dismiss': S.up.fileErrors.splice(Number(d.i), 1); render(); break;
      case 'loc-check': S.up.ctxOpen = true; S.up.loc = 'checking'; render(); setTimeout(() => { S.up.loc = S.up.locSim; render(); }, 1200); break;
      case 'loc-retry-help': toast('Allow location for this site in your browser settings, then try again.'); break;
      case 'up-continue': {
        if (el.getAttribute('aria-disabled') === 'true') break;
        S.up.attempted = true; const errs = validate(S.up);
        if (Object.keys(errs).length) { render(); const first = $('.valid-summary'); if (first) { first.scrollIntoView({ block: 'start', behavior: 'smooth' }); } break; }
        if (!S.user) { go('signin'); break; }
        submitDraft(); toast(`${plural(S.sub.files.length, 'photo')} submitted for review`);
        break;
      }
      case 'auth': {
        // sign-in is the last gate: a complete draft is submitted right away instead of sending the contributor back to the form
        S.user = { name: 'Alex R.', provider: d.p };
        const n = S.up.files.filter((f) => f.status === 'done').length;
        if (n && !Object.keys(validate(S.up)).length) { submitDraft(); toast(`Signed in with ${d.p} · ${plural(n, 'photo')} submitted for review`); }
        else { S.up.draftKept = true; go('upload'); toast(`Signed in with ${d.p} as Alex R.`); }
        break;
      }
      case 'new-upload': S.up = freshUpload(); go('upload'); break;
      case 'fix-cat': S.up.hotelId = S.sub.hotelId; S.up.cat = null; S.up.files = S.sub.files.slice(); S.up.month = '10'; S.up.year = '2026'; S.up.attempted = false; S.up.draftKept = false; go('upload'); break;
      case 'keep-cat': toast('Sent to the moderator. They’ll take another look.'); break;
      case 'resubmit': S.up.hotelId = S.sub.hotelId; S.up.cat = S.sub.cat; S.up.files = S.sub.files.slice(0, 1).concat(S.sub.files.slice(2)); S.up.month = '10'; S.up.year = '2026'; S.up.attempted = false; go('upload'); break;
      case 'mod-sel': S.mod.sel = d.id; S.mod.mode = null; S.mod.reason = ''; S.mod.msg = ''; render(); break;
      case 'mod-mode': S.mod.mode = d.mode; S.mod.reason = ''; S.mod.msg = ''; render(); break;
      case 'mod-cancel': S.mod.mode = null; render(); break;
      case 'mod-approve': modResolve('Approved', 'published'); break;
      case 'mod-send': modResolve(S.mod.mode === 'reject' ? 'Rejected' : 'Correction requested', S.mod.mode === 'reject' ? 'rejected' : 'correction'); break;
      case 'mod-zoom': { const h = $('#layers'); h.innerHTML = `<div class="layer viewer" role="dialog" aria-modal="true" aria-label="Photo preview" data-act="mod-zoom-close"><div class="viewer-top"><button class="btn btn-icon btn-light" id="viewerClose" data-act="mod-zoom-close" aria-label="Close preview">${ic('i-x')}</button></div><div class="viewer-stage"><div class="viewer-img-wrap"><img src="${d.src.replace('t_', '')}" alt="Submitted photo, larger"></div></div><div></div></div>`; $('#viewerClose').focus(); break; }
      case 'mod-zoom-close': if (e.target === el || el.id === 'viewerClose') { $('#layers').innerHTML = ''; } break;
      case 'demo-toast': toast('Published · 2 photos added to Hotel Marlow'); break;
      case 'demo-dialog': S.modal = { kind: 'report', reason: '' }; render(); break;
    }
  });
  function submitDraft() {
    S.sub = { status: 'pending', hotelId: S.up.hotelId || 'marlow', cat: S.up.cat || 'Not sure', files: S.up.files.filter((f) => f.status === 'done') };
    S.mod.seeded = false; S.mod.queue = [];
    go('submitted');
  }
  function modResolve(label, status) {
    const m = S.mod; const cur = m.queue.find((x) => x.id === m.sel);
    if (cur && cur.id === 'q1') S.sub.status = status;
    const idx = m.queue.findIndex((x) => x.id === m.sel);
    m.queue = m.queue.filter((x) => x.id !== m.sel);
    m.sel = m.queue[Math.min(idx, m.queue.length - 1)] ? m.queue[Math.min(idx, m.queue.length - 1)].id : null;
    m.mode = null; m.reason = ''; m.msg = '';
    render(); toast(`${label} · ${cur ? hotel(cur.hotelId).name : ''}${status === 'published' ? ' · contributor notified' : ' · contributor notified'}`);
  }
  function closeViewer() {
    S.viewer = null; S.modal = null; render();
    const back = S.viewerReturn && document.getElementById(S.viewerReturn); if (back) back.focus({ preventScroll: true });
  }
  document.addEventListener('keydown', (e) => {
    // suggestions keyboard
    const inSearch = e.target.matches && e.target.matches('[data-form="search"] input[name="q"]');
    if (inSearch && S.sugOpen) {
      const items = suggestions(S.q);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); S.sugIdx = e.key === 'ArrowDown' ? Math.min(items.length - 1, S.sugIdx + 1) : Math.max(-1, S.sugIdx - 1); const host = e.target.closest('[data-searchbox]').querySelector('.suggest-host'); host.innerHTML = suggestList(e.target.id); e.target.setAttribute('aria-activedescendant', S.sugIdx >= 0 ? `sug-${e.target.id}-${S.sugIdx}` : ''); return; }
      if (e.key === 'Enter' && S.sugIdx >= 0) { e.preventDefault(); const it = items[S.sugIdx]; S.sugOpen = false; S.sugIdx = -1; if (it.kind === 'city') { S.q = it.q; go('search'); } else { S.q = it.hotel.name; go('hotel-' + it.hotel.id); } return; }
      if (e.key === 'Escape') { S.sugOpen = false; S.sugIdx = -1; e.target.closest('[data-searchbox]').querySelector('.suggest-host').innerHTML = ''; return; }
    }
    if (S.modal) {
      if (e.key === 'Escape') { S.modal = null; render(); return; }
      if (e.key === 'Tab') trap(e, $('.modal'));
      return;
    }
    const zoom = $('#layers [data-act="mod-zoom-close"]'); if (zoom && e.key === 'Escape') { $('#layers').innerHTML = ''; return; }
    if (S.viewer != null) {
      if (e.key === 'Escape') { closeViewer(); return; }
      if (e.key === 'ArrowLeft' && S.viewer.i > 0) { S.viewer.i--; render(); return; }
      if (e.key === 'ArrowRight' && S.viewer.i < viewerList().length - 1) { S.viewer.i++; render(); return; }
      if (e.key === 'Tab') trap(e, $('#viewerRoot'));
    }
  });
  function trap(e, root) {
    if (!root) return;
    const f = [...root.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, summary, [tabindex]:not([tabindex="-1"])')].filter((x) => x.offsetParent !== null || x.closest('.layer'));
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || !root.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  // swipe in the viewer
  let tx = null;
  document.addEventListener('touchstart', (e) => { if (e.target.closest('#viewerStage')) tx = e.touches[0].clientX; }, { passive: true });
  document.addEventListener('touchend', (e) => { if (tx == null || S.viewer == null) return; const dx = e.changedTouches[0].clientX - tx; tx = null; if (Math.abs(dx) < 50) return; if (dx < 0 && S.viewer.i < viewerList().length - 1) { S.viewer.i++; render(); } else if (dx > 0 && S.viewer.i > 0) { S.viewer.i--; render(); } }, { passive: true });
  // drag and drop
  document.addEventListener('dragover', (e) => { const z = e.target.closest('#dropzone'); if (z) { e.preventDefault(); z.classList.add('is-over'); } });
  document.addEventListener('dragleave', (e) => { const z = e.target.closest('#dropzone'); if (z) z.classList.remove('is-over'); });
  document.addEventListener('drop', (e) => { const z = e.target.closest('#dropzone'); if (z) { e.preventDefault(); z.classList.remove('is-over'); if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files); } });

  // ---------- prototype controls ----------
  const stage = $('#stage');
  function setMode(m) { stage.dataset.mode = m; document.querySelectorAll('.seg [data-mode]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.mode === m)); try { localStorage.setItem('rs-mode', m); } catch (e) {} }
  document.querySelectorAll('.seg [data-mode]').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
  let saved = null; try { saved = localStorage.getItem('rs-mode'); } catch (e) {}
  setMode(saved || (window.innerWidth < 760 ? 'phone' : 'desktop'));
  $('#protoScreen').addEventListener('change', (e) => {
    const v = e.target.value;
    if (v === 'viewer') { S.hotelId = 'marlow'; S.cat = 'all'; S.sort = 'stay'; go('hotel-marlow'); S.viewer = { sub: 's1', i: 0 }; render(); return; }
    if (v === 'signin' || v === 'submitted') ensureDraft();
    go(v);
  });
  function ensureDraft() {
    const u = S.up; if (!u.hotelId) u.hotelId = 'marlow'; if (!u.cat) u.cat = 'Standard Double';
    if (!u.files.length) u.files = [sampleFile(0), sampleFile(1), sampleFile(2)];
    if (!u.month) { u.month = '10'; u.year = '2026'; }
    if (!S.sub.files.length) S.sub = { status: S.sub.status, hotelId: u.hotelId, cat: u.cat, files: u.files.filter((f) => f.status === 'done') };
  }
  $('#protoState').addEventListener('change', (e) => {
    const v = e.target.value; if (!v) return; e.target.value = '';
    const fresh = () => { S.up = freshUpload(); S.user = null; };
    switch (v) {
      case 'home-suggestions': S.q = 'mar'; go('home'); S.sugOpen = true; render(); { const i = $('#q'); if (i) { i.focus(); i.setSelectionRange(3, 3); } } break;
      case 'search-similar': S.q = 'marlow'; go('search'); break;
      case 'search-fuzzy': S.q = 'Hotel Marlowe Lisbon'; go('search'); break;
      case 'search-none': S.q = 'Grand Budapest'; go('search'); break;
      case 'gallery-loading': S.hotelId = 'marlow'; S.cat = 'all'; S.loading = true; go('hotel-marlow'); setTimeout(() => { S.loading = false; render(); }, 2600); break;
      case 'hotel-zero': go('hotel-marlow-house'); break;
      case 'cat-empty': S.hotelId = 'marlow'; go('hotel-marlow'); S.cat = 'Family Room'; render(); break;
      case 'cat-stale': S.hotelId = 'marlow'; go('hotel-marlow'); S.cat = 'Junior Suite'; render(); break;
      case 'upload-progress': fresh(); S.up.hotelId = 'marlow'; S.up.cat = 'Standard Double'; S.up.files = [sampleFile(0), sampleFile(1, 'uploading', 35), sampleFile(2, 'uploading', 5)]; S.up.month = '10'; S.up.year = '2026'; go('upload'); S.up.files.slice(1).forEach((f) => simulateUpload(f)); break;
      case 'upload-badfile': fresh(); S.up.hotelId = 'marlow'; S.up.cat = 'Standard Double'; S.up.files = [sampleFile(0)]; S.up.fileErrors = [{ name: 'IMG_2231.gif', msg: 'isn’t a supported format. Use JPG, PNG or HEIC.' }, { name: 'IMG_0094.jpg', msg: 'is 22 MB. The limit is 15 MB per photo.' }]; go('upload'); setTimeout(() => { const s = $('#step-files'); if (s) s.scrollIntoView({ block: 'start' }); }, 50); break;
      case 'upload-failed': fresh(); S.up.hotelId = 'marlow'; S.up.cat = 'Standard Double'; S.up.files = [sampleFile(0), sampleFile(1, 'failed', 62)]; S.up.month = '10'; S.up.year = '2026'; go('upload'); setTimeout(() => { const s = $('#step-files'); if (s) s.scrollIntoView({ block: 'start' }); }, 50); break;
      case 'upload-missing': fresh(); S.up.hotelId = 'marlow'; S.up.attempted = true; go('upload'); break;
      case 'auth-required': fresh(); ensureDraft(); go('signin'); break;
      case 'loc-declined': fresh(); ensureDraft(); S.up.ctxOpen = true; S.up.loc = 'declined'; S.up.locSim = 'declined'; go('upload'); setTimeout(() => { const s = $('#step-ctx'); if (s) s.scrollIntoView({ block: 'start' }); }, 50); break;
      case 'loc-far': fresh(); ensureDraft(); S.up.ctxOpen = true; S.up.loc = 'far'; S.up.locSim = 'far'; go('upload'); setTimeout(() => { const s = $('#step-ctx'); if (s) s.scrollIntoView({ block: 'start' }); }, 50); break;
      case 'sub-pending': ensureDraft(); S.sub.status = 'pending'; go('submitted'); break;
      case 'sub-correction': ensureDraft(); S.sub.status = 'correction'; go('submitted'); break;
      case 'sub-rejected': ensureDraft(); S.sub.status = 'rejected'; go('submitted'); break;
      case 'sub-published': ensureDraft(); S.sub.status = 'published'; go('submitted'); break;
    }
  });

  window.addEventListener('hashchange', route);
  route();
})();
