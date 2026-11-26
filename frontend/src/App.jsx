import { lazy, Suspense } from 'react'
import { Link, NavLink, Route, Routes } from 'react-router-dom'
import { AudioLines } from 'lucide-react'
import Home from './pages/Home.jsx'
import ThemeSwitch from './components/ThemeSwitch.jsx'
import { Loading } from './components/ui.jsx'

// The chart library is only downloaded on pages that need it.
const Report = lazy(() => import('./pages/Report.jsx'))
const History = lazy(() => import('./pages/History.jsx'))

const linkClass = ({ isActive }) =>
  `rounded-lg px-2.5 py-2 text-sm sm:px-3 font-medium ${isActive ? 'bg-brand-soft text-brand' : 'text-muted hover:text-ink'}`

export default function App() {
  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-5">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
            <AudioLines className="text-brand" aria-hidden /> Cadence
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <nav className="flex gap-1">
              <NavLink to="/" className={linkClass}>Analyze</NavLink>
              <NavLink to="/history" className={linkClass}>History</NavLink>
            </nav>
            <ThemeSwitch />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-5 sm:py-8">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/report/:id" element={<Report />} />
            <Route path="/history" element={<History />} />
            <Route path="*" element={<p>This page does not exist. <Link className="text-brand underline" to="/">Go to Analyze</Link></p>} />
          </Routes>
        </Suspense>
      </main>
    </>
  )
}
