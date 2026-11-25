import { lazy, Suspense } from 'react'
import { Link, NavLink, Route, Routes } from 'react-router-dom'
import { AudioLines } from 'lucide-react'
import Home from './pages/Home.jsx'
import { Loading } from './components/ui.jsx'

// The chart library is only downloaded on pages that need it.
const Report = lazy(() => import('./pages/Report.jsx'))
const History = lazy(() => import('./pages/History.jsx'))

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand-soft text-brand' : 'text-muted hover:text-ink'}`

export default function App() {
  return (
    <>
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
            <AudioLines className="text-brand" aria-hidden /> Cadence
          </Link>
          <nav className="flex gap-1">
            <NavLink to="/" className={linkClass}>Analyze</NavLink>
            <NavLink to="/history" className={linkClass}>History</NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">
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
