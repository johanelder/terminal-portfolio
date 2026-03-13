import { Link } from 'react-router-dom'
import styles from './Header.module.css'

export default function Header() {
  return (
    <header className={styles.header}>
      <Link to="/login" className={styles.loginPrompt}>
        &gt;_
      </Link>
    </header>
  )
}
