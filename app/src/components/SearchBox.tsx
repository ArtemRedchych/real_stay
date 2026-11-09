import { useEffect, useId, useRef, useState } from 'react';
import { api, type HotelView } from '../api';
import { Icon, fmtMonthShort, go, plural, useDebounced, useQueryState } from '../ui';

type Item = { kind: 'city'; label: string; q: string; count: number } | { kind: 'hotel'; hotel: HotelView };

function placeLine(h: HotelView) { return `${h.type} · ${h.area}, ${h.city}`; }

/** Hero and results search: combobox with suggestions from the API; Enter opens one unambiguous hotel directly. */
export default function SearchBox({ initial = '', big = true }: { initial?: string; big?: boolean }) {
  const [q, setQ] = useState(initial);
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(-1);
  const [items, setItems] = useState<Item[]>([]);
  const dq = useDebounced(q, 180);
  const id = useId();
  const qs = useQueryState();
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let live = true;
    if (dq.trim().length < 2) { setItems([]); return; }
    api.search(dq).then((r) => {
      if (!live) return;
      const n = dq.trim().toLowerCase();
      const cities = new Map<string, number>();
      const src = r.mode === 'none' ? r.near : r.hotels;
      src.forEach((h) => { const key = `${h.city}, ${h.country}`; if (h.city.toLowerCase().startsWith(n) || h.country.toLowerCase().startsWith(n)) cities.set(key, (cities.get(key) || 0) + 1); });
      const list: Item[] = [...cities.entries()].map(([label, count]) => ({ kind: 'city' as const, label, q: label.split(',')[0], count }));
      if (r.mode !== 'none') src.forEach((h) => list.push({ kind: 'hotel', hotel: h }));
      setItems(list.slice(0, 6));
    }).catch(() => setItems([]));
    return () => { live = false; };
  }, [dq]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('click', onDoc); return () => document.removeEventListener('click', onDoc);
  }, []);

  const submit = async (value: string) => {
    const v = value.trim(); qs.set(v); setOpen(false); setIdx(-1);
    if (!v) { go('search'); return; }
    try { const r = await api.search(v); if (r.openDirectly) { go(`hotel-${r.openDirectly}`); return; } } catch { /* fall through to the results page */ }
    go('search');
  };
  const pick = (it: Item) => { setOpen(false); setIdx(-1); if (it.kind === 'city') { qs.set(it.q); setQ(it.q); go('search'); } else { qs.set(it.hotel.name); go(`hotel-${it.hotel.id}`); } };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || !items.length) { if (e.key === 'Escape') setOpen(false); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => e.key === 'ArrowDown' ? Math.min(items.length - 1, i + 1) : Math.max(-1, i - 1)); }
    else if (e.key === 'Enter' && idx >= 0) { e.preventDefault(); pick(items[idx]); }
    else if (e.key === 'Escape') { setOpen(false); setIdx(-1); }
  };

  const showList = open && q.trim().length >= 2;
  return (
    <div className="searchbox" ref={box}>
      <form role="search" onSubmit={(e) => { e.preventDefault(); if (idx >= 0 && items[idx]) pick(items[idx]); else void submit(q); }}>
        <label className="sr-only" htmlFor={id}>Search for a hotel by name or city</label>
        <div className="input-wrap">
          <Icon id="i-search" cls="ic-lead" />
          <input className="input" id={id} name="q" type="search" placeholder="Hotel name or city" value={q} maxLength={100} autoComplete="off" role="combobox" aria-expanded={showList} aria-controls={`${id}-list`} aria-autocomplete="list" aria-activedescendant={idx >= 0 ? `${id}-opt-${idx}` : undefined}
            onChange={(e) => { setQ(e.target.value); setOpen(true); setIdx(-1); }} onFocus={() => setOpen(true)} onKeyDown={onKey} />
          {q && <button type="button" className="btn-clear" aria-label="Clear search" onClick={() => { setQ(''); setItems([]); document.getElementById(id)?.focus(); }}><Icon id="i-x" /></button>}
        </div>
        <button className={`btn btn-primary${big ? '' : ' btn-sm'}`} type="submit">Search</button>
      </form>
      <div className="suggest-host" id={`${id}-list`} role="listbox" aria-label="Suggestions">
        {showList && (
          <div className="suggest"><ul>
            {items.length === 0 && <li><div className="s-sub">No hotel matches “{q}”. Press Enter to search anyway.</div></li>}
            {items.map((it, i) => it.kind === 'city' ? (
              <li key={`c-${it.label}`} id={`${id}-opt-${i}`} role="option" aria-selected={i === idx}><button type="button" onClick={() => pick(it)}><Icon id="i-pin" /><span><span className="s-main">{it.label}</span><br /><span className="s-sub">Destination</span></span><span className="s-right">{plural(it.count, 'hotel')}</span></button></li>
            ) : (
              <li key={it.hotel.id} id={`${id}-opt-${i}`} role="option" aria-selected={i === idx}><button type="button" onClick={() => pick(it)}><Icon id="i-building" /><span><span className="s-main">{it.hotel.name}</span><br /><span className="s-sub">{placeLine(it.hotel)}</span></span><span className="s-right">{it.hotel.photoCount ? `${plural(it.hotel.photoCount, 'photo')} · latest ${fmtMonthShort(it.hotel.latestStay!)}` : 'No photos yet'}</span></button></li>
            ))}
          </ul></div>
        )}
      </div>
    </div>
  );
}
