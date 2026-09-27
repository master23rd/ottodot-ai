import { Link } from '@tanstack/react-router'

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="brand" to="/" aria-label="OttoDot beranda">
      <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>
      {!compact && <span className="brand-word">otto<span>dot</span></span>}
    </Link>
  )
}
