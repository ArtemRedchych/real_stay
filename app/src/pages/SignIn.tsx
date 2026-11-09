import { useState } from 'react';
import { api } from '../api';
import { Icon, fmtMonth, plural, useFocusHeading, useToast, writeSession } from '../ui';
import { useDraft, validate, setDraft } from '../draft';
import { submitDraft } from './Upload';

/**
 * Sign-in is the last step of contributing and, for a complete draft, it is the submit.
 * The provider here is the development one (a name becomes an account). Google via Firebase Auth
 * would replace the form with a "Continue with Google" button and send the ID token to the API instead.
 */
export default function SignIn() {
  const d = useDraft();
  const toast = useToast();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useFocusHeading('signin');
  const n = d.files.length;
  const ready = n > 0 && !Object.keys(validate(d)).length;
  const stay = d.month && d.year ? fmtMonth(`${d.year}-${String(d.month).padStart(2, '0')}`) : '';
  const hotelName = d.hotel ? d.hotel.name : d.newHotel?.name || '';

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null);
    if (name.trim().length < 2) { setErr('Enter your name (at least two characters).'); return; }
    setBusy(true);
    try {
      const r = await api.devSignIn(name.trim());
      writeSession({ token: r.token, account: r.account });
      if (ready) { await submitDraft(r.token, toast); }
      else { setDraft({ welcomeBack: true }); toast(`Signed in as ${r.account.name}`); location.hash = 'upload'; }
    } catch (ex) { setErr(ex instanceof Error ? ex.message : 'Sign-in failed. Try again.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="wrap"><div className="auth-wrap">
      <a className="crumb" href="#upload"><Icon id="i-arrow-l" />Back to your photos</a>
      <div><h1>Sign in to submit</h1><p className="muted" style={{ marginTop: 8 }}>{ready ? `Signing in submits ${n === 1 ? 'this photo' : `these ${n} photos`} for review. Nothing else happens, and you can edit them first.` : 'Your draft is kept on this device. After signing in you can finish it.'}</p></div>
      {n > 0 && <div className="sub-summary"><div className="thumbs-mini">{d.files.map((f) => <img key={f.id} src={f.url} alt="" />)}</div><span className="muted small">{hotelName}{d.roomType ? ` · ${d.roomType === 'Not sure' ? 'Room type not specified' : d.roomType}` : ''}{stay ? ` · stay ${stay}` : ''}</span></div>}
      <form className="auth-form" onSubmit={signIn}>
        <div className="field"><label htmlFor="signName">Your name</label><input className="input" id="signName" value={name} autoComplete="name" placeholder="e.g. Alex Rivera" onChange={(e) => setName(e.target.value)} aria-invalid={err ? true : undefined} aria-describedby={err ? 'signErr' : undefined} /></div>
        {err && <p className="error" id="signErr"><Icon id="i-alert" />{err}</p>}
        <button className="btn btn-primary btn-lg btn-block" type="submit" aria-disabled={busy || undefined}>{busy ? <><span className="spin" aria-hidden="true" />{ready ? 'Signing in and submitting…' : 'Signing in…'}</> : ready ? `Sign in and submit ${plural(n, 'photo')}` : 'Sign in'}</button>
        <p className="dev-note"><Icon id="i-info" /><span>Prototype sign-in: a name is enough. The production build replaces this form with Google and Apple sign-in behind the same API; nothing else in the flow changes.</span></p>
      </form>
      <div className="why"><p><b>Why sign in?</b></p><ul>
        <li><Icon id="i-lock" /><span>Every photo is tied to an account so we can act on misuse. That is the only reason we ask.</span></li>
        <li><Icon id="i-eye" /><span>We never post anywhere on your behalf, and there is no profile to fill in.</span></li>
        <li><Icon id="i-user" /><span>You choose whether your first name is shown or you stay anonymous.</span></li>
        <li><Icon id="i-search" /><span>Browsing RealStay never needs an account.</span></li>
      </ul></div>
    </div></div>
  );
}
