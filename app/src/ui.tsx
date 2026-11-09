import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

export const Icon = ({ id, cls }: { id: string; cls?: string }) => (
  <svg className={`ic${cls ? ' ' + cls : ''}`} aria-hidden="true"><use href={`#${id}`} /></svg>
);

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const months = MONTHS;
export function fmtMonth(ym: string) { const [y, m] = ym.split('-').map(Number); return `${MONTHS[m - 1]} ${y}`; }
export function fmtMonthShort(ym: string) { const [y, m] = ym.split('-').map(Number); return `${MON[m - 1]} ${y}`; }
export function fmtDate(iso: string) { const d = new Date(iso); return `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`; }
export function plural(n: number, one: string, many?: string) { return `${n} ${n === 1 ? one : many || one + 's'}`; }
export function go(hash: string) { if (location.hash !== '#' + hash) location.hash = hash; else window.dispatchEvent(new HashChangeEvent('hashchange')); }

export const TrustTag = ({ kind, extra }: { kind: 'community' | 'location'; extra?: string }) => (
  <span className={`trust ${kind === 'location' ? 'trust-location' : 'trust-community'}${extra ? ' ' + extra : ''}`}>
    <Icon id={kind === 'location' ? 'i-pin' : 'i-camera'} />{kind === 'location' ? 'Location checked' : 'Community photo'}
  </span>
);

/* ---------- toasts ---------- */
type Toast = { msg: string; danger?: boolean } | null;
const ToastCtx = createContext<(msg: string, danger?: boolean) => void>(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [t, setT] = useState<Toast>(null);
  const timer = useRef<number | undefined>(undefined);
  const show = useCallback((msg: string, danger?: boolean) => { setT({ msg, danger }); window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setT(null), 3400); }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div id="toasts" role="status" aria-live="polite">{t && <div className={`toast${t.danger ? ' is-danger' : ''}`}><Icon id={t.danger ? 'i-alert' : 'i-check'} /><span>{t.msg}</span></div>}</div>
    </ToastCtx.Provider>
  );
}

/* ---------- hash route ---------- */
export function useHash(): string {
  const [h, setH] = useState(() => (location.hash || '#').slice(1));
  useEffect(() => { const on = () => setH((location.hash || '#').slice(1)); window.addEventListener('hashchange', on); return () => window.removeEventListener('hashchange', on); }, []);
  return h;
}

/* ---------- focus the page heading on navigation ---------- */
export function useFocusHeading(dep: unknown) {
  useEffect(() => { window.scrollTo(0, 0); const h1 = document.querySelector<HTMLElement>('main h1'); if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); } }, [dep]);
}

/* ---------- auth state (localStorage) ---------- */
export interface Session { token: string; account: { id: string; name: string; isModerator: boolean } }
export function readSession(): Session | null { try { const s = localStorage.getItem('rs-session'); return s ? JSON.parse(s) : null; } catch { return null; } }
export function writeSession(s: Session | null) { try { if (s) localStorage.setItem('rs-session', JSON.stringify(s)); else localStorage.removeItem('rs-session'); } catch { /* storage unavailable */ } window.dispatchEvent(new Event('rs-session')); }
export function useSession(): Session | null {
  const [s, setS] = useState<Session | null>(readSession);
  useEffect(() => { const on = () => setS(readSession()); window.addEventListener('rs-session', on); return () => window.removeEventListener('rs-session', on); }, []);
  return s;
}

/* ---------- focus trap for dialogs ---------- */
export function trapTab(e: React.KeyboardEvent, root: HTMLElement | null) {
  if (e.key !== 'Tab' || !root) return;
  const f = [...root.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea, summary, [tabindex]:not([tabindex="-1"])')];
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && (document.activeElement === first || !root.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

export function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => { const t = window.setTimeout(() => setV(value), ms); return () => window.clearTimeout(t); }, [value, ms]);
  return v;
}

export const useQueryState = () => useMemo(() => ({
  get: () => { try { return sessionStorage.getItem('rs-q') || ''; } catch { return ''; } },
  set: (q: string) => { try { sessionStorage.setItem('rs-q', q); } catch { /* storage unavailable */ } window.dispatchEvent(new Event('rs-query')); },
}), []);
/** The current search query, updated when any search box sets it (clear, submit, suggestion). */
export function useQuery(): string {
  const qs = useQueryState();
  const [q, setQ] = useState(qs.get);
  useEffect(() => { const on = () => setQ(qs.get()); window.addEventListener('rs-query', on); return () => window.removeEventListener('rs-query', on); }, [qs]);
  return q;
}
