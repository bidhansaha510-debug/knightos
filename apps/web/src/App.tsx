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

function Sidebar() {
  const user = useUserStore((s) => s.user);
  const logout = useUserStore((s) => s.logout);
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: '♚' },
    { path: '/play', label: 'Play', icon: '⚔' },
    { path: '/puzzle', label: 'Puzzles', icon: '♟' },
    { path: '/analysis', label: 'Analysis', icon: '🔍' },
    { path: '/leaderboard', label: 'Leaders', icon: '🏆' },
  ];

  // Don't show sidebar on login page or game page
  if (location.pathname === '/login' || location.pathname.startsWith('/game/')) {
    return null;
  }

  return (
    <div className="fixed left-0 top-0 h-full w-14 lg:w-48 bg-surface border-r border-border flex flex-col z-50">
      {/* Logo */}
      <Link to="/" className="px-3 py-4 border-b border-border">
        <span className="text-lg font-bold font-display text-text-primary hidden lg:block">
          Knight<span className="text-accent-blue">OS</span>
        </span>
        <span className="text-lg font-bold font-display text-accent-blue lg:hidden text-center block">K</span>
      </Link>

      {/* Nav items */}
      <nav className="flex-1 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-3 py-2.5 mx-1 mb-0.5
                transition-colors text-sm
                ${isActive
                  ? 'bg-accent-blue/10 text-accent-blue border-l-2 border-accent-blue'
                  : 'text-text-muted hover:text-text-primary hover:bg-elevated border-l-2 border-transparent'
                }
              `}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              <span className="hidden lg:block font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-border py-2">
        {user ? (
          <>
            <Link
              to={`/user/${user.username}`}
              className="flex items-center gap-3 px-3 py-2 mx-1 text-text-muted hover:text-text-primary hover:bg-elevated transition-colors"
            >
              <span className="w-5 text-center text-base">👤</span>
              <span className="hidden lg:block text-sm font-medium truncate">{user.username}</span>
            </Link>
            <Link
              to="/settings"
              className="flex items-center gap-3 px-3 py-2 mx-1 text-text-muted hover:text-text-primary hover:bg-elevated transition-colors"
            >
              <span className="w-5 text-center text-base">⚙</span>
              <span className="hidden lg:block text-sm">Settings</span>
            </Link>
            <button
              onClick={() => logout()}
              className="flex items-center gap-3 px-3 py-2 mx-1 text-text-muted hover:text-accent-red hover:bg-elevated transition-colors w-full"
            >
              <span className="w-5 text-center text-base">⏻</span>
              <span className="hidden lg:block text-sm">Logout</span>
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-3 px-3 py-2 mx-1 text-accent-blue hover:bg-elevated transition-colors"
          >
            <span className="w-5 text-center text-base">→</span>
            <span className="hidden lg:block text-sm font-semibold">Sign In</span>
          </Link>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const fetchMe = useUserStore((s) => s.fetchMe);
  const isLoading = useUserStore((s) => s.isLoading);
  const location = useLocation();

  useEffect(() => {
    fetchMe();
  }, []);

  const showSidebar = location.pathname !== '/login' && !location.pathname.startsWith('/game/');
  const paddingLeft = showSidebar ? 'pl-14 lg:pl-48' : '';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold font-display text-text-primary mb-2">
            Knight<span className="text-accent-blue">OS</span>
          </h1>
          <p className="text-text-muted text-sm animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base">
      <Sidebar />
      <main className={paddingLeft}>
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
          <Route path="/games/:id" element={<Analysis />} /> {/* Game review reuses analysis */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <p className="text-4xl mb-2">♞</p>
                <p className="text-text-muted">Page not found</p>
                <Link to="/" className="text-accent-blue text-sm hover:underline mt-2 inline-block">
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
