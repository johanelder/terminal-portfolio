import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiRegister } from '../services/auth';
import styles from './Login.module.css';

const LABELS = ['> username:', '> email:', '> password:'];

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [visibleLabel, setVisibleLabel] = useState<number[]>([]);
  const navigate = useNavigate();
  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setVisibleLabel([0]), 120);
    const t2 = setTimeout(() => setVisibleLabel([0, 1]), 280);
    const t3 = setTimeout(() => setVisibleLabel([0, 1, 2]), 440);
    const t4 = setTimeout(() => usernameRef.current?.focus(), 520);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await apiRegister(username, email, password);
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'registration failed');
    } finally {
      setBusy(false);
    }
  }

  const canSubmit = username && email && password && !busy;

  return (
    <div className={styles.page}>
      <form className={styles.box} onSubmit={handleSubmit} noValidate>
        <div className={styles.title}>// register</div>

        <div className={styles.fields}>
          <div className={styles.field} style={{ opacity: visibleLabel.includes(0) ? 1 : 0, transition: 'opacity 0.2s' }}>
            <span className={styles.fieldLabel}>{LABELS[0]}</span>
            <input
              ref={usernameRef}
              className={styles.fieldInput}
              type="text"
              autoComplete="username"
              placeholder="_"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={busy}
            />
          </div>

          <div className={styles.field} style={{ opacity: visibleLabel.includes(1) ? 1 : 0, transition: 'opacity 0.2s' }}>
            <span className={styles.fieldLabel}>{LABELS[1]}</span>
            <input
              className={styles.fieldInput}
              type="email"
              autoComplete="email"
              placeholder="_"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={busy}
            />
          </div>

          <div className={styles.field} style={{ opacity: visibleLabel.includes(2) ? 1 : 0, transition: 'opacity 0.2s' }}>
            <span className={styles.fieldLabel}>{LABELS[2]}</span>
            <input
              className={styles.fieldInput}
              type="password"
              autoComplete="new-password"
              placeholder="_"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={busy}
            />
          </div>
        </div>

        <div className={styles.error}>{error}</div>

        <div className={styles.actions}>
          <button className={styles.submit} type="submit" disabled={!canSubmit}>
            {busy ? '> creating account...' : '> register'}
          </button>
          <div className={styles.link}>
            already have an account? <Link to="/login">login</Link>
          </div>
        </div>
      </form>
    </div>
  );
}
