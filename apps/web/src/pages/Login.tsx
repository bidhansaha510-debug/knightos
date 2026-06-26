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
    <div style={{
      minHeight: '100vh',
      background: 'var(--c-base)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-4)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 380,
        background: 'var(--c-surface)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-6)',
      }}>
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <h1 style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--weight-bold)',
            color: 'var(--c-text)',
            marginBottom: 'var(--space-2)',
          }}>
            KnightOS
          </h1>
          <p style={{
            color: 'var(--c-text-2)',
            fontSize: 'var(--text-sm)',
          }}>
            {isRegister ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              background: 'transparent',
              border: '1px solid var(--c-loss)',
              borderRadius: 'var(--radius-md)',
              padding: '10px var(--space-4)',
              marginBottom: 'var(--space-4)',
              color: 'var(--c-loss)',
              fontSize: 'var(--text-sm)',
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label htmlFor="login-username" style={{
              display: 'block',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-medium)',
              color: 'var(--c-text-2)',
              marginBottom: 'var(--space-1)',
            }}>
              Username
            </label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input"
              placeholder="Enter username"
              required
              minLength={3}
              maxLength={20}
              autoComplete="username"
            />
          </div>

          {isRegister && (
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label htmlFor="login-email" style={{
                display: 'block',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-medium)',
                color: 'var(--c-text-2)',
                marginBottom: 'var(--space-1)',
              }}>
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="Enter email"
                required={isRegister}
                autoComplete="email"
              />
            </div>
          )}

          <div style={{ marginBottom: 'var(--space-5)' }}>
            <label htmlFor="login-password" style={{
              display: 'block',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-medium)',
              color: 'var(--c-text-2)',
              marginBottom: 'var(--space-1)',
            }}>
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="Enter password"
              required
              minLength={6}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
            style={{ width: '100%' }}
          >
            {isLoading ? 'Processing…' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 'var(--space-5)', textAlign: 'center' }}>
          <button
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            style={{
              color: 'var(--c-accent)',
              fontSize: 'var(--text-sm)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
          </button>
        </div>

        <div style={{
          marginTop: 'var(--space-5)',
          paddingTop: 'var(--space-4)',
          borderTop: '1px solid var(--c-border)',
          textAlign: 'center',
        }}>
          <button
            onClick={() => navigate('/')}
            style={{
              color: 'var(--c-text-2)',
              fontSize: 'var(--text-xs)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
