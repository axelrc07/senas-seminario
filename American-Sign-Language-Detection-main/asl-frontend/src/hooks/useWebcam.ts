/**
 * useWebcam.ts
 * Hook para gestionar el acceso a la webcam del navegador.
 */

import { useState, useEffect, useRef, useCallback } from 'react'

export function useWebcam() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startCamera = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
          setIsReady(true)
        }
      }
    } catch (err) {
      const e = err as Error
      setError(e.name === 'NotAllowedError'
        ? 'Permiso de cámara denegado. Habilítalo en la configuración del navegador.'
        : `Error al acceder a la cámara: ${e.message}`)
    }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setIsReady(false)
  }, [])

  useEffect(() => () => stopCamera(), [stopCamera])

  return { videoRef, isReady, error, startCamera, stopCamera }
}
