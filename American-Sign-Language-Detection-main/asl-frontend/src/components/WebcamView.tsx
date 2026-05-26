/**
 * WebcamView.tsx — Componente de visualización de webcam con overlay estilo scanner.
 */

import { useEffect } from 'react'
import { Camera, CameraOff } from 'lucide-react'
import { useWebcam } from '../hooks/useWebcam'

interface Props {
  onVideoRef?: (ref: React.RefObject<HTMLVideoElement | null>) => void
  compact?: boolean
}

export default function WebcamView({ onVideoRef, compact = false }: Props) {
  const { videoRef, isReady, error, startCamera, stopCamera } = useWebcam()

  useEffect(() => {
    startCamera()
    if (onVideoRef) onVideoRef(videoRef)
    return () => stopCamera()
  }, []) // eslint-disable-line

  useEffect(() => {
    if (onVideoRef) onVideoRef(videoRef)
  }, [videoRef, onVideoRef])

  const size = compact ? { width: '100%', height: 240 } : { width: '100%', height: 320 }

  return (
    <div className="webcam-container" style={size}>
      {/* Corner brackets */}
      <div className="webcam-overlay">
        <div className="webcam-corner tl" />
        <div className="webcam-corner tr" />
        <div className="webcam-corner bl" />
        <div className="webcam-corner br" />
      </div>

      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          width: '100%', height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)', // espejo
          display: isReady ? 'block' : 'none',
        }}
      />

      {/* Loading / Error state */}
      {!isReady && (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 12, color: 'var(--text-secondary)',
        }}>
          {error ? (
            <>
              <CameraOff size={32} color="var(--danger)" />
              <p style={{ fontSize: 13, textAlign: 'center', maxWidth: 200, color: 'var(--danger)' }}>
                {error}
              </p>
              <button className="btn-secondary" style={{ fontSize: 13, padding: '8px 16px' }} onClick={startCamera}>
                Reintentar
              </button>
            </>
          ) : (
            <>
              <Camera size={28} style={{ opacity: 0.4 }} />
              <p style={{ fontSize: 13, opacity: 0.5 }}>Iniciando cámara…</p>
            </>
          )}
        </div>
      )}

      {/* Live indicator */}
      {isReady && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(0,0,0,0.6)', borderRadius: 100,
          padding: '4px 10px', backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--neon)',
            boxShadow: '0 0 8px var(--neon)',
            animation: 'pulse-neon 1.5s ease infinite',
          }} />
          <span style={{ fontSize: 11, color: 'var(--neon)', fontWeight: 600 }}>LIVE</span>
        </div>
      )}
    </div>
  )
}

// Export videoRef separately for external access
export { useWebcam }
