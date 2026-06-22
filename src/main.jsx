import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Material Symbols font yüklenince body'ye class ekle; o zamana kadar ikonlar gizlenir
document.fonts.load('20px "Material Symbols Rounded"').then(() => {
  document.body.classList.add('ms-loaded')
}).catch(() => {
  document.body.classList.add('ms-loaded')
})
// 3 saniye sonra her halükarda göster (offline / yavaş ağ güvencesi)
setTimeout(() => document.body.classList.add('ms-loaded'), 3000)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
