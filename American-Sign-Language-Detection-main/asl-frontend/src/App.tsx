/**
 * App.tsx — Router principal con contexto de progreso global.
 */

import { Routes, Route } from 'react-router-dom'
import { createContext, useContext } from 'react'
import { useProgress } from './hooks/useProgress'
import type { ProgressState } from './hooks/useProgress'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Aprender from './pages/Aprender'
import Quiz from './pages/Quiz'
import Progreso from './pages/Progreso'

// ─── Context global de progreso ───────────────────────────────────────────────
interface ProgressCtx {
  state: ProgressState
  markLearned: (l: string) => void
  unmarkLearned: (l: string) => void
  recordQuizResult: (correct: boolean) => void
  resetProgress: () => void
}

export const ProgressContext = createContext<ProgressCtx>({} as ProgressCtx)
export const useProgressCtx = () => useContext(ProgressContext)

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const progress = useProgress()

  return (
    <ProgressContext.Provider value={progress}>
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
        <Navbar />
        <main style={{ paddingTop: '64px' }}>
          <Routes>
            <Route path="/"          element={<Home />} />
            <Route path="/aprender"  element={<Aprender />} />
            <Route path="/quiz"      element={<Quiz />} />
            <Route path="/progreso"  element={<Progreso />} />
          </Routes>
        </main>
      </div>
    </ProgressContext.Provider>
  )
}
