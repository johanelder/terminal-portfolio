import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SpaceInvaders from '../SpaceInvaders/SpaceInvaders'
import styles from './EasterEgg.module.css'

export default function EasterEgg() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className={styles.logo} onClick={() => setOpen(true)}>
        &gt; space_invaders.exe
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.panel}
            initial={{ opacity: 0, scaleY: 0.05, scaleX: 0.4 }}
            animate={{ opacity: 1, scaleY: 1, scaleX: 1 }}
            exit={{ opacity: 0, scaleY: 0.05, scaleX: 0.4 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ originX: 0.5, originY: 1 }}
          >
            <button className={styles.closeBtn} onClick={() => setOpen(false)}>[x]</button>
            <SpaceInvaders />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
