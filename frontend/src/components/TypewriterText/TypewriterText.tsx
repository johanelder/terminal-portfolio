import { useTypewriter } from '../../hooks/useTypewriter'

interface Props {
  text: string
  speed?: number
  active?: boolean
}

const URL_RE = /(https?:\/\/\S+)/g

function renderWithLinks(text: string): React.ReactNode {
  const parts = text.split(URL_RE)
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noreferrer">
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}

export default function TypewriterText({ text, speed = 15, active = true }: Props) {
  const displayed = useTypewriter(text, speed, active)
  const done = displayed.length >= text.length

  return (
    <span>
      {done ? renderWithLinks(displayed) : displayed}
      {!done && active && <span className="cursor">█</span>}
    </span>
  )
}
