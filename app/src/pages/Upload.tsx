import { useEffect, useRef, useState } from 'react';
import { api, type HotelView } from '../api';
import { Icon, go, months, plural, useDebounced, useFocusHeading, useSession, useToast } from '../ui';
import { MAX_PHOTOS, addFiles, setDraft, toFormData, useDraft, validate, type Draft } from '../draft';

function placeLine(h: HotelView) { return `${h.type} · ${h.area}, ${h.city}, ${h.country}`; }

/** Picks the hotel for the draft: suggestions from the API, or "add a hotel" with name and city. */
function HotelPicker({ d, err }: { d: Draft; err?: string }) {
  const [items, setItems] = useState<HotelView[]>([]);
  const dq = useDebounced(d.hotelQ, 180);
  useEffect(() => { let live = true; if (dq.trim().length < 2) { setItems([]); return; } api.search(dq).then((r) => { if (live) setItems(r.hotels.slice(0, 5)); }).catch(() => setItems([])); return () => { live = false; }; }, [dq]);
  if (d.hotel) return <div className="picked">{d.hotel.coverThumbUrl ? <img src={d.hotel.coverThumbUrl} alt="" /> : <span className="ph"><Icon id="i-building" /></span>}<div className="t"><b>{d.hotel.name}</b><span>{placeLine(d.hotel)}</span></div><button className="btn btn-secondary btn-sm" onClick={() => setDraft({ hotel: null, newHotel: null, roomType: null, hotelQ: '' })}>Change</button></div>;
  if (d.newHotel) return (
    <>
      <div className="picked"><span className="ph"><Icon id="i-plus" /></span><div className="t"><b>{d.newHotel.name || 'New hotel'}</b><span>{d.newHotel.city || 'City not set'} · will be added after review</span></div><button className="btn btn-secondary btn-sm" onClick={() => setDraft({ newHotel: null, roomType: null })}>Change</button></div>
      <div className="date-row"><div className="field"><label htmlFor="nhName">Hotel name</label><input className="input" id="nhName" value={d.newHotel.name} maxLength={80} autoComplete="off" onChange={(e) => setDraft({ newHotel: { name: e.target.value, city: d.newHotel!.city } })} /></div><div className="field"><label htmlFor="nhCity">City</label><input className="input" id="nhCity" value={d.newHotel.city} maxLength={60} autoComplete="off" onChange={(e) => setDraft({ newHotel: { name: d.newHotel!.name, city: e.target.value } })} /></div></div>
    </>
  );
  return (
    <div className="field"><label htmlFor="uq">Hotel name or city</label>
      <div className="searchbox"><div className="input-wrap"><Icon id="i-search" cls="ic-lead" /><input className="input" id="uq" type="search" value={d.hotelQ} maxLength={100} placeholder="Start typing, e.g. Marlow" autoComplete="off" aria-invalid={err ? true : undefined} aria-describedby={err ? 'err-hotel' : undefined} onChange={(e) => setDraft({ hotelQ: e.target.value })} /></div>
        <div className="suggest-host">{d.hotelQ.trim().length >= 2 && (
          <div className="suggest"><ul>
            {items.length === 0 && <li><div className="s-sub">No hotel called “{d.hotelQ}”. <button className="inline-link" onClick={() => setDraft({ newHotel: { name: d.hotelQ, city: '' } })}>Add it</button></div></li>}
            {items.map((h) => <li key={h.id}><button type="button" onClick={() => setDraft({ hotel: h, hotelQ: '', roomType: null })}><Icon id="i-building" /><span><span className="s-main">{h.name}</span><br /><span className="s-sub">{placeLine(h)}</span></span></button></li>)}
          </ul></div>)}</div>
      </div>
      <p className="hint">Not listed? <button className="inline-link" onClick={() => setDraft({ newHotel: { name: d.hotelQ, city: '' } })}>Add a hotel</button></p>
    </div>
  );
}

export default function Upload() {
  const d = useDraft();
  const session = useSession();
  const toast = useToast();
  const errs = d.attempted ? validate(d) : {};
  const cats = d.hotel ? [...d.hotel.roomTypes.map((r) => r.name), 'Not sure'] : d.newHotel ? ['Standard room', 'Superior room', 'Suite', 'Family room', 'Not sure'] : [];
  const years = [2026, 2025, 2024, 2023];
  const drop = useRef<HTMLDivElement>(null);
  useFocusHeading('upload');
  useEffect(() => { if (d.welcomeBack) { const t = window.setTimeout(() => setDraft({ welcomeBack: false }), 6000); return () => window.clearTimeout(t); } }, [d.welcomeBack]);

  const checkLocation = () => {
    if (!navigator.geolocation) { setDraft({ loc: 'unavailable', ctxOpen: true }); return; }
    setDraft({ loc: 'checking', ctxOpen: true });
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      if (!d.hotel) { setDraft({ loc: 'unavailable', coords }); return; }
      try { const r = await api.locationPreview(d.hotel.id, coords.lat, coords.lng); setDraft({ loc: r.result === 'near' ? 'near' : r.result === 'far' ? 'far' : 'unavailable', coords }); }
      catch { setDraft({ loc: 'unavailable', coords }); }
    }, () => setDraft({ loc: 'declined' }), { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
  };

  const submit = async () => {
    setDraft({ attempted: true, submitError: null });
    const e = validate(d);
    if (Object.keys(e).length) { requestAnimationFrame(() => document.querySelector('.valid-summary')?.scrollIntoView({ block: 'start', behavior: 'smooth' })); return; }
    if (!session) { go('signin'); return; }
    await submitDraft(session.token, toast);
  };

  const err = (k: string) => errs[k] ? <p className="error" id={`err-${k}`}><Icon id="i-alert" />{errs[k]}</p> : null;
  const stepCls = (k: string) => `step-card${errs[k] ? ' has-error' : ''}`;
  const name = d.hotel ? d.hotel.name : 'the hotel';
  const locBlock = () => {
    if (d.loc === 'checking') return <p className="row" aria-live="polite"><span className="spin" aria-hidden="true" />Checking your location…</p>;
    if (d.loc === 'near') return <div className="notice notice-ok"><Icon id="i-pin" /><p>Your device is near {name}. These photos will show <b>Location checked</b>.</p></div>;
    if (d.loc === 'far') return <div className="notice"><Icon id="i-info" /><div><p>You don’t seem to be near {name} right now. No problem: you can still submit, and the photos will show as <b>Community photo</b>.</p></div></div>;
    if (d.loc === 'declined') return <div className="notice notice-warn"><Icon id="i-alert" /><div><p>Location permission was declined, so we couldn’t check. You can still submit; the photos will show as <b>Community photo</b>.</p><p><button className="inline-link" onClick={checkLocation}>Try again</button></p></div></div>;
    if (d.loc === 'unavailable') return <div className="notice"><Icon id="i-info" /><div><p>We couldn’t run the check here{d.hotel ? '' : ' (pick the hotel first)'}. The photos will show as <b>Community photo</b>.</p></div></div>;
    return <div><button className="btn btn-secondary" onClick={checkLocation} disabled={!d.hotel}><Icon id="i-pin" />Check my location now</button></div>;
  };

  return (
    <div className="wrap wrap-narrow">
      <a className="crumb" href={d.hotel ? `#hotel-${d.hotel.id}` : '#home'}><Icon id="i-arrow-l" />{d.hotel ? `Back to ${d.hotel.name}` : 'Back'}</a>
      <div className="upload-head"><h1>Share your photos</h1><p>Up to three photos of your room. It takes about a minute, and you sign in only at the end.</p></div>
      <div className="stack">
        {d.welcomeBack && <div className="notice notice-ok"><Icon id="i-check" /><p>Welcome back{session ? `, ${session.account.name.split(' ')[0]}` : ''}. Your draft was kept exactly as you left it.</p></div>}
        {d.submitError && <div className="notice notice-danger" role="alert"><Icon id="i-alert" /><div><p><b>The upload didn’t go through.</b> {d.submitError}</p><p><button className="inline-link" onClick={submit}>Try again</button></p></div></div>}
        {d.attempted && Object.keys(errs).length > 0 && <div className="notice notice-danger valid-summary" role="alert"><Icon id="i-alert" /><div><p><b>Before you continue, {Object.keys(errs).length === 1 ? 'one thing is' : `${Object.keys(errs).length} things are`} missing:</b></p><ul>{Object.entries(errs).map(([k, v]) => <li key={k}><a href={`#step-${k}`} onClick={(e) => { e.preventDefault(); const s = document.getElementById(`step-${k}`); s?.scrollIntoView({ block: 'start', behavior: 'smooth' }); (s?.querySelector('input, select, button.chip, .btn') as HTMLElement | null)?.focus({ preventScroll: true }); }}>{v}</a></li>)}</ul></div></div>}
        <div className="steps">
          <section className={stepCls('hotel')} id="step-hotel" aria-labelledby="st1">
            <header><span className="n" aria-hidden="true">1</span><h2 id="st1">Which hotel?</h2></header>
            <HotelPicker d={d} err={errs.hotel} />{err('hotel')}
          </section>
          <section className={stepCls('cat')} id="step-cat" aria-labelledby="st2">
            <header><span className="n" aria-hidden="true">2</span><h2 id="st2">Which room type?</h2></header>
            {cats.length ? <><div className="chips" role="radiogroup" aria-label="Room type">{cats.map((c) => <button key={c} type="button" role="radio" className="chip" aria-checked={d.roomType === c} onClick={() => setDraft({ roomType: c })}>{c}</button>)}</div><p className="hint">Use the name from your booking if you can. “Not sure” is fine.</p></> : <p className="hint">Pick the hotel first.</p>}
            {err('cat')}
          </section>
          <section className={stepCls('files')} id="step-files" aria-labelledby="st3">
            <header><span className="n" aria-hidden="true">3</span><h2 id="st3">Your photos</h2><span className="opt tnum">{d.files.length} of {MAX_PHOTOS}</span></header>
            {d.files.length > 0 && <div className="thumbs">{d.files.map((f) => <div className="thumb" key={f.id}><img src={f.url} alt={`Preview of ${f.name}`} /><span className="fname">{f.name}</span><button type="button" className="rm" aria-label={`Remove ${f.name}`} onClick={() => { URL.revokeObjectURL(f.url); setDraft((cur) => ({ files: cur.files.filter((x) => x.id !== f.id) })); }}><Icon id="i-x" cls="ic-sm" /></button></div>)}</div>}
            {d.fileErrors.length > 0 && <div className="file-errors" role="alert">{d.fileErrors.map((e, i) => <p className="error" key={i}><Icon id="i-alert" /><span><b>{e.name}</b> {e.msg}</span><button type="button" aria-label="Dismiss" onClick={() => setDraft((cur) => ({ fileErrors: cur.fileErrors.filter((_, k) => k !== i) }))}>OK</button></p>)}</div>}
            {d.files.length < MAX_PHOTOS ? (
              <div className="dropzone" id="dropzone" ref={drop} onDragOver={(e) => { e.preventDefault(); drop.current?.classList.add('is-over'); }} onDragLeave={() => drop.current?.classList.remove('is-over')} onDrop={(e) => { e.preventDefault(); drop.current?.classList.remove('is-over'); if (e.dataTransfer?.files) addFiles(e.dataTransfer.files); }}>
                <Icon id="i-upload" />
                <p className="drop-desktop">Drag photos here, or</p>
                <div className="btns">
                  <label className="btn btn-secondary drop-mobile"><Icon id="i-camera" />Take a photo<input type="file" className="sr-only" accept="image/*" capture="environment" aria-describedby="limits" onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }} /></label>
                  <label className="btn btn-secondary drop-mobile"><Icon id="i-image" />Choose from library<input type="file" className="sr-only" accept="image/*" multiple aria-describedby="limits" onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }} /></label>
                  <label className="btn btn-secondary drop-desktop"><Icon id="i-image" />Choose photos<input type="file" className="sr-only" accept="image/*" multiple aria-describedby="limits" onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }} /></label>
                </div>
                <p className="limits" id="limits"><span>{d.files.length ? `${MAX_PHOTOS - d.files.length} more` : `1 to ${MAX_PHOTOS} photos`}</span><span>JPG, PNG or HEIC</span><span>up to 15 MB each</span></p>
              </div>
            ) : <p className="hint">That’s the maximum of three. Remove one to swap it.</p>}
            {err('files')}
          </section>
          <section className={stepCls('date')} id="step-date" aria-labelledby="st4">
            <header><span className="n" aria-hidden="true">4</span><h2 id="st4">When did you stay?</h2></header>
            <div className="date-row">
              <div className="field"><label htmlFor="upMonth">Month</label><select className="input" id="upMonth" value={d.month} aria-invalid={errs.date ? true : undefined} onChange={(e) => setDraft({ month: e.target.value })}><option value="">Month</option>{months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></div>
              <div className="field"><label htmlFor="upYear">Year</label><select className="input" id="upYear" value={d.year} aria-invalid={errs.date ? true : undefined} onChange={(e) => setDraft({ year: e.target.value })}><option value="">Year</option>{years.map((y) => <option key={y} value={y}>{y}</option>)}</select></div>
            </div>
            <p className="hint">Roughly is fine. We show the month, never the exact dates.</p>
            {err('date')}
          </section>
          <section className="step-card" id="step-ctx" aria-labelledby="st5">
            <header><span className="n" aria-hidden="true">5</span><h2 id="st5">Add context</h2><span className="opt">Optional</span></header>
            <details className="disclosure" open={d.ctxOpen} onToggle={(e) => setDraft({ ctxOpen: (e.target as HTMLDetailsElement).open })}>
              <summary><Icon id="i-pin" />Location check, a note, how your name appears<Icon id="i-chev-d" /></summary>
              <div className="body">
                <div className="loc-box"><div><p><b>Location check</b></p><p className="hint">If you’re at the hotel right now, we can confirm your device is nearby. We keep only “near” or “not near”, never your position. It doesn’t prove where the photo was taken, which is why such photos are labeled “Location checked”, not “verified”.</p></div>{locBlock()}</div>
                <div className="field"><label htmlFor="upNote">Note for future guests</label><textarea className="input" id="upNote" maxLength={140} placeholder="e.g. Room 412, 5th floor, taken from the door" value={d.note} onChange={(e) => setDraft({ note: e.target.value })} /><p className="hint tnum">{d.note.length} / 140</p></div>
                <div className="field"><span className="legend" id="dispLegend">Show your name as</span><div className="seg-radio" role="radiogroup" aria-labelledby="dispLegend"><label><input type="radio" name="disp" value="name" checked={d.display === 'name'} onChange={() => setDraft({ display: 'name' })} />First name and initial</label><label><input type="radio" name="disp" value="anon" checked={d.display === 'anonymous'} onChange={() => setDraft({ display: 'anonymous' })} />Anonymous</label></div></div>
              </div>
            </details>
          </section>
        </div>
      </div>
      <div className="submitbar">
        <p className="hint">{session ? `Signed in as ${session.account.name}.` : 'Next: sign in. That submits your photos.'}</p>
        <button className="btn btn-primary btn-lg" onClick={submit} aria-disabled={d.submitting || undefined}>{d.submitting ? <><span className="spin" aria-hidden="true" />Uploading…</> : session ? `Submit ${d.files.length ? plural(d.files.length, 'photo') : 'photos'}` : 'Sign in and submit'}</button>
      </div>
    </div>
  );
}

/** Creates the upload, runs the location check if the contributor allowed it, then opens the confirmation. */
export async function submitDraft(token: string, toast: (m: string, danger?: boolean) => void): Promise<boolean> {
  const d = (await import('../draft')).getDraft();
  setDraft({ submitting: true, submitError: null });
  try {
    const r = await api.createUpload(toFormData(d), token);
    if (d.coords && d.hotel) { try { await api.locationCheck(r.id, d.coords.lat, d.coords.lng, token); } catch { /* the label simply stays "Community photo" */ } }
    setDraft({ submitting: false });
    toast(`${plural(d.files.length, 'photo')} submitted for review`);
    go(`submitted-${r.id}`);
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Please check your connection and try again.';
    setDraft({ submitting: false, submitError: msg });
    go('upload');
    return false;
  }
}
