/**
 * Quiz.tsx — Modo Quiz con detección en tiempo real.
 * - Muestra una letra aleatoria grande
 * - Detecta si el usuario hace la seña correcta con >80% confianza por 2 segundos
 * - Animaciones de correcto/incorrecto, racha y puntuación
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { Zap, SkipForward, RefreshCw, Trophy } from 'lucide-react'
import { useASLDetection } from '../hooks/useASLDetection'
import { useWebcam } from '../hooks/useWebcam'
import { useProgressCtx } from '../App'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const CONFIDENCE_THRESHOLD = 0.80
const HOLD_SECONDS = 2
const ASL_IMG = (l: string) =>
  `https://www.signingsavvy.com/images/words/${l.toLowerCase()}/1.jpg`

type QuizStatus = 'waiting' | 'correct' | 'wrong' | 'holding'

function getRandomLetter(exclude?: string): string {
  const pool = exclude ? LETTERS.filter(l => l !== exclude) : LETTERS
  return pool[Math.floor(Math.random() * pool.length)]
}

export default function Quiz() {
  const { state, recordQuizResult, markLearned } = useProgressCtx()
  const [targetLetter, setTargetLetter] = useState(() => getRandomLetter())
  const [status, setStatus] = useState<QuizStatus>('waiting')
  const [showHint, setShowHint] = useState(false)
  const [holdProgress, setHoldProgress] = useState(0)

  const { videoRef, isReady, error, startCamera, stopCamera } = useWebcam()
  const detection = useASLDetection(videoRef, isReady && status !== 'correct')

  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const holdCountRef = useRef(0)
  const lockRef = useRef(false)

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
      if (holdTimerRef.current) clearInterval(holdTimerRef.current)
    }
  }, []) // eslint-disable-line

  const nextQuestion = useCallback(() => {
    lockRef.current = false
    holdCountRef.current = 0
    setHoldProgress(0)
    setStatus('waiting')
    setShowHint(false)
    setTargetLetter(prev => getRandomLetter(prev))
  }, [])

  const handleWrong = useCallback(() => {
    if (lockRef.current) return
    lockRef.current = true
    setStatus('wrong')
    setShowHint(true)
    recordQuizResult(false)
    setTimeout(() => {
      setStatus('waiting')
      lockRef.current = false
    }, 2500)
  }, [recordQuizResult])

  // Detection logic
  useEffect(() => {
    if (lockRef.current || status === 'correct') return

    const isCorrect =
      detection.handDetected &&
      detection.letter === targetLetter &&
      detection.confidence >= CONFIDENCE_THRESHOLD

    if (isCorrect) {
      if (!holdTimerRef.current) {
        setStatus('holding')
        holdTimerRef.current = setInterval(() => {
          holdCountRef.current += 1
          setHoldProgress(Math.min(holdCountRef.current / (HOLD_SECONDS * 2), 1))
          if (holdCountRef.current >= HOLD_SECONDS * 2) {
            clearInterval(holdTimerRef.current!)
            holdTimerRef.current = null
            holdCountRef.current = 0
            setHoldProgress(0)
            lockRef.current = true
            setStatus('correct')
            recordQuizResult(true)
            markLearned(targetLetter)
            setTimeout(nextQuestion, 2000)
          }
        }, 500)
      }
    } else {
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current)
        holdTimerRef.current = null
        holdCountRef.current = 0
        setHoldProgress(0)
        setStatus('waiting')
      }
    }
  }, [detection.letter, detection.handDetected, detection.confidence,
      targetLetter, status, recordQuizResult, markLearned, nextQuestion])

  const confPct = Math.round(detection.confidence * 100)
  const accuracy = state.totalAttempts > 0
    ? Math.round((state.correctAttempts / state.totalAttempts) * 100) : 0

  const statusColors: Record<QuizStatus, string> = {
    waiting: 'var(--text-primary)',
    holding: 'var(--warning)',
    correct: 'var(--neon)',
    wrong: 'var(--danger)',
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', padding: '32px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 32, flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Zap size={20} color="var(--neon)" />
              <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700 }}>
                Modo Quiz
              </h1>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Haz la seña que aparece en pantalla con {">"}{CONFIDENCE_THRESHOLD * 100}% confianza
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div className="stat-card" style={{ padding: '12px 20px', textAlign: 'center', minWidth: 90 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--neon)' }}>{state.quizScore}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Puntos</div>
            </div>
            <div className="stat-card" style={{ padding: '12px 20px', textAlign: 'center', minWidth: 90 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--warning)' }}>
                🔥 {state.quizStreak}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Racha</div>
            </div>
            <div className="stat-card" style={{ padding: '12px 20px', textAlign: 'center', minWidth: 90 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-secondary)' }}>
                {accuracy}%
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Precisión</div>
            </div>
            {state.bestStreak > 2 && (
              <div className="stat-card" style={{ padding: '12px 20px', textAlign: 'center', minWidth: 90 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#ffd700' }}>
                  <Trophy size={24} color="#ffd700" />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Mejor: {state.bestStreak}</div>
              </div>
            )}
          </div>
        </div>

        {/* Main quiz area */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 340px',
          gap: 24,
        }}>

          {/* Left: Target letter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Big letter display */}
            <div className="card" style={{
              padding: 40, textAlign: 'center',
              background: status === 'correct'
                ? 'rgba(0,255,136,0.08)'
                : status === 'wrong'
                ? 'rgba(255,68,102,0.08)'
                : 'var(--bg-card)',
              border: `1px solid ${
                status === 'correct' ? 'rgba(0,255,136,0.4)'
                : status === 'wrong' ? 'rgba(255,68,102,0.4)'
                : 'var(--border)'
              }`,
              transition: 'all 0.3s ease',
            }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
                Muestra esta seña
              </p>

              <div
                className={status === 'correct' ? 'animate-correct' : status === 'wrong' ? 'animate-wrong' : ''}
                style={{ display: 'inline-block' }}
              >
                <div className="quiz-letter" style={{ color: statusColors[status] }}>
                  {targetLetter}
                </div>
              </div>

              {/* Status messages */}
              <div style={{
                marginTop: 16, fontSize: 16, fontWeight: 600,
                color: statusColors[status],
                minHeight: 28,
              }}>
                {status === 'correct' && '✅ ¡Correcto! +10 puntos'}
                {status === 'wrong' && '❌ Sigue intentando'}
                {status === 'holding' && `⏳ Mantén ${Math.round(holdProgress * HOLD_SECONDS)}s/${HOLD_SECONDS}s`}
                {status === 'waiting' && (detection.handDetected
                  ? `Detectado: ${detection.letter} (${confPct}%)`
                  : '👋 Muestra tu mano')}
              </div>

              {/* Hold progress bar */}
              {status === 'holding' && (
                <div style={{ marginTop: 14 }}>
                  <div className="confidence-bar-track">
                    <div style={{
                      height: '100%', borderRadius: 4,
                      background: 'linear-gradient(90deg, var(--warning), var(--neon))',
                      width: `${holdProgress * 100}%`,
                      transition: 'width 0.4s',
                      boxShadow: '0 0 10px rgba(255,170,0,0.4)',
                    }} />
                  </div>
                </div>
              )}
            </div>

            {/* Hint image */}
            {showHint && (
              <div className="card animate-fade-in" style={{ padding: 16 }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                  💡 Pista — Seña "{targetLetter}"
                </p>
                <img
                  src={ASL_IMG(targetLetter)}
                  alt={`ASL ${targetLetter}`}
                  style={{ width: '100%', borderRadius: 10, maxHeight: 200, objectFit: 'cover' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
            )}

            {/* Controls */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                id="btn-quiz-skip"
                className="btn-secondary"
                onClick={nextQuestion}
                style={{ flex: 1, fontSize: 14, padding: '12px 0' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <SkipForward size={16} /> Saltar
                </span>
              </button>
              {!showHint && (
                <button
                  id="btn-quiz-hint"
                  className="btn-secondary"
                  onClick={() => setShowHint(true)}
                  style={{ flex: 1, fontSize: 14, padding: '12px 0' }}
                >
                  💡 Ver pista
                </button>
              )}
              <button
                id="btn-quiz-wrong"
                onClick={handleWrong}
                style={{
                  flex: 1, fontSize: 14, padding: '12px 0',
                  background: 'rgba(255,68,102,0.1)', border: '1px solid rgba(255,68,102,0.3)',
                  borderRadius: 12, cursor: 'pointer', color: 'var(--danger)', fontWeight: 600,
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <RefreshCw size={16} /> No sé
                </span>
              </button>
            </div>
          </div>

          {/* Right: Webcam + detection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Webcam */}
            <div className="webcam-container" style={{ height: 280 }}>
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
                  justifyContent: 'center', flexDirection: 'column', gap: 8,
                  color: 'var(--text-muted)', fontSize: 13,
                }}>
                  {error
                    ? <span style={{ color: 'var(--danger)', padding: 16, textAlign: 'center', fontSize: 12 }}>{error}</span>
                    : 'Iniciando cámara…'}
                </div>
              )}
            </div>

            {/* Detection panel */}
            <div className="detection-display">
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                Detección en vivo
              </p>

              {detection.error ? (
                <p style={{ fontSize: 12, color: 'var(--danger)', lineHeight: 1.5 }}>{detection.error}</p>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span className="detected-letter" style={{
                      fontSize: 48,
                      color: detection.letter === targetLetter && detection.handDetected
                        ? 'var(--neon)' : 'var(--text-muted)',
                    }}>
                      {detection.handDetected ? detection.letter ?? '?' : '—'}
                    </span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 28, fontWeight: 800 }}>{confPct}%</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>confianza</div>
                    </div>
                  </div>
                  <div className="confidence-bar-track">
                    <div className="confidence-bar-fill" style={{ width: `${confPct}%` }} />
                  </div>
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                    Umbral: {CONFIDENCE_THRESHOLD * 100}% · {detection.isDetecting ? '⏳ analizando…' : '✓'}
                  </div>
                </>
              )}
            </div>

            {/* Streak badge */}
            {state.quizStreak >= 3 && (
              <div className="streak-badge" style={{ alignSelf: 'center' }}>
                🔥 Racha de {state.quizStreak} — ¡Sigue así!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
