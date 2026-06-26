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
    <div className="min-h-screen bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-display text-text-primary">
            Knight<span className="text-accent-blue">OS</span>
          </h1>
          <p className="text-text-muted text-sm mt-2">
            {isRegister ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-accent-red/10 border border-accent-red/30 px-4 py-2 text-accent-red text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="login-username" className="block text-text-muted text-xs font-semibold mb-1 uppercase tracking-wider">
              Username
            </label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-surface border border-border text-text-primary px-3 py-2.5
                       focus:border-accent-blue transition-colors"
              placeholder="Enter username"
              required
              minLength={3}
              maxLength={20}
              autoComplete="username"
            />
          </div>

          {isRegister && (
            <div className="animate-slide-up">
              <label htmlFor="login-email" className="block text-text-muted text-xs font-semibold mb-1 uppercase tracking-wider">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface border border-border text-text-primary px-3 py-2.5
                         focus:border-accent-blue transition-colors"
                placeholder="Enter email"
                required={isRegister}
                autoComplete="email"
              />
            </div>
          )}

          <div>
            <label htmlFor="login-password" className="block text-text-muted text-xs font-semibold mb-1 uppercase tracking-wider">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface border border-border text-text-primary px-3 py-2.5
                       focus:border-accent-blue transition-colors"
              placeholder="Enter password"
              required
              minLength={6}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-accent-blue text-white py-2.5 font-semibold
                     hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {isLoading ? '...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="text-accent-blue text-sm hover:underline"
          >
            {isRegister
              ? 'Already have an account? Sign in'
              : "Don't have an account? Register"}
          </button>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-text-muted text-xs hover:text-text-primary"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
