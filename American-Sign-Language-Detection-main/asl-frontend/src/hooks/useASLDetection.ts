/**
 * useASLDetection.ts
 * Hook personalizado para capturar frames de la webcam y enviarlos al backend.
 * Retorna la letra detectada, confianza y estado de detección.
 */

import { useState, useEffect, useRef, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/predict'
const INTERVAL_MS = 500

export interface DetectionResult {
  letter: string | null
  confidence: number
  isDetecting: boolean
  handDetected: boolean
  error: string | null
}

export function useASLDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled: boolean = true
): DetectionResult {
  const [result, setResult] = useState<DetectionResult>({
    letter: null,
    confidence: 0,
    isDetecting: false,
    handDetected: false,
    error: null,
  })

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isRunningRef = useRef(false)

  const captureAndPredict = useCallback(async () => {
    if (isRunningRef.current) return
    const video = videoRef.current
    if (!video || video.readyState < 2) return

    isRunningRef.current = true
    setResult(prev => ({ ...prev, isDetecting: true, error: null }))

    try {
      // Capturar frame usando canvas
      const canvas = document.createElement('canvas')
      canvas.width = 320
      canvas.height = 240
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const base64 = canvas.toDataURL('image/jpeg', 0.8)

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
        signal: AbortSignal.timeout(3000),
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const data = await response.json()

      if (data.error) {
        setResult(prev => ({ ...prev, isDetecting: false, error: data.error }))
      } else {
        setResult({
          letter: data.letter ?? null,
          confidence: data.confidence ?? 0,
          isDetecting: false,
          handDetected: data.detected ?? false,
          error: null,
        })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error de conexión'
      setResult(prev => ({
        ...prev,
        isDetecting: false,
        error: msg.includes('fetch') || msg.includes('network')
          ? 'Servidor no disponible. Ejecuta: python predict_server.py && node server.js'
          : msg,
      }))
    } finally {
      isRunningRef.current = false
    }
  }, [videoRef])

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setResult({ letter: null, confidence: 0, isDetecting: false, handDetected: false, error: null })
      return
    }

    intervalRef.current = setInterval(captureAndPredict, INTERVAL_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [enabled, captureAndPredict])

  return result
}
