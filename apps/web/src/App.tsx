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
    <div className="hidden md:flex fixed left-0 top-0 h-full w-16 lg:w-52 glass-panel border-r border-border/40 flex-col z-50 p-3 justify-between">
      <div className="flex flex-col gap-4">
        {/* Logo */}
        <Link to="/" className="py-3 px-2 flex items-center gap-2 border-b border-white/5 select-none group">
          <span className="text-xl font-bold font-display bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent hidden lg:block tracking-wide group-hover:brightness-110 transition-all duration-300">
            Knight<span className="font-extrabold text-blue-500">OS</span>
          </span>
          <span className="text-2xl font-black font-display bg-gradient-to-br from-blue-400 to-indigo-500 bg-clip-text text-transparent lg:hidden text-center w-full transform group-hover:scale-110 transition-transform duration-300">K</span>
        </Link>

        {/* Nav items */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl
                  transition-all duration-200 text-sm font-medium
                  ${isActive
                    ? 'bg-accent-blue/15 text-blue-400 shadow-md shadow-accent-blue/5 border border-accent-blue/20'
                    : 'text-text-muted hover:text-text-primary hover:bg-white/5 border border-transparent'
                  }
                `}
              >
                <span className={`text-lg w-5 text-center ${isActive ? 'text-blue-400' : 'text-text-muted group-hover:text-text-primary'}`}>{item.icon}</span>
                <span className="hidden lg:block">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User section */}
      <div className="border-t border-white/5 pt-3 flex flex-col gap-1">
        {user ? (
          <>
            <Link
              to={`/user/${user.username}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-white/5 transition-all duration-200 border border-transparent"
            >
              <span className="w-5 text-center text-lg">👤</span>
              <span className="hidden lg:block text-sm font-semibold truncate">{user.username}</span>
            </Link>
            <Link
              to="/settings"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-white/5 transition-all duration-200 border border-transparent"
            >
              <span className="w-5 text-center text-lg">⚙</span>
              <span className="hidden lg:block text-sm">Settings</span>
            </Link>
            <button
              onClick={() => logout()}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-muted hover:text-accent-red hover:bg-accent-red/10 transition-all duration-200 border border-transparent w-full text-left"
            >
              <span className="w-5 text-center text-lg">⏻</span>
              <span className="hidden lg:block text-sm">Logout</span>
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-blue-400 hover:bg-blue-400/10 transition-all duration-200 border border-transparent"
          >
            <span className="w-5 text-center text-lg">→</span>
            <span className="hidden lg:block text-sm font-bold">Sign In</span>
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
  const mainClasses = showSidebar ? 'pl-0 md:pl-16 lg:pl-52 pb-24 md:pb-0' : '';

function MobileNavBar() {
  const location = useLocation();

  if (location.pathname === '/login' || location.pathname.startsWith('/game/')) {
    return null;
  }

  const navItems = [
    { path: '/', label: 'Home', icon: '♚' },
    { path: '/play', label: 'Play', icon: '⚔' },
    { path: '/puzzle', label: 'Puzzles', icon: '♟' },
    { path: '/analysis', label: 'Analysis', icon: '🔍' },
    { path: '/leaderboard', label: 'Leaders', icon: '🏆' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full h-16 glass-panel border-t border-border/45 flex justify-around items-center z-50 px-2 pb-safe">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`
              flex flex-col items-center justify-center flex-1 py-1
              transition-all duration-200 text-[10px] font-semibold
              ${isActive ? 'text-blue-400' : 'text-text-muted hover:text-text-primary'}
            `}
          >
            <span className="text-xl leading-none mb-1">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

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
      <main className={mainClasses}>
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
      <MobileNavBar />
    </div>
  );
}
