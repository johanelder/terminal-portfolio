import { useState } from 'react'
import Header from '../Header/Header'
import PanelBox from '../PanelBox/PanelBox'
import EasterEgg from '../EasterEgg/EasterEgg'
import styles from './Shell.module.css'

type Panel = 'about' | 'resume' | 'projects' | null

const CONTENT: Record<string, string> = {
  about: `> whoami\n\n[About content coming soon — watch this space.]\n`,
  resume: `> cat resume.txt\n\n[Resume content coming soon.]\n`,
  projects: `> ls ./projects\n\nterminal-portfolio/\n  — This site. React + TypeScript, deployed on GCP Cloud Run via GitHub Actions CI/CD.\n\n[More projects coming soon.]\n`,
}

export default function Shell() {
  const [activePanel, setActivePanel] = useState<Panel>(null)

  return (
    <div className={styles.shell}>
      <Header />
      <div className={styles.boxRow}>
        {(['about', 'resume', 'projects'] as const).map((panel) => (
          <PanelBox
            key={panel}
            label={panel.toUpperCase()}
            content={CONTENT[panel]}
            isOpen={activePanel === panel}
            onOpen={() => setActivePanel(panel)}
            onClose={() => setActivePanel(null)}
          />
        ))}
      </div>
      <EasterEgg />
    </div>
  )
}
