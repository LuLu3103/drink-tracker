import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// apply saved/system theme before first paint
const savedTheme = localStorage.getItem('theme')
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
if (savedTheme === 'dark' || (savedTheme !== 'light' && prefersDark)) {
  document.documentElement.classList.add('dark')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Service Worker only works in a secure context (HTTPS or localhost).
// Over plain HTTP on a LAN IP the app still runs, just without offline cache.
if ('serviceWorker' in navigator && window.isSecureContext) {
  import('virtual:pwa-register')
    .then(({ registerSW }) => registerSW({ immediate: true }))
    .catch(() => {
      /* offline cache unavailable, ignore */
    })
}
