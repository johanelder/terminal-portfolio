import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAllUsers, updateUserRole, deleteUser, type User } from '../services/users'
import { useAuth } from '../hooks/useAuth'
import styles from './Users.module.css'

const ROLES: User['role'][] = ['guest', 'user', 'admin']

export default function Users() {
  const navigate = useNavigate()
  const { user: me } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [roleEditing, setRoleEditing] = useState<number | null>(null)
  const [error, setError] = useState('')

  const loadUsers = useCallback(() => {
    fetchAllUsers().then(setUsers).catch(() => setUsers([]))
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

  async function handleRoleChange(user: User, newRole: User['role']) {
    if (newRole === user.role) { setRoleEditing(null); return }
    setBusy(true)
    setError('')
    try {
      await updateUserRole(user.id, newRole)
      loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'update failed')
    } finally {
      setBusy(false)
      setRoleEditing(null)
    }
  }

  async function handleDelete(id: number) {
    if (confirmDelete !== id) { setConfirmDelete(id); return }
    setConfirmDelete(null)
    setBusy(true)
    setError('')
    try {
      await deleteUser(id)
      loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'delete failed')
      loadUsers()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate('/admin')}>&gt;_cd..</button>
        <div className={styles.title}>#_ [root@terminal] — User Management</div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.userList}>
        {users.length === 0 && (
          <div className={styles.empty}>&gt; no users found</div>
        )}

        {users.map(user => (
          <div key={user.id} className={styles.userRow}>
            <div className={styles.userMeta}>
              <div className={styles.userName}>
                {user.username}
                {me?.id === user.id && <span className={styles.youBadge}> [you]</span>}
              </div>
              <div className={styles.userDetail}>{user.email}</div>
              <div className={styles.userDetail}>
                joined: {new Date(user.created_at).toLocaleDateString()}
              </div>
            </div>

            <div className={styles.userActions}>
              {roleEditing === user.id ? (
                <div className={styles.roleToggle}>
                  {ROLES.map(r => (
                    <button
                      key={r}
                      className={`${styles.roleBtn} ${user.role === r ? styles.roleActive : ''}`}
                      onClick={() => handleRoleChange(user, r)}
                      disabled={busy}
                    >
                      {r}
                    </button>
                  ))}
                  <button
                    className={styles.cancelBtn}
                    onClick={() => setRoleEditing(null)}
                    disabled={busy}
                  >
                    [cancel]
                  </button>
                </div>
              ) : (
                <>
                  <span className={`${styles.badge} ${styles[user.role]}`}>{user.role}</span>
                  {me?.id !== user.id && (
                    <>
                      <button
                        className={styles.btn}
                        onClick={() => setRoleEditing(user.id)}
                        disabled={busy}
                      >
                        [edit role]
                      </button>
                      <button
                        className={styles.btnDanger}
                        onClick={() => handleDelete(user.id)}
                        disabled={busy}
                      >
                        {confirmDelete === user.id ? '[confirm?]' : '[delete]'}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
