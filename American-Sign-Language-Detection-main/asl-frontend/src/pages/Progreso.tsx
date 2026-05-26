/**
 * Progreso.tsx — Dashboard de progreso del usuario.
 * - Barra de progreso general
 * - Grid de letras: verde (aprendida) / gris (pendiente)
 * - Estadísticas de quiz
 * - Botón de reinicio
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart2, Trophy, Target, Zap, RotateCcw, BookOpen, CheckCircle } from 'lucide-react'
import { useProgressCtx } from '../App'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const ASL_IMG = (l: string) =>
  `https://www.signingsavvy.com/images/words/${l.toLowerCase()}/1.jpg`

export default function Progreso() {
  const { state, markLearned, unmarkLearned, resetProgress } = useProgressCtx()
  const navigate = useNavigate()
  const [confirmReset, setConfirmReset] = useState(false)
  const [hoveredLetter, setHoveredLetter] = useState<string | null>(null)

  const learnedCount = state.learned.size
  const pct = Math.round((learnedCount / 26) * 100)
  const accuracy = state.totalAttempts > 0
    ? Math.round((state.correctAttempts / state.totalAttempts) * 100) : 0

  const handleReset = () => {
    if (confirmReset) {
      resetProgress()
      setConfirmReset(false)
    } else {
      setConfirmReset(true)
      setTimeout(() => setConfirmReset(false), 4000)
    }
  }

  const toggleLetter = (l: string) => {
    if (state.learned.has(l)) unmarkLearned(l)
    else markLearned(l)
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', padding: '36px 24px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>

        {/* Page header */}
        <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <BarChart2 size={20} color="var(--neon)" />
              <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700 }}>
                Tu Progreso
              </h1>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Haz clic en cualquier letra para marcarla/desmarcarla manualmente
            </p>
          </div>
          <button
            id="btn-reset-progress"
            onClick={handleReset}
            style={{
              background: confirmReset ? 'rgba(255,68,102,0.15)' : 'transparent',
              border: `1px solid ${confirmReset ? 'rgba(255,68,102,0.5)' : 'var(--border)'}`,
              borderRadius: 10, padding: '10px 18px', cursor: 'pointer',
              color: confirmReset ? 'var(--danger)' : 'var(--text-secondary)',
              fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.2s',
            }}
          >
            <RotateCcw size={14} />
            {confirmReset ? '¿Confirmar reinicio?' : 'Reiniciar progreso'}
          </button>
        </div>

        {/* Overall progress card */}
        <div className="card" style={{
          padding: 32, marginBottom: 24,
          background: 'linear-gradient(135deg, rgba(0,255,136,0.05) 0%, var(--bg-card) 100%)',
          border: '1px solid rgba(0,255,136,0.15)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                Progreso General
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                {learnedCount === 0
                  ? 'Aún no has aprendido ninguna letra. ¡Empieza ahora!'
                  : learnedCount === 26
                  ? '🎉 ¡Has completado el alfabeto ASL!'
                  : `Llevas ${learnedCount} de 26 letras aprendidas`}
              </p>
            </div>
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 48, fontWeight: 800,
              color: 'var(--neon)',
              lineHeight: 1,
            }}>
              {pct}%
            </div>
          </div>

          <div className="progress-bar-track" style={{ height: 14 }}>
            <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
            <span>{learnedCount} aprendidas</span>
            <span>{26 - learnedCount} pendientes</span>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 14, marginBottom: 32,
        }}>
          {[
            { icon: Trophy, label: 'Puntuación', value: state.quizScore, color: '#00ff88', unit: 'pts' },
            { icon: Zap, label: 'Racha actual', value: state.quizStreak, color: '#ffaa00', unit: '🔥' },
            { icon: Target, label: 'Mejor racha', value: state.bestStreak, color: '#ffd700', unit: '⭐' },
            { icon: CheckCircle, label: 'Precisión quiz', value: accuracy, color: '#00ccff', unit: '%' },
          ].map(({ icon: Icon, label, value, color, unit }) => (
            <div key={label} className="stat-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: `${color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={16} color={color} />
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
              </div>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 28, fontWeight: 800, color,
              }}>
                {value}{unit !== 'pts' && unit !== '%' ? '' : ''}{' '}
                <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 400 }}>
                  {unit === 'pts' ? 'pts' : unit === '%' ? '%' : unit}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Letter grid */}
        <div>
          <h2 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 17, fontWeight: 700, marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <BookOpen size={17} color="var(--neon)" />
            Letras del Alfabeto ASL
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))',
            gap: 10,
          }}>
            {LETTERS.map(l => {
              const learned = state.learned.has(l)
              const isHovered = hoveredLetter === l

              return (
                <button
                  key={l}
                  id={`progress-letter-${l}`}
                  onClick={() => toggleLetter(l)}
                  onMouseEnter={() => setHoveredLetter(l)}
                  onMouseLeave={() => setHoveredLetter(null)}
                  style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 6, padding: 10,
                    borderRadius: 12, cursor: 'pointer',
                    border: `1px solid ${learned ? 'rgba(0,255,136,0.35)' : isHovered ? 'var(--border-neon)' : 'var(--border)'}`,
                    background: learned ? 'rgba(0,255,136,0.07)' : isHovered ? 'rgba(0,255,136,0.04)' : 'var(--bg-card)',
                    transition: 'all 0.15s ease',
                    transform: isHovered ? 'translateY(-2px)' : 'none',
                    position: 'relative',
                  }}
                >
                  {/* Reference image */}
                  <img
                    src={ASL_IMG(l)}
                    alt={l}
                    style={{
                      width: 48, height: 48, borderRadius: 8,
                      objectFit: 'cover',
                      filter: learned ? 'none' : 'grayscale(0.6) brightness(0.7)',
                      transition: 'filter 0.2s',
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />

                  {/* Letter */}
                  <span style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 16, fontWeight: 700,
                    color: learned ? 'var(--neon)' : 'var(--text-secondary)',
                  }}>{l}</span>

                  {/* Check icon */}
                  {learned && (
                    <div style={{
                      position: 'absolute', top: 4, right: 4,
                      width: 16, height: 16, borderRadius: '50%',
                      background: 'var(--neon)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <CheckCircle size={11} color="#000" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div style={{
            marginTop: 16, display: 'flex', gap: 24, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--neon)' }} /> Aprendida
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--text-muted)' }} /> Pendiente
            </span>
            <span>Clic para cambiar estado</span>
          </div>
        </div>

        {/* CTA */}
        {learnedCount < 26 && (
          <div style={{
            marginTop: 40, textAlign: 'center',
            padding: 32, borderRadius: 16,
            background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.1)',
          }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: 15 }}>
              {learnedCount === 0
                ? '¡Comienza tu aprendizaje del ASL ahora!'
                : `Continúa practicando — te faltan ${26 - learnedCount} letras`}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={() => navigate('/aprender')} style={{ fontSize: 14, padding: '11px 24px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <BookOpen size={15} /> Seguir aprendiendo
                </span>
              </button>
              <button className="btn-secondary" onClick={() => navigate('/quiz')} style={{ fontSize: 14, padding: '11px 24px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Zap size={15} /> Practicar en Quiz
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
