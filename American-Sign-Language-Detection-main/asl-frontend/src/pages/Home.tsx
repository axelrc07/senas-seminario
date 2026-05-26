/**
 * Home.tsx — Página de inicio con hero section y feature cards.
 */

import { useNavigate } from 'react-router-dom'
import { BookOpen, Zap, BarChart2, Hand, Star, Cpu } from 'lucide-react'
import { useProgressCtx } from '../App'

const FEATURES = [
  {
    icon: Cpu,
    title: 'Detección en Tiempo Real',
    desc: 'Modelo de IA con MediaPipe detecta tu mano y clasifica cada seña instantáneamente mediante tu cámara web.',
    color: '#00ff88',
  },
  {
    icon: Hand,
    title: '26 Letras A–Z',
    desc: 'Aprende el alfabeto dactilológico completo del American Sign Language con imágenes de referencia detalladas.',
    color: '#00ccff',
  },
  {
    icon: Star,
    title: 'Seguimiento de Progreso',
    desc: 'Tu avance se guarda automáticamente. Visualiza qué letras dominas y cuáles necesitas practicar más.',
    color: '#ffaa00',
  },
]

export default function Home() {
  const navigate = useNavigate()
  const { state } = useProgressCtx()
  const pct = Math.round((state.learned.size / 26) * 100)

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', position: 'relative', overflow: 'hidden' }}>
      {/* Background radial */}
      <div className="hero-gradient" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

      {/* Decorative orbs */}
      <div style={{
        position: 'absolute', top: '10%', right: '5%',
        width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(0,255,136,0.06) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '20%', left: '-5%',
        width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(0,200,255,0.04) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px 60px' }}>

        {/* ── Hero ── */}
        <div className="animate-fade-in" style={{ textAlign: 'center', marginBottom: 80 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)',
            borderRadius: 100, padding: '6px 16px', marginBottom: 28,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: 'var(--neon)',
              boxShadow: '0 0 8px var(--neon)',
            }} />
            <span style={{ fontSize: 13, color: 'var(--neon)', fontWeight: 600 }}>
              IA en tiempo real · ASL Fingerspelling
            </span>
          </div>

          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(48px, 7vw, 88px)',
            fontWeight: 800,
            lineHeight: 1.05,
            marginBottom: 24,
            letterSpacing: '-2px',
          }}>
            Aprende{' '}
            <span className="glow-text" style={{ color: 'var(--neon)' }}>ASL</span>
            <br />con Inteligencia Artificial
          </h1>

          <p style={{
            fontSize: 18, color: 'var(--text-secondary)',
            maxWidth: 580, margin: '0 auto 40px',
            lineHeight: 1.7, fontWeight: 400,
          }}>
            Domina el alfabeto del Lenguaje de Señas Americano con detección en
            tiempo real. Tu cámara web + IA = el tutor perfecto.
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              id="btn-start-learning"
              className="btn-primary"
              style={{ fontSize: 16, padding: '14px 36px', borderRadius: 14 }}
              onClick={() => navigate('/aprender')}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookOpen size={18} /> Comenzar a aprender
              </span>
            </button>
            <button
              id="btn-go-quiz"
              className="btn-secondary"
              style={{ fontSize: 16, padding: '14px 36px', borderRadius: 14 }}
              onClick={() => navigate('/quiz')}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={18} /> Ir al Quiz
              </span>
            </button>
          </div>

          {/* Progress hint */}
          {state.learned.size > 0 && (
            <div style={{
              marginTop: 40, display: 'inline-flex', alignItems: 'center', gap: 12,
              background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)',
              borderRadius: 14, padding: '12px 24px',
            }}>
              <BarChart2 size={18} color="var(--neon)" />
              <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                Llevas{' '}
                <strong style={{ color: 'var(--neon)' }}>{state.learned.size} de 26 letras</strong>
                {' '}aprendidas — {pct}% completado
              </span>
            </div>
          )}
        </div>

        {/* ── Feature Cards ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: 20,
        }}>
          {FEATURES.map(({ icon: Icon, title, desc, color }, i) => (
            <div
              key={title}
              className="card animate-fade-in"
              style={{
                padding: 28,
                animationDelay: `${i * 0.1}s`,
                animationFillMode: 'both',
              }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: `rgba(${color === '#00ff88' ? '0,255,136' : color === '#00ccff' ? '0,204,255' : '255,170,0'}, 0.1)`,
                border: `1px solid ${color}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 18,
              }}>
                <Icon size={24} color={color} />
              </div>
              <h3 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 18, fontWeight: 700, marginBottom: 10,
              }}>{title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.65 }}>
                {desc}
              </p>
            </div>
          ))}
        </div>

        {/* ── Stats row ── */}
        <div style={{
          marginTop: 60, display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 16,
        }}>
          {[
            { label: 'Letras detectables', value: '26', sub: 'A – Z' },
            { label: 'Precisión del modelo', value: '95%+', sub: 'con buena iluminación' },
            { label: 'Latencia', value: '~500ms', sub: 'por predicción' },
            { label: 'Modo offline', value: '✓', sub: 'modelo local' },
          ].map(({ label, value, sub }) => (
            <div key={label} className="stat-card" style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 32, fontWeight: 800, color: 'var(--neon)', marginBottom: 4,
              }}>{value}</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
