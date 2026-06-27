import { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useUserStore } from './stores/userStore';
import Home from './pages/Home';
import Login from './pages/Login';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import Puzzle from './pages/Puzzle';
import Analysis from './pages/Analysis';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import Settings from './pages/Settings';

const NAV_ITEMS = [
  { path: '/', label: 'Home' },
  { path: '/play', label: 'Play' },
  { path: '/puzzle', label: 'Puzzles' },
  { path: '/analysis', label: 'Analysis' },
  { path: '/leaderboard', label: 'Leaderboard' },
];

function NavLink({ path, label, isActive }: { path: string; label: string; isActive: boolean }) {
  return (
    <Link
      to={path}
      style={{
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--tx-sm)',
        fontWeight: 'var(--wt-medium)',
        color: isActive ? 'var(--c-text)' : 'var(--c-text-2)',
        textDecoration: 'none',
        padding: '0 var(--sp-3)',
        height: 48,
        display: 'flex',
        alignItems: 'center',
        borderBottom: isActive ? '2px solid var(--c-gold)' : '2px solid transparent',
        transition: 'color var(--dur-fast) var(--ease-out)',
      }}
      onMouseEnter={(e) => {
        if (!isActive) (e.currentTarget as HTMLElement).style.color = 'var(--c-text)';
      }}
      onMouseLeave={(e) => {
        if (!isActive) (e.currentTarget as HTMLElement).style.color = 'var(--c-text-2)';
      }}
    >
      {label}
    </Link>
  );
}

function Header() {
  const user = useUserStore((s) => s.user);
  const logout = useUserStore((s) => s.logout);
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  if (location.pathname === '/login') return null;

  const userRating = user ? (user.ratings?.blitz?.rating || user.ratings?.rapid?.rating || 1500) : 1500;

  return (
    <>
      <header
        style={{
          height: 48,
          background: 'var(--c-surface)',
          borderBottom: '1px solid var(--c-border)',
          borderTop: '2px solid var(--c-gold)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 var(--sp-4)',
          gap: 'var(--sp-5)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--tx-md)',
            fontWeight: 'var(--wt-bold)',
            color: 'var(--c-gold)',
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          KnightOS
        </Link>

        {/* Desktop nav */}
        <nav className="nav-desktop" style={{ display: 'flex', gap: 'var(--sp-1)', flex: 1 }}>
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.path} path={item.path} label={item.label} isActive={location.pathname === item.path} />
          ))}
        </nav>

        {/* Desktop player count */}
        <div className="nav-desktop" style={{
          fontSize: 'var(--tx-xs)',
          fontFamily: 'var(--font-ui)',
          color: 'var(--c-text-2)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--sp-1)',
          marginRight: 'var(--sp-2)',
          userSelect: 'none',
        }}>
          <span style={{ color: 'var(--c-win)', fontSize: '10px' }}>●</span>
          <span>1,248 playing</span>
        </div>

        {/* Desktop user section */}
        <div className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
          {user ? (
            <>
              <Link
                to={`/user/${user.username}`}
                style={{ fontSize: 'var(--tx-sm)', fontWeight: 'var(--wt-medium)', color: 'var(--c-text)', textDecoration: 'none' }}
              >
                {user.username}
              </Link>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--tx-xs)',
                fontWeight: 'var(--wt-bold)',
                background: 'var(--c-elevated)',
                border: '1px solid var(--c-border-mid)',
                padding: '2px 6px',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--c-gold)',
                userSelect: 'none',
              }}>
                {userRating}
              </span>
              <Link to="/settings" className="btn-ghost" style={{ fontSize: 'var(--tx-sm)' }}>⚙</Link>
              <button onClick={() => logout()} className="btn-ghost" style={{ fontSize: 'var(--tx-sm)', color: 'var(--c-text-2)' }}>
                Sign out
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-play" style={{ padding: '4px var(--sp-4)', fontSize: 'var(--tx-xs)', display: 'inline-flex', alignItems: 'center' }}>Sign In</Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="nav-mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            display: 'none',
            padding: 'var(--sp-2)',
            color: 'var(--c-text)',
            fontSize: 'var(--tx-md)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            marginLeft: 'auto',
          }}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div
          className="nav-mobile-menu"
          style={{
            position: 'fixed',
            top: 48,
            left: 0,
            right: 0,
            background: 'var(--c-surface)',
            borderBottom: '1px solid var(--c-border)',
            zIndex: 49,
            padding: 'var(--sp-2) 0',
            display: 'none',
          }}
        >
          <div style={{
            padding: 'var(--sp-3) var(--sp-4)',
            fontSize: 'var(--tx-xs)',
            color: 'var(--c-text-2)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--sp-1)',
            borderBottom: '1px solid var(--c-border)',
            userSelect: 'none',
          }}>
            <span style={{ color: 'var(--c-win)', fontSize: '10px' }}>●</span>
            <span>1,248 playing</span>
          </div>

          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'block',
                padding: 'var(--sp-3) var(--sp-4)',
                fontSize: 'var(--tx-sm)',
                fontWeight: 'var(--wt-medium)',
                color: location.pathname === item.path ? 'var(--c-text)' : 'var(--c-text-2)',
                textDecoration: 'none',
                borderLeft: location.pathname === item.path ? '2px solid var(--c-gold)' : '2px solid transparent',
              }}
            >
              {item.label}
            </Link>
          ))}
          <div style={{ borderTop: '1px solid var(--c-border)', padding: 'var(--sp-3) var(--sp-4)' }}>
            {user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                  <Link to={`/user/${user.username}`} style={{ fontSize: 'var(--tx-sm)', color: 'var(--c-text)', textDecoration: 'none' }}>
                    {user.username}
                  </Link>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--tx-2xs)',
                    fontWeight: 'var(--wt-bold)',
                    background: 'var(--c-elevated)',
                    border: '1px solid var(--c-border-mid)',
                    padding: '1px 4px',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--c-gold)',
                    userSelect: 'none',
                  }}>
                    {userRating}
                  </span>
                </div>
                <Link to="/settings" style={{ fontSize: 'var(--tx-sm)', color: 'var(--c-text-2)', textDecoration: 'none' }}>Settings</Link>
                <button onClick={() => logout()} style={{ fontSize: 'var(--tx-sm)', color: 'var(--c-text-2)', textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                  Sign out
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-play" style={{ width: '100%', textDecoration: 'none', textAlign: 'center', display: 'block', fontSize: 'var(--tx-xs)' }}>Sign In</Link>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-toggle { display: block !important; }
          .nav-mobile-menu { display: block !important; }
        }
      `}</style>
    </>
  );
}

export default function App() {
  const fetchMe = useUserStore((s) => s.fetchMe);
  const isLoading = useUserStore((s) => s.isLoading);

  useEffect(() => {
    fetchMe();
  }, []);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--c-base)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--tx-md)', fontWeight: 'var(--wt-bold)', color: 'var(--c-text)' }}>
            KnightOS
          </p>
          <p style={{ color: 'var(--c-text-2)', fontSize: 'var(--tx-sm)', marginTop: 'var(--sp-2)' }}>
            Loading…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-base)' }}>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/play" element={<Lobby />} />
          <Route path="/game/:id" element={<Game />} />
          <Route path="/puzzle" element={<Puzzle />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/user/:username" element={<Profile />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/games/:id" element={<Analysis />} />
          <Route path="*" element={
            <div style={{ minHeight: 'calc(100vh - 48px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 'var(--tx-lg)', color: 'var(--c-text-2)' }}>Page not found</p>
                <Link to="/" style={{ color: 'var(--c-gold)', fontSize: 'var(--tx-sm)', textDecoration: 'none', marginTop: 'var(--sp-2)', display: 'inline-block' }}>
                  Go home
                </Link>
              </div>
            </div>
          } />
        </Routes>
      </main>
    </div>
  );
}
