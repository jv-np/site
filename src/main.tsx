import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// The shell may contain prerendered SEO HTML for crawlers / no-JS users.
// Clear it before mounting so React doesn't warn about a non-empty container.
const rootEl = document.getElementById('root')!
rootEl.replaceChildren()

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
