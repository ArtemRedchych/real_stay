import { useEffect, useState } from 'react';
import { api, type HotelView } from '../api';
import SearchBox from '../components/SearchBox';
import { Icon, TrustTag, fmtMonthShort, go, plural, useFocusHeading, useQueryState } from '../ui';

export default function Home() {
  const [featured, setFeatured] = useState<HotelView[] | null>(null);
  const qs = useQueryState();
  useFocusHeading('home');
  useEffect(() => { api.search('').then((r) => setFeatured(r.hotels.filter((h) => h.photoCount).sort((a, b) => (b.latestUploadAt || '').localeCompare(a.latestUploadAt || '')).slice(0, 4))).catch(() => setFeatured([])); }, []);
  const tryQ = (q: string) => { qs.set(q); api.search(q).then((r) => go(r.openDirectly ? `hotel-${r.openDirectly}` : 'search')).catch(() => go('search')); };
  return (
    <>
      <section className="hero wrap">
        <h1>See what your hotel room really looks like.</h1>
        <p className="lede">Explore recent room photos shared by travelers who stayed there.</p>
        <SearchBox />
        <div className="hero-foot"><span>No account needed to browse.</span><span>Try: <button type="button" onClick={() => tryQ('Hotel Marlow')}>Hotel Marlow</button> or <button type="button" onClick={() => tryQ('Lisbon')}>Lisbon</button></span></div>
      </section>
      <section className="section wrap">
        <div className="section-head"><h2>Recent guest photos</h2><span className="muted small">Hotels with the newest contributions</span></div>
        {featured === null ? <div className="hgrid">{[0, 1, 2, 3].map((i) => <div key={i}><div className="skel skel-ph" /><div className="skel skel-line" /><div className="skel skel-line short" /></div>)}</div>
          : <div className="hgrid">{featured.map((h) => (
            <a className="hcard" href={`#hotel-${h.id}`} key={h.id}>
              <div className="ph">{h.coverThumbUrl && <img src={h.coverThumbUrl} alt={`Most recent guest photo of ${h.name}`} />}{h.coverTrust && <TrustTag kind={h.coverTrust} />}</div>
              <h3>{h.name}</h3><p className="sub">{h.area}, {h.city}</p>
              <p className="meta"><b>{plural(h.photoCount, 'guest photo')}</b><span className="dot"> · </span><span>latest stay {fmtMonthShort(h.latestStay!)}</span></p>
            </a>))}</div>}
      </section>
      <section className="section wrap">
        <div className="section-head"><h2>How RealStay works</h2></div>
        <div className="how">
          <div className="step"><span className="num"><Icon id="i-search" /></span><div><h3>Find your hotel</h3><p>Search by name or city. No account, no booking.</p></div></div>
          <div className="step"><span className="num"><Icon id="i-eye" /></span><div><h3>See what guests saw</h3><p>Photos from real stays, most recent stay first, by room type. Each one says how it was checked.</p></div></div>
          <div className="step"><span className="num"><Icon id="i-camera" /></span><div><h3>Add your own</h3><p>After a stay, share up to three photos. You sign in only at the last step.</p></div></div>
        </div>
      </section>
      <section className="section wrap"><div className="cta-band">
        <div><h2>Stayed somewhere recently?</h2><p>Three photos of your room help the next traveler know what to expect. It takes about a minute.</p></div>
        <a className="btn btn-secondary btn-lg" href="#upload"><Icon id="i-camera" />Share your photos</a>
      </div></section>
    </>
  );
}
