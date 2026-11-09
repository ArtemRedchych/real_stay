import { useCallback, useEffect, useRef, useState } from 'react';
import { api, type HotelView, type UploadView } from '../api';
import { Icon, TrustTag, fmtDate, fmtMonth, fmtMonthShort, go, plural, trapTab, useFocusHeading, useQueryState, useToast } from '../ui';
import { setDraft, getDraft } from '../draft';

type Sort = 'stay' | 'added' | 'oldest';

function UploadCard({ u, onOpen }: { u: UploadView; onOpen: () => void }) {
  const n = u.photos.length;
  return (
    <button type="button" className="pcard" id={`pc-${u.id}`} onClick={onOpen} aria-label={`Open ${n === 1 ? 'photo' : `${n} photos from one stay`}: ${u.roomType}, stay ${fmtMonth(u.stayMonth)}${u.stale ? ' (over a year ago)' : ''}, added ${fmtDate(u.uploadedAt)}, ${u.trust.label}`}>
      <div className="ph"><img src={u.photos[0].thumbUrl} alt="" loading="lazy" />{n > 1 && <span className="pbadge" aria-hidden="true"><Icon id="i-image" cls="ic-sm" />{n}</span>}</div>
      <div className="l1"><b>{u.roomType}</b><span className={`when${u.stale ? ' is-old' : ''}`}>{u.stale && <Icon id="i-clock" />}Stayed {fmtMonthShort(u.stayMonth)}</span></div>
      <div className="l2"><TrustTag kind={u.trust.kind} /></div>
    </button>
  );
}

function Viewer({ hotel, u, onClose }: { hotel: HotelView; u: UploadView; onClose: () => void }) {
  const [i, setI] = useState(0);
  const [report, setReport] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const p = u.photos[i];
  useEffect(() => { document.getElementById('viewerClose')?.focus(); }, []);
  const prev = () => setI((x) => Math.max(0, x - 1)), next = () => setI((x) => Math.min(u.photos.length - 1, x + 1));
  const onKey = (e: React.KeyboardEvent) => {
    if (report !== null) { if (e.key === 'Escape') setReport(null); trapTab(e, root.current?.querySelector('.modal') || null); return; }
    if (e.key === 'Escape') onClose(); else if (e.key === 'ArrowLeft') prev(); else if (e.key === 'ArrowRight') next(); else trapTab(e, root.current);
  };
  const tx = useRef<number | null>(null);
  const REASONS = ['Not a hotel room', 'Wrong hotel or room type', 'People or personal information visible', 'Looks like a professional or marketing photo', 'Offensive content', 'Something else'];
  return (
    <div className="layer viewer" role="dialog" aria-modal="true" aria-label={`Photo ${i + 1} of ${u.photos.length}, ${hotel.name}`} ref={root} onKeyDown={onKey}>
      <div className="viewer-top">
        <button className="btn btn-icon btn-light" id="viewerClose" onClick={onClose} aria-label="Close photo viewer"><Icon id="i-x" /></button>
        <span className="counter">{u.photos.length > 1 ? `${i + 1} of ${u.photos.length}` : 'One photo'}</span><span className="counter-sub">{u.photos.length > 1 ? 'from this stay' : ''}</span><span className="spacer" />
        <button className="btn btn-light btn-sm" onClick={() => setReport('')}><Icon id="i-flag" />Report</button>
      </div>
      <div className="viewer-stage" onTouchStart={(e) => { tx.current = e.touches[0].clientX; }} onTouchEnd={(e) => { if (tx.current == null) return; const dx = e.changedTouches[0].clientX - tx.current; tx.current = null; if (Math.abs(dx) < 50) return; if (dx < 0) next(); else prev(); }}>
        <div className="viewer-img-wrap"><img src={p.url} alt={`Guest photo ${i + 1} of ${u.photos.length} of a ${u.roomType} at ${hotel.name}, stay ${fmtMonth(u.stayMonth)}`} /></div>
        <button className="btn btn-icon btn-light viewer-nav prev" onClick={prev} aria-label="Previous photo" disabled={i === 0}><Icon id="i-chev-l" /></button>
        <button className="btn btn-icon btn-light viewer-nav next" onClick={next} aria-label="Next photo" disabled={i === u.photos.length - 1}><Icon id="i-chev-r" /></button>
      </div>
      <div className="viewer-info">
        <div><h2>{hotel.name}</h2><p className="sub">{u.roomType} · {hotel.area}, {hotel.city}</p>{u.photos.length > 1 && <p className="sub">{u.photos.length} photos shared together by {u.contributor.display === 'Anonymous contributor' ? 'one guest' : u.contributor.display} after one stay. Arrows move within them.</p>}</div>
        <div><TrustTag kind={u.trust.kind} /><p className="trust-why">{u.trust.why}</p></div>
        <Facts u={u} p={p} cls="more" />
        <div className="more-m"><p className="sub">Stay {fmtMonth(u.stayMonth)}{u.stale ? ' (over a year ago)' : ''} · uploaded {fmtDate(u.uploadedAt)}</p><details><summary><Icon id="i-chev-d" cls="ic-sm" />More about this photo</summary><Facts u={u} p={p} /></details></div>
      </div>
      {report !== null && (
        <div className="layer modal-layer" onClick={(e) => { if (e.target === e.currentTarget) setReport(null); }}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="mTitle">
          <h2 id="mTitle">Report this photo</h2>
          <p className="muted">Tell us what’s wrong. A moderator looks at every report, and the photo stays visible until then.</p>
          <div className="radios" role="radiogroup" aria-label="Reason">{REASONS.map((r, k) => <label key={r}><input type="radio" name="rr" value={r} autoFocus={k === 0} checked={report === r} onChange={() => setReport(r)} />{r}</label>)}</div>
          <div className="actions"><button className="btn btn-secondary" onClick={() => setReport(null)}>Cancel</button><button className="btn btn-primary" disabled={!report} onClick={() => { setReport(null); toast('Thanks. A moderator will review this photo.'); }}>Send report</button></div>
        </div></div>
      )}
    </div>
  );
}

function Facts({ u, p, cls }: { u: UploadView; p: UploadView['photos'][number]; cls?: string }) {
  return (
    <div className={cls}>
      <dl>
        <dt>Stay</dt><dd>{fmtMonth(u.stayMonth)} <span className="sub">· reported by the contributor</span></dd>
        <dt>Uploaded</dt><dd>{fmtDate(u.uploadedAt)}</dd>
        <dt>Photo taken</dt><dd>{p.capturedAt ? <>{fmtDate(p.capturedAt)} <span className="sub">· from the file’s own data</span></> : <span className="sub">Not available in the file</span>}</dd>
        <dt>Shared by</dt><dd>{u.contributor.display}{u.contributor.display !== 'Anonymous contributor' && <span className="sub"> · {plural(u.contributor.contributions, 'contribution')}</span>}</dd>
      </dl>
      {u.note && <p className="note">“{u.note}”</p>}
      {cls === 'more' && <p className="sub" style={{ marginTop: 12 }}><span className="kbd">←</span> <span className="kbd">→</span> move between photos · <span className="kbd">Esc</span> closes</p>}
    </div>
  );
}

export default function Hotel({ id }: { id: string }) {
  const [hotel, setHotel] = useState<HotelView | null | undefined>(undefined);
  const [cat, setCat] = useState('all');
  const [sort, setSort] = useState<Sort>('stay');
  const [list, setList] = useState<UploadView[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const returnTo = useRef<string | null>(null);
  const qs = useQueryState();
  useFocusHeading(hotel?.id);

  useEffect(() => { setHotel(undefined); setCat('all'); setSort('stay'); api.hotel(id).then(setHotel).catch(() => setHotel(null)); }, [id]);
  const load = useCallback(() => { setList(null); api.uploads(id, cat, sort).then(setList).catch(() => setList([])); }, [id, cat, sort]);
  useEffect(() => { if (hotel) load(); }, [hotel, load]);

  if (hotel === undefined) return <div className="wrap"><p className="loading-line">Loading hotel…</p></div>;
  if (hotel === null) return <div className="wrap"><div className="empty" style={{ marginTop: 24 }}><Icon id="i-search" /><h3>We couldn’t find that hotel</h3><a className="btn btn-secondary" href="#home">Back to search</a></div></div>;

  const shareFor = (roomType?: string | null) => { setDraft({ hotel, newHotel: null, roomType: roomType && roomType !== 'all' ? roomType : getDraft().roomType }); go('upload'); };
  const filtered = list || [];
  const latest = filtered.length ? filtered.slice().sort((a, b) => (a.stayMonth < b.stayMonth ? 1 : a.stayMonth > b.stayMonth ? -1 : 0))[0] : null;
  const stale = !!latest?.stale;
  const q = qs.get();
  const current = open ? filtered.find((u) => u.id === open) : null;
  const closeViewer = () => { setOpen(null); requestAnimationFrame(() => { if (returnTo.current) document.getElementById(returnTo.current)?.focus(); }); };
  const listing = hotel.listingPhotoUrl ? <div className="listing-ph"><img src={hotel.listingPhotoUrl} alt="The hotel’s own listing photo" /><p className="t"><b>Hotel’s listing photo</b>For comparison. Not a guest contribution.</p></div> : null;
  const chip = (label: string, key: string, n: number, old: boolean) => (
    <button key={key} type="button" role="radio" className={`chip${n === 0 ? ' is-empty' : ''}`} aria-checked={cat === key} onClick={() => setCat(key)} aria-label={`${label}, ${plural(n, 'photo')}${old ? ', none from the last 12 months' : ''}`}>{old && <Icon id="i-clock" cls="ic-old" />}{label}<span className="count">{n}</span></button>
  );

  return (
    <div className="wrap">
      <a className="crumb" href={q ? '#search' : '#home'}><Icon id="i-arrow-l" />{q ? 'Back to results' : 'Back'}</a>
      <div className="hotel-head">
        <div>
          <h1>{hotel.name}</h1>
          <p className="addr">{hotel.type} · {hotel.area}, {hotel.city}, {hotel.country}</p>
          <p className="summary">{hotel.photoCount ? <><span><b>{plural(hotel.photoCount, 'guest photo')}</b> · latest stay {fmtMonthShort(hotel.latestStay!)}</span><span className="sep">·</span><span>{hotel.roomTypes.filter((r) => r.photoCount).length} of {hotel.roomTypes.length} room types</span></> : <span className="muted">No guest photos yet</span>}</p>
        </div>
        {(listing || hotel.photoCount > 0) && <div className="stack only-wide" style={{ gap: 12 }}>{listing}{hotel.photoCount > 0 && <div className="actions"><button className="btn btn-secondary" onClick={() => shareFor(cat)}><Icon id="i-camera" />Share your photos of this hotel</button></div>}</div>}
      </div>
      {hotel.photoCount > 0 ? (
        <>
          <div className="gallery-tools">
            <div className="chips" role="radiogroup" aria-label="Room type">
              {chip('All', 'all', hotel.photoCount, hotel.latestStay ? false : false)}
              {hotel.roomTypes.map((r) => chip(r.name, r.name, r.photoCount, r.stale))}
            </div>
            <div className="toolbar">
              <p className="fresh" aria-live="polite">{list === null ? 'Loading photos…' : filtered.length ? <><span className="n">{plural(filtered.reduce((n, u) => n + u.photos.length, 0), 'photo')}{cat !== 'all' ? ` of ${cat}` : ''} · </span>Latest stay <b>{fmtMonthShort(latest!.stayMonth)}</b></> : `No photos of ${cat} yet`}</p>
              <div className="sort"><label htmlFor="sort" className="small sort-label">Sort</label><select className="input" id="sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)}><option value="stay">Most recent stay</option><option value="added">Recently added</option><option value="oldest">Oldest stay first</option></select></div>
            </div>
          </div>
          {list === null ? <div className="gallery" aria-busy="true" aria-label="Loading photos">{[...Array(8)].map((_, i) => <div key={i}><div className="skel skel-ph" /><div className="skel skel-line" /><div className="skel skel-line short" /></div>)}</div>
            : filtered.length ? (
              <>
                {stale && <div className="notice notice-warn stale"><Icon id="i-clock" /><div><p><b>No photos from stays in the last 12 months{cat !== 'all' ? ` in ${cat}` : ''}.</b> The most recent stay shown is {fmtMonth(latest!.stayMonth)}, so these may not show the room as it is now.</p><p><button className="inline-link" onClick={() => shareFor(cat)}>Share a recent photo</button></p></div></div>}
                <div className="gallery">{filtered.map((u) => <UploadCard key={u.id} u={u} onOpen={() => { returnTo.current = `pc-${u.id}`; setOpen(u.id); }} />)}</div>
              </>
            ) : <div className="empty"><Icon id="i-camera" /><h3>No guest photos yet for {cat}</h3><p>Stayed in one? Your photos would be the first, and they help the next traveler know what to expect.</p><button className="btn btn-primary" onClick={() => shareFor(cat)}>Share photos of a {cat}</button></div>}
          <div className="contrib-band only-narrow">{listing}<div><p><b>Stayed at {hotel.name}?</b></p><p className="hint">Three photos of your room help the next traveler know what to expect. About a minute; you sign in only at the end.</p></div><button className="btn btn-secondary" onClick={() => shareFor(cat)}><Icon id="i-camera" />Share your photos</button></div>
        </>
      ) : (
        <>
          <div className="empty" style={{ marginTop: 24 }}><Icon id="i-camera" /><h3>No guest photos yet</h3><p>Nobody has shared photos of {hotel.name} so far. If you stayed here, you can be the first.</p><button className="btn btn-primary" onClick={() => shareFor(null)}>Share your photos</button></div>
          {listing && <div className="contrib-band only-narrow">{listing}</div>}
        </>
      )}
      {current && <Viewer hotel={hotel} u={current} onClose={closeViewer} />}
    </div>
  );
}
