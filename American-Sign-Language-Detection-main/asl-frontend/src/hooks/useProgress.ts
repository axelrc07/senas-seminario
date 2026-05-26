/**
 * useProgress.ts
 * Hook para gestionar el progreso de aprendizaje usando localStorage.
 */

import { useState, useCallback } from 'react'

const STORAGE_KEY = 'asl-progress-v1'

export interface ProgressState {
  learned: Set<string>
  quizScore: number
  quizStreak: number
  bestStreak: number
  totalAttempts: number
  correctAttempts: number
}

function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw)
    return {
      learned: new Set<string>(parsed.learned ?? []),
      quizScore: parsed.quizScore ?? 0,
      quizStreak: 0,
      bestStreak: parsed.bestStreak ?? 0,
      totalAttempts: parsed.totalAttempts ?? 0,
      correctAttempts: parsed.correctAttempts ?? 0,
    }
  } catch {
    return defaultState()
  }
}

function defaultState(): ProgressState {
  return {
    learned: new Set<string>(),
    quizScore: 0,
    quizStreak: 0,
    bestStreak: 0,
    totalAttempts: 0,
    correctAttempts: 0,
  }
}

function saveProgress(state: ProgressState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      learned: Array.from(state.learned),
      quizScore: state.quizScore,
      bestStreak: state.bestStreak,
      totalAttempts: state.totalAttempts,
      correctAttempts: state.correctAttempts,
    }))
  } catch { /* ignore */ }
}

export function useProgress() {
  const [state, setState] = useState<ProgressState>(loadProgress)

  const markLearned = useCallback((letter: string) => {
    setState(prev => {
      const next = { ...prev, learned: new Set(prev.learned).add(letter) }
      saveProgress(next)
      return next
    })
  }, [])

  const unmarkLearned = useCallback((letter: string) => {
    setState(prev => {
      const learned = new Set(prev.learned)
      learned.delete(letter)
      const next = { ...prev, learned }
      saveProgress(next)
      return next
    })
  }, [])

  const recordQuizResult = useCallback((correct: boolean) => {
    setState(prev => {
      const newStreak = correct ? prev.quizStreak + 1 : 0
      const next = {
        ...prev,
        quizScore: correct ? prev.quizScore + 10 : prev.quizScore,
        quizStreak: newStreak,
        bestStreak: Math.max(prev.bestStreak, newStreak),
        totalAttempts: prev.totalAttempts + 1,
        correctAttempts: correct ? prev.correctAttempts + 1 : prev.correctAttempts,
      }
      saveProgress(next)
      return next
    })
  }, [])

  const resetProgress = useCallback(() => {
    const fresh = defaultState()
    setState(fresh)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { state, markLearned, unmarkLearned, recordQuizResult, resetProgress }
}
