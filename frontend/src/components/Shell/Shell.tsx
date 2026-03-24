import { useState, useEffect } from 'react'
import Header from '../Header/Header'
import PanelBox from '../PanelBox/PanelBox'
import EasterEgg from '../EasterEgg/EasterEgg'
import { fetchPublishedPosts, type Post } from '../../services/posts'
import styles from './Shell.module.css'

type Panel = 'about' | 'resume' | 'projects' | null

const STATIC_CONTENT: Record<'about' | 'resume', string> = {
  about: `> whoami\n\n[About content coming soon — watch this space.]\n`,
  resume: `> cat resume.txt\n\nSoftware Consultant | Full Stack Developer
Software consultant with a strong foundation in full stack development and cloud technologies, currently working with enterprise clients at Munvo Solutions. I specialize in marketing tech ecosystems, campaign platforms, and system integrations.

Experience
Software Consultant — Munvo Solutions
2025 – Present
Work with Adobe Campaign Classic and Adobe Journey Optimizer
Build and support campaign workflows and customer journeys
Integrate systems across platforms (ACC, AWS-based SMS gateway, Twilio)
Apply knowledge of APIs, databases, and cloud infrastructure in client environments
Art Center Coordinator — Centre d’art d’Argenteuil
2023 – 2024
Manage events, operations, and community outreach
Software Developer Intern — CSSRDN
2022
SQL scripting, Power BI (RLS/OLS), and SMS notification prototyping

Skills
Tech: JavaScript (React, TypeScript, Node.js), Java, PHP (Laravel)
Data: MySQL, MSSQL
Cloud: AWS, Google Cloud, Docker, Linux
Marketing Tech: Adobe Campaign Classic, Adobe Journey Optimizer
Other: APIs, system integrations, Twilio, Power BI

Education
AEC – Full Stack Developer
John Abbott College, 2022

Snapshot
Career switcher with a hands-on mindset and a bias for learning by building.
Currently focused on cloud, integrations, and AI-driven solutions.\n`,
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
