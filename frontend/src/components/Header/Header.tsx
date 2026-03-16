import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import styles from './Header.module.css'

export default function Header() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  if (loading) return <header className={styles.header} />

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {user?.role === 'admin' && (
          <Link to="/admin" className={styles.adminPrompt}>
            #_ [root@terminal]
          </Link>
        )}
      </div>

      <div className={styles.right}>
        {user ? (
          <button className={styles.loginPrompt} onClick={handleLogout}>
            &gt;_ {user.username} [logout]
          </button>
        ) : (
          <Link to="/login" className={styles.loginPrompt}>
            &gt;_
          </Link>
        )}
      </div>
    </header>
  )
}
