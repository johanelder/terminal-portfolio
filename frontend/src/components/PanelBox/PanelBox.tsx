import { motion, AnimatePresence } from 'framer-motion'
import TypewriterText from '../TypewriterText/TypewriterText'
import styles from './PanelBox.module.css'

interface Props {
  label: string
  content: string
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
}

export default function PanelBox({ label, content, isOpen, onOpen, onClose }: Props) {
  return (
    <>
      <motion.div
        className={styles.idleBox}
        onClick={onOpen}
        whileHover={{ scale: 1.03 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        [{label}]
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.expandedBox}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <button className={styles.closeBtn} onClick={onClose}>[x]</button>
            <div className={styles.content}>
              <TypewriterText text={content} active={isOpen} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
