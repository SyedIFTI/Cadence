import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource-variable/instrument-sans'
import '@fontsource-variable/bricolage-grotesque'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter><App /></BrowserRouter>,
)
