import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/landing.css'
import './styles/components.css'
import './styles/auth.css'
import './styles/dashboard.css'
import './styles/investments.css'
import './styles/retention.css'
import './styles/upgrade.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
