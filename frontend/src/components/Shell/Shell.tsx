import { useState, useEffect } from 'react'
import Header from '../Header/Header'
import PanelBox from '../PanelBox/PanelBox'
import EasterEgg from '../EasterEgg/EasterEgg'
import { fetchPublishedPosts, type Post } from '../../services/posts'
import styles from './Shell.module.css'

type Panel = 'about' | 'resume' | 'projects' | null

const STATIC_CONTENT: Record<'about' | 'resume', string> = {
  about: `> whoami\n\n[About content coming soon — watch this space.]\n`,
  resume: `> cat resume.txt\n\n[Resume content coming soon.]\n`,
}

function buildProjectsContent(posts: Post[]): string {
  if (posts.length === 0) {
    return `> ls ./projects\n\n[no published projects yet]\n`
  }
  const entries = posts.map(p => {
    const lines: string[] = [`${p.title}/`]
    if (p.description) lines.push(`  — ${p.description}`)
    if (p.tags)        lines.push(`  tags: ${p.tags}`)
    if (p.external_url) lines.push(`  url:  ${p.external_url}`)
    return lines.join('\n')
  })
  return `> ls ./projects\n\n${entries.join('\n\n')}\n`
}

export default function Shell() {
  const [activePanel, setActivePanel] = useState<Panel>(null)
  const [projects, setProjects] = useState<string>('> ls ./projects\n\nloading...\n')

  useEffect(() => {
    fetchPublishedPosts()
      .then(posts => setProjects(buildProjectsContent(posts)))
      .catch(() => setProjects('> ls ./projects\n\n[failed to load projects]\n'))
  }, [])

  const content = {
    ...STATIC_CONTENT,
    projects,
  }

  return (
    <div className={styles.shell}>
      <Header />
      <div className={styles.boxRow}>
        {(['about', 'resume', 'projects'] as const).map((panel) => (
          <PanelBox
            key={panel}
            label={panel.toUpperCase()}
            content={content[panel]}
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
