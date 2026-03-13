import { useTypewriter } from '../../hooks/useTypewriter'

interface Props {
  text: string
  speed?: number
  active?: boolean
}

export default function TypewriterText({ text, speed = 30, active = true }: Props) {
  const displayed = useTypewriter(text, speed, active)

  return (
    <span>
      {displayed}
      {displayed.length < text.length && active && <span className="cursor">█</span>}
    </span>
  )
}
