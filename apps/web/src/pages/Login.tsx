import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';

export default function Login() {
  const [searchParams] = useSearchParams();
  const [isRegister, setIsRegister] = useState(searchParams.get('register') === 'true');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, register } = useUserStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isRegister) {
        await register(username, email, password);
      } else {
        await login(username, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative gradient glowing blobs in background */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-blue/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-purple/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-surface/60 border border-border/80 backdrop-blur-lg rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold font-display text-text-primary tracking-tight">
            Knight<span className="text-accent-blue">OS</span>
          </h1>
          <p className="text-text-muted text-sm mt-2 font-medium">
            {isRegister ? 'Create your new account' : 'Sign in to your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-accent-red/15 border border-accent-red/30 px-4 py-3 rounded-lg text-accent-red text-sm font-medium">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="login-username" className="block text-text-muted text-xs font-bold mb-1.5 uppercase tracking-wider">
              Username
            </label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-base/50 border border-border text-text-primary px-3 py-2.5
                       focus:border-accent-blue transition-colors rounded-lg font-medium"
              placeholder="Enter username"
              required
              minLength={3}
              maxLength={20}
              autoComplete="username"
            />
          </div>

          {isRegister && (
            <div className="animate-slide-up">
              <label htmlFor="login-email" className="block text-text-muted text-xs font-bold mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-base/50 border border-border text-text-primary px-3 py-2.5
                         focus:border-accent-blue transition-colors rounded-lg font-medium"
                placeholder="Enter email address"
                required={isRegister}
                autoComplete="email"
              />
            </div>
          )}

          <div>
            <label htmlFor="login-password" className="block text-text-muted text-xs font-bold mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-base/50 border border-border text-text-primary px-3 py-2.5
                       focus:border-accent-blue transition-colors rounded-lg font-medium"
              placeholder="Enter password"
              required
              minLength={6}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-accent-blue text-white py-3 font-semibold rounded-lg shadow-lg shadow-accent-blue/20
                     hover:bg-blue-600 hover:shadow-blue-600/30 transition-all duration-200 disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="text-accent-blue text-sm font-semibold hover:text-blue-400 transition-colors"
          >
            {isRegister
              ? 'Already have an account? Sign in'
              : "Don't have an account? Register"}
          </button>
        </div>

        <div className="mt-8 text-center pt-4 border-t border-border/40">
          <button
            onClick={() => navigate('/')}
            className="text-text-muted text-xs hover:text-text-primary transition-colors flex items-center justify-center gap-1.5 mx-auto font-medium"
          >
            <span>←</span> Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
