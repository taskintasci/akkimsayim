import { lazy, Suspense, useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase/index'
import useStore from './store/useStore'
import Sidebar from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'

const Login           = lazy(() => import('./components/pages/Login'))
const Giris           = lazy(() => import('./components/pages/Giris'))
const Panel           = lazy(() => import('./components/pages/Panel'))
const ExcelYukle      = lazy(() => import('./components/pages/ExcelYukle'))
const StokSayim       = lazy(() => import('./components/pages/StokSayim'))
const KorSayim        = lazy(() => import('./components/pages/KorSayim'))
const Rapor           = lazy(() => import('./components/pages/Rapor'))
const SayimAnalizi    = lazy(() => import('./components/pages/SayimAnalizi'))
const KorSayimAnalizi = lazy(() => import('./components/pages/KorSayimAnalizi'))
const KorSayimRapor       = lazy(() => import('./components/pages/KorSayimRapor'))
const HareketlilikSayim   = lazy(() => import('./components/pages/HareketlilikSayim'))
const MembranSayim        = lazy(() => import('./components/pages/MembranSayim'))
const Ayarlar             = lazy(() => import('./components/pages/Ayarlar'))

const PAGES = {
  panel:     { Component: Panel,            fullHeight: false },
  upload:    { Component: ExcelYukle,       fullHeight: false },
  sayim:     { Component: StokSayim,        fullHeight: true  },
  analiz:    { Component: SayimAnalizi,     fullHeight: false },
  rapor:     { Component: Rapor,            fullHeight: false },
  kor:       { Component: KorSayim,         fullHeight: true  },
  koranaliz: { Component: KorSayimAnalizi,  fullHeight: false },
  korrapor:      { Component: KorSayimRapor,      fullHeight: false },
  hareketlilik:  { Component: HareketlilikSayim,  fullHeight: true  },
  membran:       { Component: MembranSayim,       fullHeight: true  },
  ayarlar:       { Component: Ayarlar,            fullHeight: false },
}

function Spinner() {
  return (
    <div className="h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)' }}>
      <span className="ms text-blue-400 animate-spin" style={{ fontSize: 40 }}>progress_activity</span>
    </div>
  )
}

export default function App() {
  // undefined = henüz kontrol edilmedi, null = giriş yok, object = giriş yapılmış
  const [firebaseUser, setFirebaseUser] = useState(undefined)
  const { setCurrentUser, activeSessionId, rows, rowsLoading } = useStore()
  const [activePage, setActivePage] = useState('panel')

  useEffect(() => {
    return onAuthStateChanged(auth, user => {
      setFirebaseUser(user)
      setCurrentUser(user)
    })
  }, [])

  // Oturum değiştiğinde satır yoksa upload sayfasına yönlendir
  useEffect(() => {
    if (!activeSessionId) return
    if (rowsLoading) return
    if (rows.length === 0) {
      setActivePage('upload')
    }
  }, [activeSessionId, rowsLoading, rows.length])

  // Auth durumu henüz belli değil
  if (firebaseUser === undefined) return <Spinner />

  // Giriş yapılmamış
  if (!firebaseUser) {
    return (
      <Suspense fallback={<Spinner />}>
        <Login />
      </Suspense>
    )
  }

  // Giriş yapılmış ama oturum seçilmemiş
  if (!activeSessionId) {
    return (
      <Suspense fallback={<Spinner />}>
        <Giris onNavigate={setActivePage} />
      </Suspense>
    )
  }

  const { Component: PageComponent, fullHeight } = PAGES[activePage] || PAGES.panel

  return (
    <div className="h-screen flex overflow-hidden bg-slate-100">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar activePage={activePage} />
        <Suspense fallback={<div className="flex-1 flex items-center justify-center text-slate-400 text-[13px]">Yükleniyor…</div>}>
          {fullHeight ? (
            <div className="flex-1 overflow-hidden flex flex-col">
              <PageComponent onNavigate={setActivePage} />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6">
              <PageComponent onNavigate={setActivePage} />
            </div>
          )}
        </Suspense>
      </div>
    </div>
  )
}
