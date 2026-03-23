import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SpaceInvaders from '../SpaceInvaders/SpaceInvaders'
import MissileCommand from '../MissileCommand/MissileCommand'
import { INVADER_ART } from '../../constants/invaderArt'
import { MISSILE_ART } from '../../constants/missileArt'
import styles from './EasterEgg.module.css'

type ActiveGame = 'spaceinvaders' | 'missile' | null

export default function EasterEgg() {
  const [active, setActive] = useState<ActiveGame>(null)

  function open(game: ActiveGame) {
    setActive(game)
  }

  function close() {
    setActive(null)
  }

  return (
    <>
      <div
        className={`${styles.logo} ${styles.logoLeft}`}
        onClick={() => open('missile')}
      >
        <pre className={styles.art}>{MISSILE_ART.join('\n')}</pre>
      </div>

      <div
        className={`${styles.logo} ${styles.logoRight}`}
        onClick={() => open('spaceinvaders')}
      >
        <pre className={styles.art}>{INVADER_ART.join('\n')}</pre>
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            className={styles.panel}
            initial={{ opacity: 0, scaleY: 0.05, scaleX: 0.4 }}
            animate={{ opacity: 1, scaleY: 1, scaleX: 1 }}
            exit={{ opacity: 0, scaleY: 0.05, scaleX: 0.4 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              originX: active === 'missile' ? 0.25 : 0.75,
              originY: 1,
            }}
          >
            <button className={styles.closeBtn} onClick={close}>[x]</button>
            {active === 'spaceinvaders' && <SpaceInvaders />}
            {active === 'missile'       && <MissileCommand />}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
