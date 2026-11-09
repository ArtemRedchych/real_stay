import { Icon, ToastProvider, useHash, useSession, writeSession } from './ui';
import Home from './pages/Home';
import Search from './pages/Search';
import Hotel from './pages/Hotel';
import Upload from './pages/Upload';
import SignIn from './pages/SignIn';
import Submitted from './pages/Submitted';
import Moderation from './pages/Moderation';

function Topbar({ screen }: { screen: string }) {
  const session = useSession();
  const quiet = screen === 'upload' || screen === 'signin' || screen.startsWith('submitted');
  return (
    <header className="topbar">
      <div className="wrap">
        <a className="logo" href="#home" aria-label="RealStay home"><span className="mark"><Icon id="i-aperture" /></span>RealStay</a>
        <div className="topbar-actions">
          {screen === 'moderation' ? <><span className="status status-neutral"><Icon id="i-lock" cls="ic-sm" />Internal</span>{session && <button className="btn btn-secondary btn-sm" onClick={() => writeSession(null)}>Sign out</button>}</>
            : quiet ? null : <a className="btn btn-secondary btn-sm" href="#upload"><Icon id="i-camera" />Share photos</a>}
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site"><div className="wrap">
      <span className="sample-note"><Icon id="i-info" /><span>Prototype with sample content. Hotels are fictional and photos are illustrative (Unsplash, edited to resemble guest uploads), not real contributions.</span></span>
      <nav aria-label="Secondary"><a href="#moderation">Moderation (internal)</a><a href="https://github.com/ArtemRedchych/real_stay" target="_blank" rel="noreferrer">How it was built</a></nav>
    </div></footer>
  );
}

export default function App() {
  const hash = useHash();
  const screen = hash || 'home';
  let page: React.ReactNode;
  let showFoot = true;
  if (screen.startsWith('hotel-')) page = <Hotel id={screen.slice(6)} />;
  else if (screen === 'search') page = <Search />;
  else if (screen === 'upload') { page = <Upload />; showFoot = false; }
  else if (screen === 'signin') { page = <SignIn />; showFoot = false; }
  else if (screen.startsWith('submitted-')) { page = <Submitted id={screen.slice(10)} />; showFoot = false; }
  else if (screen === 'moderation') { page = <Moderation />; showFoot = false; }
  else page = <Home />;
  return (
    <ToastProvider>
      <div className="stage" data-mode="desktop"><div className="device"><div className="app">
        <Topbar screen={screen} />
        <main id="main">{page}</main>
        {showFoot && <Footer />}
      </div></div></div>
    </ToastProvider>
  );
}
