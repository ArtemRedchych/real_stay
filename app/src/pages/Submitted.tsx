import { useEffect, useState } from 'react';
import { api, type UploadView } from '../api';
import { Icon, fmtDate, go, plural, useFocusHeading, useSession, useToast } from '../ui';
import { resetDraft, setDraft, getDraft } from '../draft';

export default function Submitted({ id }: { id: string }) {
  const session = useSession();
  const toast = useToast();
  const [u, setU] = useState<UploadView | null | undefined>(undefined);
  useFocusHeading(u?.status);
  const load = () => { if (!session) { setU(null); return; } api.myUpload(id, session.token).then(setU).catch(() => setU(null)); };
  useEffect(load, [id, session]);
  useEffect(() => { resetDraft(); }, []);

  if (u === undefined) return <div className="wrap"><p className="loading-line">Loading your submission…</p></div>;
  if (u === null) return <div className="wrap"><div className="confirm-wrap"><div><h1>We couldn’t find that submission</h1><p className="muted">It may belong to a different account on this device.</p></div><a className="btn btn-secondary" href="#home">Back to RealStay</a></div></div>;

  const n = u.photos.length;
  const hotelHref = `#hotel-${u.hotelId}`;
  const summary = <div className="sub-summary"><div className="thumbs-mini">{u.photos.map((p) => <img key={p.id} src={p.thumbUrl} alt="" />)}</div><span className="small"><b>{plural(n, 'photo')}</b> · {u.roomType === 'Not sure' ? 'Room type not specified' : u.roomType}</span></div>;
  const again = <button className="btn btn-secondary" onClick={() => { resetDraft(); go('upload'); }}>Share photos of another stay</button>;
  const fix = () => { setDraft({ ...getDraft(), welcomeBack: false }); go('upload'); };

  const body = {
    pending: <>
      <div className="okmark"><Icon id="i-check" /></div><div><h1>Your photos were received</h1><p className="muted" style={{ marginTop: 8 }}>Thanks for helping the next traveler know what to expect.</p></div>{summary}<span className="status status-pending"><Icon id="i-clock" cls="ic-sm" />Pending review</span>
      <div><p><b>What happens next</b></p><ul className="next-steps" style={{ marginTop: 10 }}>
        <li><Icon id="i-eye" /><span>A moderator checks that each photo shows a hotel room and nothing private. Usually within two days.</span></li>
        <li><Icon id="i-image" /><span>Once approved, they appear in the gallery, most recent stay first, labeled “{u.trust.label}”.</span></li>
        <li><Icon id="i-mail" /><span>We email you when they’re published, or if something needs a correction.</span></li></ul></div>
      <div className="row"><a className="btn btn-primary" href={hotelHref}>Back to the hotel</a>{again}<button className="btn btn-ghost" onClick={() => { setU(undefined); load(); }}><Icon id="i-retry" />Check status</button></div>
    </>,
    published: <>
      <div className="okmark"><Icon id="i-check" /></div><div><h1>Your photos are published</h1><p className="muted" style={{ marginTop: 8 }}>They now appear in the gallery, most recent stay first.</p></div>{summary}<span className="status status-ok"><Icon id="i-check" cls="ic-sm" />Published · {fmtDate(new Date().toISOString())}</span>
      <div className="row"><a className="btn btn-primary" href={hotelHref}>See them in the gallery</a>{again}</div>
    </>,
    correction_requested: <>
      <div className="okmark is-warn"><Icon id="i-alert" /></div><div><h1>One thing to fix</h1><p className="muted" style={{ marginTop: 8 }}>Your photos are fine; a moderator thinks one detail is off.</p></div>{summary}<span className="status status-pending"><Icon id="i-clock" cls="ic-sm" />Correction requested</span>
      <div className="notice notice-warn"><Icon id="i-info" /><div><p><b>{u.decisionReason}.</b> {u.decisionMessage ? `“${u.decisionMessage}”` : ''}</p></div></div>
      <div className="row"><button className="btn btn-primary" onClick={fix}>Submit again</button><button className="btn btn-secondary" onClick={() => toast('Sent to the moderator. They’ll take another look.')}>It’s correct as submitted</button></div>
    </>,
    rejected: <>
      <div className="okmark is-danger"><Icon id="i-x" /></div><div><h1>These photos weren’t published</h1><p className="muted" style={{ marginTop: 8 }}>Thanks for contributing. One of the photos broke a rule, so the submission was not published.</p></div>{summary}<span className="status status-danger"><Icon id="i-x" cls="ic-sm" />Not published</span>
      <div className="notice notice-danger"><Icon id="i-alert" /><div><p><b>Reason:</b> {u.decisionReason}.{u.decisionMessage ? ` “${u.decisionMessage}”` : ''}</p><p><b>What you can do:</b> fix or replace that photo and submit again.</p></div></div>
      <div className="row"><button className="btn btn-primary" onClick={() => { resetDraft(); go('upload'); }}>Submit again</button><a className="btn btn-secondary" href={hotelHref}>Back to the hotel</a></div>
    </>,
  }[u.status as 'pending' | 'published' | 'correction_requested' | 'rejected'];

  return <div className="wrap"><div className="confirm-wrap">{body}</div></div>;
}
