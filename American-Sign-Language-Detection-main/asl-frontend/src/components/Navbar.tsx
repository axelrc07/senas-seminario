/**
 * Navbar.tsx — Barra de navegación fija con links activos.
 */

import { NavLink } from 'react-router-dom'
import { Hand, BookOpen, Zap, BarChart2 } from 'lucide-react'
import { useProgressCtx } from '../App'

const LINKS = [
  { to: '/aprender', label: 'Aprender',  icon: BookOpen },
  { to: '/quiz',     label: 'Quiz',      icon: Zap },
  { to: '/progreso', label: 'Progreso',  icon: BarChart2 },
]

export default function Navbar() {
  const { state } = useProgressCtx()
  const pct = Math.round((state.learned.size / 26) * 100)

  return (
    <nav className="navbar">
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        height: '100%',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <NavLink to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #00ff88, #00ddaa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Hand size={18} color="#000" />
          </div>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700, fontSize: 18, color: 'var(--text-primary)',
          }}>
            ASL<span style={{ color: 'var(--neon)' }}>Learn</span>
          </span>
        </NavLink>

        {/* Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon size={15} />
                {label}
              </span>
            </NavLink>
          ))}
        </div>

        {/* Progress pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(0,255,136,0.06)',
          border: '1px solid rgba(0,255,136,0.2)',
          borderRadius: 100, padding: '6px 14px',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: `conic-gradient(#00ff88 ${pct * 3.6}deg, rgba(255,255,255,0.07) 0deg)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%',
              background: 'var(--bg-base)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 8, fontWeight: 700, color: 'var(--neon)',
            }}>{pct}</div>
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
            {state.learned.size}<span style={{ color: 'var(--text-muted)' }}>/26</span>
          </span>
        </div>
      </div>
    </nav>
  )
}
