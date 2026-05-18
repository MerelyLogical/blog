'use client'

type TogglePillProps = {
  label: string | number
  checked: boolean
  onToggle: () => void
  className?: string
}

export function TogglePill({ label, checked, onToggle, className }: TogglePillProps) {
  return (
    <label className={className}>
      <input type="checkbox" checked={checked} onChange={onToggle} />
      <span>{label}</span>
    </label>
  )
}
