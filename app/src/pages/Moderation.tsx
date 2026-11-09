import { useEffect, useState } from 'react';
import { api, ApiError, type QueueItem } from '../api';
import { Icon, fmtMonth, plural, useFocusHeading, useSession, useToast, writeSession } from '../ui';

const REJECT = ['Not a hotel room', 'People are identifiable', 'Personal information is visible', 'Professional or marketing image', 'Duplicate of an existing photo', 'Offensive content', 'Other'];
const CORRECT = ['Wrong room type', 'Wrong hotel', 'Too dark or blurry to be useful', 'Stay date looks wrong'];

export default function Moderation() {
  const session = useSession();
  const toast = useToast();
  const [queue, setQueue] = useState<QueueItem[] | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [mode, setMode] = useState<'reject' | 'correct' | null>(null);
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState('');
  const [zoom, setZoom] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [err, setErr] = useState<string | null>(null);
  useFocusHeading('moderation');
  const isMod = !!session?.account.isModerator;

  const load = () => { if (!isMod || !session) return; api.queue(session.token).then((q) => { setQueue(q); setSel((s) => (s && q.some((x) => x.id === s) ? s : q[0]?.id || null)); }).catch((e) => { setQueue([]); if (e instanceof ApiError && e.status === 403) writeSession(null); }); };
  useEffect(load, [isMod, session?.token]);

  if (!isMod) return (
    <div className="wrap mod"><div className="mod-head"><div><span className="eyebrow">Internal</span><h1>Moderation queue</h1></div></div>
      <form className="mod-login card card-pad" onSubmit={async (e) => { e.preventDefault(); setErr(null); try { const r = await api.devSignIn(name.trim(), true); writeSession({ token: r.token, account: r.account }); } catch (ex) { setErr(ex instanceof Error ? ex.message : 'Sign-in failed'); } }}>
        <p>Moderators sign in with their work account. In this prototype a name is enough; the moderator flag is granted by the development sign-in.</p>
        <div className="field"><label htmlFor="modName">Your name</label><input className="input" id="modName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sam Moderator" /></div>
        {err && <p className="error"><Icon id="i-alert" />{err}</p>}
        <button className="btn btn-primary" type="submit">Open the queue</button>
      </form></div>
  );

  const cur = queue?.find((x) => x.id === sel) || null;
  const act = async (action: 'approve' | 'reject' | 'request-correction', body: { reason?: string; message?: string } = {}) => {
    if (!cur || !session) return;
    try {
      await api.decide(cur.id, action, body, session.token);
      toast(`${action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Correction requested'} · ${cur.hotelName} · contributor notified`);
    } catch (e) { toast(e instanceof Error ? e.message : 'That didn’t work', true); }
    setMode(null); setReason(''); setMsg(''); load();
  };
  const sig = (s: QueueItem['signals'][number]) => <li key={s.kind} className={`sig-${s.level}`}><Icon id={s.kind === 'location' ? 'i-pin' : s.kind === 'capture' ? 'i-camera' : 'i-user'} /><span>{s.text}</span></li>;
  const reasons = mode === 'reject' ? REJECT : CORRECT;

  return (
    <div className="wrap mod">
      <div className="mod-head"><div><span className="eyebrow">Internal · {session!.account.name}</span><h1>Moderation queue</h1></div><span className={`status ${queue?.length ? 'status-pending' : 'status-ok'}`}>{queue === null ? 'Loading…' : queue.length ? `${queue.length} pending` : 'Nothing pending'}</span></div>
      <div className="mod-grid">
        <ul className="mod-list" aria-label="Pending submissions">{(queue || []).map((x) => <li key={x.id}><button type="button" className="mod-item" aria-current={x.id === cur?.id} onClick={() => { setSel(x.id); setMode(null); }}><img src={x.photos[0].thumbUrl} alt="" /><span><b>{x.hotelName}</b><span>{x.roomType} · {plural(x.photos.length, 'photo')}</span></span><span className="when">{ago(x.uploadedAt)}</span></button></li>)}</ul>
        {!cur ? <div className="empty"><Icon id="i-check" /><h3>All caught up</h3><p>No pending submissions. New ones appear here as they come in.</p></div> : (
          <div className="mod-detail card card-pad">
            <div><h2 style={{ fontSize: '1.25rem' }}>{cur.hotelName}{cur.hotelPending && <span className="status status-pending" style={{ marginLeft: 10 }}>New hotel</span>}</h2><p className="muted small">{cur.roomType} · {plural(cur.photos.length, 'photo')} · submitted {ago(cur.uploadedAt)}</p></div>
            <div className="mod-photos">{cur.photos.map((p, i) => <button type="button" key={p.id} aria-label={`Photo ${i + 1}, open larger`} onClick={() => setZoom(p.url)}><img src={p.thumbUrl} alt="" /></button>)}</div>
            <dl className="kv">
              <dt>Hotel</dt><dd>{cur.hotelName} · {cur.hotelPlace}</dd>
              <dt>Room type</dt><dd>{cur.roomType}</dd>
              <dt>Stay</dt><dd>{fmtMonth(cur.stayMonth)} <span className="muted">· reported</span></dd>
              <dt>Uploaded</dt><dd>{new Date(cur.uploadedAt).toLocaleString()}</dd>
              <dt>Contributor</dt><dd>{cur.contributorName} <span className="muted">· account {cur.account.ageDays} days old · {cur.account.approved} approved · {cur.account.rejected} rejected</span></dd>
              <dt>Shown as</dt><dd>{cur.contributor.display}</dd>
              {cur.note && <><dt>Note</dt><dd>“{cur.note}”</dd></>}
            </dl>
            <div><h3 style={{ fontSize: '1rem', marginBottom: 8 }}>Signals</h3><ul className="signals">{cur.signals.map(sig)}</ul></div>
            {mode ? (
              <div className="mod-reason" role="group" aria-labelledby="rsnT">
                <p id="rsnT"><b>{mode === 'reject' ? 'Reject this submission' : 'Request a correction'}</b></p>
                <div className="field"><label htmlFor="rsn">Reason</label><select className="input" id="rsn" value={reason} onChange={(e) => setReason(e.target.value)} autoFocus><option value="">Choose a reason</option>{reasons.map((r) => <option key={r}>{r}</option>)}</select></div>
                <div className="field"><label htmlFor="rsnMsg">Message to the contributor <span className="muted">(optional)</span></label><textarea className="input" id="rsnMsg" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={mode === 'reject' ? 'e.g. Photo 2 shows a person’s face.' : 'e.g. These look like a Superior King. Could you check your booking?'} /></div>
                <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn btn-secondary" onClick={() => setMode(null)}>Cancel</button><button className={`btn ${mode === 'reject' ? 'btn-danger' : 'btn-primary'}`} disabled={!reason} onClick={() => act(mode === 'reject' ? 'reject' : 'request-correction', { reason, message: msg })}>{mode === 'reject' ? 'Reject and notify' : 'Send request'}</button></div>
              </div>
            ) : <div className="mod-actions"><button className="btn btn-primary" onClick={() => act('approve')}><Icon id="i-check" />Approve</button><button className="btn btn-secondary" onClick={() => { setMode('correct'); setReason(''); }}>Request correction</button><button className="btn btn-danger" onClick={() => { setMode('reject'); setReason(''); }}>Reject</button></div>}
          </div>
        )}
      </div>
      {zoom && <div className="layer viewer" role="dialog" aria-modal="true" aria-label="Photo preview" onClick={(e) => { if (e.target === e.currentTarget) setZoom(null); }} onKeyDown={(e) => { if (e.key === 'Escape') setZoom(null); }}><div className="viewer-top"><button className="btn btn-icon btn-light" autoFocus onClick={() => setZoom(null)} aria-label="Close preview"><Icon id="i-x" /></button></div><div className="viewer-stage"><div className="viewer-img-wrap"><img src={zoom} alt="Submitted photo, larger" /></div></div><div /></div>}
    </div>
  );
}

function ago(iso: string) {
  const d = Math.round((Date.now() - new Date(iso).getTime()) / 3600000);
  if (d < 1) return 'just now'; if (d < 24) return `${d} h ago`; const days = Math.round(d / 24); return days === 1 ? 'yesterday' : `${days} days ago`;
}
