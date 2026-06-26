import { useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
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

function Header() {
  const user = useUserStore((s) => s.user);
  const logout = useUserStore((s) => s.logout);
  const location = useLocation();

  // Hide header on login page
  if (location.pathname === '/login') return null;

  return (
    <header
      style={{
        height: 48,
        background: 'var(--c-surface)',
        borderBottom: '1px solid var(--c-border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 var(--space-4)',
        gap: 'var(--space-5)',
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
          fontSize: 'var(--text-md)',
          fontWeight: 'var(--weight-bold)',
          color: 'var(--c-text)',
          textDecoration: 'none',
          marginRight: 'var(--space-4)',
          flexShrink: 0,
        }}
      >
        KnightOS
      </Link>

      {/* Nav links */}
      <nav style={{ display: 'flex', gap: 'var(--space-1)', flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-medium)',
                color: isActive ? 'var(--c-text)' : 'var(--c-text-2)',
                textDecoration: 'none',
                padding: '0 var(--space-3)',
                height: 48,
                display: 'flex',
                alignItems: 'center',
                borderBottom: isActive ? '2px solid var(--c-accent)' : '2px solid transparent',
                transition: `color var(--dur-fast) var(--ease-out)`,
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.color = 'var(--c-text)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.color = 'var(--c-text-2)';
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        {user ? (
          <>
            <Link
              to={`/user/${user.username}`}
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-medium)',
                color: 'var(--c-text)',
                textDecoration: 'none',
              }}
            >
              {user.username}
            </Link>
            <Link
              to="/settings"
              className="btn-ghost"
              style={{ fontSize: 'var(--text-sm)' }}
            >
              ⚙
            </Link>
            <button
              onClick={() => logout()}
              className="btn-ghost"
              style={{ fontSize: 'var(--text-sm)', color: 'var(--c-text-2)' }}
            >
              Sign out
            </button>
          </>
        ) : (
          <Link to="/login" className="btn-primary" style={{ padding: '6px var(--space-4)' }}>
            Sign In
          </Link>
        )}
      </div>
    </header>
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
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-md)',
            fontWeight: 'var(--weight-bold)',
            color: 'var(--c-text)',
          }}>
            KnightOS
          </p>
          <p style={{
            color: 'var(--c-text-2)',
            fontSize: 'var(--text-sm)',
            marginTop: 'var(--space-2)',
          }}>
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
            <div style={{
              minHeight: 'calc(100vh - 48px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 'var(--text-lg)', color: 'var(--c-text-2)' }}>Page not found</p>
                <Link
                  to="/"
                  style={{
                    color: 'var(--c-accent)',
                    fontSize: 'var(--text-sm)',
                    textDecoration: 'none',
                    marginTop: 'var(--space-2)',
                    display: 'inline-block',
                  }}
                >
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
