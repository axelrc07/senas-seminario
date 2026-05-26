/**
 * Aprender.tsx — Página con grid de 26 letras ASL y panel lateral de práctica.
 * - Grid de tarjetas A-Z con imagen de referencia
 * - Panel lateral con webcam + detección en tiempo real
 * - Auto-marca como aprendida si se detecta la letra por 3 segundos consecutivos
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { X, CheckCircle, ChevronRight, BookOpen } from 'lucide-react'
import { useASLDetection } from '../hooks/useASLDetection'
import { useWebcam } from '../hooks/useWebcam'
import { useProgressCtx } from '../App'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const ASL_IMG = (l: string) =>
  `https://www.signingsavvy.com/images/words/${l.toLowerCase()}/1.jpg`

const HOLD_SECONDS = 3
const CONFIDENCE_THRESHOLD = 0.65

// ─── Letter Card ─────────────────────────────────────────────────────────────
function LetterCard({
  letter, learned, selected, onClick,
}: {
  letter: string; learned: boolean; selected: boolean; onClick: () => void
}) {
  return (
    <button
      id={`letter-card-${letter}`}
      onClick={onClick}
      className={`letter-card ${selected ? 'selected' : ''} ${learned ? 'learned' : ''}`}
      style={{ position: 'relative', border: 'none', padding: 12 }}
    >
      {/* Reference image */}
      <img
        src={ASL_IMG(letter)}
        alt={`ASL ${letter}`}
        style={{
          width: '70%', aspectRatio: '1',
          objectFit: 'cover', borderRadius: 8,
          filter: learned ? 'none' : 'grayscale(0.3)',
        }}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none'
        }}
      />

      {/* Letter label */}
      <div style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 20, fontWeight: 800,
        color: selected ? 'var(--neon)' : learned ? 'var(--neon)' : 'var(--text-primary)',
        marginTop: 4,
      }}>{letter}</div>

      {/* Learned badge */}
      {learned && (
        <div style={{
          position: 'absolute', top: 6, right: 6,
          width: 20, height: 20, borderRadius: '50%',
          background: 'var(--neon)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CheckCircle size={13} color="#000" />
        </div>
      )}

      {/* Selected indicator */}
      {selected && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 3, background: 'var(--neon)',
          boxShadow: '0 0 8px var(--neon)',
        }} />
      )}
    </button>
  )
}

// ─── Side Panel ──────────────────────────────────────────────────────────────
function SidePanel({
  letter, learned, onClose, onMarkLearned,
}: {
  letter: string; learned: boolean; onClose: () => void; onMarkLearned: () => void
}) {
  const { videoRef, isReady, error, startCamera, stopCamera } = useWebcam()
  const detection = useASLDetection(videoRef, isReady)

  // Hold timer for auto-mark
  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const holdCountRef = useRef(0)
  const [holdProgress, setHoldProgress] = useState(0)
  const [justLearned, setJustLearned] = useState(false)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [letter]) // eslint-disable-line

  // Auto-mark logic
  useEffect(() => {
    const isCorrect =
      detection.handDetected &&
      detection.letter === letter &&
      detection.confidence >= CONFIDENCE_THRESHOLD

    if (isCorrect && !learned && !justLearned) {
      if (!holdTimerRef.current) {
        holdTimerRef.current = setInterval(() => {
          holdCountRef.current += 1
          setHoldProgress(Math.min(holdCountRef.current / (HOLD_SECONDS * 2), 1))
          if (holdCountRef.current >= HOLD_SECONDS * 2) {
            clearInterval(holdTimerRef.current!)
            holdTimerRef.current = null
            holdCountRef.current = 0
            setHoldProgress(0)
            setJustLearned(true)
            onMarkLearned()
          }
        }, 500)
      }
    } else {
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current)
        holdTimerRef.current = null
      }
      holdCountRef.current = 0
      setHoldProgress(0)
    }
    return () => {
      if (holdTimerRef.current) clearInterval(holdTimerRef.current)
    }
  }, [detection.letter, detection.handDetected, detection.confidence, letter, learned, justLearned, onMarkLearned])

  useEffect(() => { setJustLearned(false) }, [letter])

  const confPct = Math.round(detection.confidence * 100)
  const isCorrect = detection.letter === letter && detection.handDetected

  return (
    <div className="side-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 48, fontWeight: 800,
            color: isCorrect ? 'var(--neon)' : 'var(--text-primary)',
            lineHeight: 1,
            transition: 'color 0.3s',
            textShadow: isCorrect ? '0 0 30px rgba(0,255,136,0.5)' : 'none',
          }}>{letter}</span>
          {(learned || justLearned) && (
            <div style={{
              background: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.4)',
              borderRadius: 100, padding: '4px 12px',
              fontSize: 12, fontWeight: 700, color: 'var(--neon)',
            }}>✓ APRENDIDA</div>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
            borderRadius: 8, padding: 8, cursor: 'pointer', color: 'var(--text-secondary)',
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Reference image */}
      <div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          Referencia
        </p>
        <img
          src={ASL_IMG(letter)}
          alt={`ASL ${letter} referencia`}
          style={{
            width: '100%', borderRadius: 12,
            border: '1px solid var(--border)',
            objectFit: 'cover', maxHeight: 180,
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).parentElement!.style.display = 'none'
          }}
        />
      </div>

      {/* Webcam */}
      <div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          Tu cámara
        </p>
        <div className="webcam-container" style={{ height: 200 }}>
          <div className="webcam-overlay">
            <div className="webcam-corner tl" />
            <div className="webcam-corner tr" />
            <div className="webcam-corner bl" />
            <div className="webcam-corner br" />
          </div>
          <video
            ref={videoRef}
            autoPlay muted playsInline
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              transform: 'scaleX(-1)',
              display: isReady ? 'block' : 'none',
            }}
          />
          {!isReady && (
            <div style={{
              height: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13,
            }}>
              {error ? (
                <span style={{ color: 'var(--danger)', textAlign: 'center', padding: 12, fontSize: 12 }}>{error}</span>
              ) : 'Iniciando cámara…'}
            </div>
          )}
        </div>
      </div>

      {/* Detection result */}
      <div className="detection-display">
        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          Detectando
        </p>
        {detection.error ? (
          <p style={{ fontSize: 12, color: 'var(--danger)', lineHeight: 1.4 }}>{detection.error}</p>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span className="detected-letter" style={{
                color: isCorrect ? 'var(--neon)' : detection.handDetected ? 'var(--warning)' : 'var(--text-muted)',
              }}>
                {detection.handDetected ? detection.letter ?? '?' : '—'}
              </span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {detection.handDetected ? `${confPct}%` : '0%'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>confianza</div>
              </div>
            </div>

            {/* Confidence bar */}
            <div className="confidence-bar-track">
              <div className="confidence-bar-fill" style={{ width: `${confPct}%` }} />
            </div>

            {/* Hold progress */}
            {holdProgress > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{
                  fontSize: 11, color: 'var(--neon)', fontWeight: 600, marginBottom: 6,
                  display: 'flex', justifyContent: 'space-between',
                }}>
                  <span>⏳ Mantén la seña…</span>
                  <span>{Math.round(holdProgress * HOLD_SECONDS)}s / {HOLD_SECONDS}s</span>
                </div>
                <div className="confidence-bar-track">
                  <div style={{
                    height: '100%', borderRadius: 4,
                    background: 'linear-gradient(90deg, #00ff88, #ffaa00)',
                    width: `${holdProgress * 100}%`,
                    transition: 'width 0.4s ease',
                    boxShadow: '0 0 8px rgba(0,255,136,0.5)',
                  }} />
                </div>
              </div>
            )}

            {/* Status message */}
            <p style={{
              marginTop: 10, fontSize: 12,
              color: isCorrect ? 'var(--neon)' : 'var(--text-muted)',
            }}>
              {!detection.handDetected
                ? '👋 Muestra tu mano frente a la cámara'
                : isCorrect
                ? '✅ ¡Seña correcta! Mantenla para marcarla como aprendida'
                : `❌ Intenta hacer la seña "${letter}"`}
            </p>
          </>
        )}
      </div>

      {/* Manual mark button */}
      {!learned && !justLearned && (
        <button
          id={`btn-mark-learned-${letter}`}
          className="btn-secondary"
          style={{ width: '100%', fontSize: 13 }}
          onClick={onMarkLearned}
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <CheckCircle size={15} /> Marcar como aprendida
          </span>
        </button>
      )}
    </div>
  )
}

// ─── Main Aprender Page ───────────────────────────────────────────────────────
export default function Aprender() {
  const { state, markLearned } = useProgressCtx()
  const [selected, setSelected] = useState<string | null>(null)

  const handleSelect = useCallback((l: string) => {
    setSelected(prev => prev === l ? null : l)
  }, [])

  const handleMarkLearned = useCallback((letter: string) => {
    markLearned(letter)
  }, [markLearned])

  const learnedCount = state.learned.size
  const pct = Math.round((learnedCount / 26) * 100)

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        borderBottom: '1px solid var(--border)',
        padding: '24px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg-panel)',
        flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <BookOpen size={18} color="var(--neon)" />
            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 22, fontWeight: 700,
            }}>Modo Aprender</h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Haz clic en una letra para practicarla con tu cámara web
          </p>
        </div>

        {/* Progress */}
        <div style={{ minWidth: 220 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginBottom: 6, fontSize: 13,
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>Progreso</span>
            <span style={{ color: 'var(--neon)', fontWeight: 700 }}>
              {learnedCount}/26 letras · {pct}%
            </span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* Body: Grid + Panel */}
      <div style={{
        flex: 1, display: 'flex', overflow: 'hidden',
      }}>
        {/* Letter grid */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: 24,
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
            gap: 12,
          }}>
            {LETTERS.map(l => (
              <LetterCard
                key={l}
                letter={l}
                learned={state.learned.has(l)}
                selected={selected === l}
                onClick={() => handleSelect(l)}
              />
            ))}
          </div>

          {/* Legend */}
          <div style={{
            marginTop: 24, display: 'flex', gap: 20, flexWrap: 'wrap',
            fontSize: 12, color: 'var(--text-muted)',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--neon)' }} />
              Aprendida
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--border)' }} />
              Pendiente
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ChevronRight size={12} />
              Clic para practicar
            </span>
          </div>
        </div>

        {/* Side panel */}
        {selected && (
          <div style={{
            width: 320,
            borderLeft: '1px solid var(--border)',
            overflowY: 'auto',
            flexShrink: 0,
          }}>
            <SidePanel
              key={selected}
              letter={selected}
              learned={state.learned.has(selected)}
              onClose={() => setSelected(null)}
              onMarkLearned={() => handleMarkLearned(selected)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
