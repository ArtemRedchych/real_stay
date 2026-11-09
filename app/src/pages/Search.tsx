import { useEffect, useState } from 'react';
import { api, type HotelView, type SearchResult } from '../api';
import SearchBox from '../components/SearchBox';
import { Icon, fmtMonthShort, go, plural, useFocusHeading, useQueryState } from '../ui';
import { setDraft, freshDraft } from '../draft';

function List({ hotels }: { hotels: HotelView[] }) {
  return (
    <ul className="results">{hotels.map((h) => (
      <li key={h.id}><a className="res" href={`#hotel-${h.id}`}>
        <div className="th">{h.coverThumbUrl ? <img src={h.coverThumbUrl} alt="" /> : <Icon id="i-building" />}</div>
        <div><h3>{h.name}</h3><p className="sub">{h.type} · {h.area}, {h.city}, {h.country}</p>
          <p className="meta">{h.photoCount ? <><b>{plural(h.photoCount, 'guest photo')}</b><span className="muted">latest stay {fmtMonthShort(h.latestStay!)}</span></> : <span className="none">No guest photos yet</span>}</p></div>
        <span className="go"><Icon id="i-chev-r" /></span></a></li>))}</ul>
  );
}

export default function Search() {
  const qs = useQueryState();
  const q = qs.get();
  const [r, setR] = useState<SearchResult | null>(null);
  useFocusHeading(r);
  useEffect(() => { setR(null); api.search(q).then(setR).catch(() => setR({ q, mode: 'none', hotels: [], near: [], openDirectly: null })); }, [q]);
  const addHotel = () => { setDraft({ ...freshDraft(), newHotel: { name: q, city: '' } }); go('upload'); };
  const title = !r ? 'Searching…' : !q ? 'All hotels' : r.mode === 'city' ? `Hotels in ${r.hotels[0]?.city || q}` : r.mode === 'fuzzy' ? `Closest ${r.hotels.length === 1 ? 'match' : 'matches'} for “${q}”` : r.hotels.length ? `${plural(r.hotels.length, 'hotel')} match “${q}”` : `No hotel matches “${q}”`;
  return (
    <div className="wrap">
      <div style={{ paddingTop: 16 }}><SearchBox initial={q} /></div>
      <div className="results-head"><h1>{title}</h1>{r && r.hotels.length > 1 && <span className="muted small">Hotels with photos first</span>}</div>
      {!r ? <p className="loading-line">Looking up hotels…</p> : r.hotels.length ? <List hotels={r.hotels} /> : (
        <>
          <div className="empty"><Icon id="i-search" /><h3>We couldn’t find that hotel</h3><p>Check the spelling, or try the city name. Word order and accents don’t matter.</p>
            {!r.near.length && <p className="small muted">Not listed? <button className="inline-link" onClick={addHotel}>Add it when you share photos</button></p>}</div>
          {r.near.length > 0 && <div className="closest"><h2>Hotels that share a word with “{q}”</h2><List hotels={r.near} /><p className="hint" style={{ marginTop: 12 }}>None of these? <button className="inline-link" onClick={addHotel}>Add “{q}” when you share photos</button></p></div>}
        </>
      )}
    </div>
  );
}
