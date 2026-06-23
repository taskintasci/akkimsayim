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
const KullaniciYonetim    = lazy(() => import('./components/pages/KullaniciYonetim'))
const SayimciEkran        = lazy(() => import('./components/pages/SayimciEkran'))

const HEPSI = ['yonetici', 'kontrolcu', 'sayimci']

const PAGES = {
  panel:     { Component: Panel,            fullHeight: false, roles: ['yonetici', 'kontrolcu'] },
  upload:    { Component: ExcelYukle,       fullHeight: false, roles: ['yonetici'] },
  sayim:     { Component: StokSayim,        fullHeight: true,  roles: ['yonetici'] },
  analiz:    { Component: SayimAnalizi,     fullHeight: false, roles: ['yonetici', 'kontrolcu'] },
  rapor:     { Component: Rapor,            fullHeight: false, roles: ['yonetici', 'kontrolcu'] },
  kor:       { Component: KorSayim,         fullHeight: true,  roles: ['yonetici'] },
  koranaliz: { Component: KorSayimAnalizi,  fullHeight: false, roles: ['yonetici', 'kontrolcu'] },
  korrapor:      { Component: KorSayimRapor,      fullHeight: false, roles: ['yonetici', 'kontrolcu'] },
  hareketlilik:  { Component: HareketlilikSayim,  fullHeight: true,  roles: ['yonetici'] },
  membran:       { Component: MembranSayim,       fullHeight: true,  roles: ['yonetici'] },
  ayarlar:       { Component: Ayarlar,            fullHeight: false, roles: ['yonetici'] },
  kullanicilar:  { Component: KullaniciYonetim,   fullHeight: false, roles: ['yonetici'] },
  sayimciekran:  { Component: SayimciEkran,       fullHeight: true,  roles: HEPSI },
}

function ErisimYok() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
      <span className="ms text-slate-300" style={{ fontSize: 56 }}>lock</span>
      <h2 className="text-slate-700 font-semibold text-lg mt-4">Erişim Yetkiniz Yok</h2>
      <p className="text-slate-400 text-sm mt-1">Bu sayfayı görüntüleme yetkiniz bulunmuyor.</p>
    </div>
  )
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
  const { setCurrentUser, loadUserProfile, userRole, profileLoading, activeSessionId, rows, rowsLoading } = useStore()
  const [activePage, setActivePage] = useState('panel')

  useEffect(() => {
    return onAuthStateChanged(auth, user => {
      setFirebaseUser(user)
      setCurrentUser(user)
      loadUserProfile(user)
    })
  }, [])

  // Oturum değiştiğinde satır yoksa upload sayfasına yönlendir (yalnızca yönetici)
  useEffect(() => {
    if (userRole === 'sayimci') return
    if (!activeSessionId) return
    if (rowsLoading) return
    if (rows.length === 0 && userRole === 'yonetici') {
      setActivePage('upload')
    }
  }, [activeSessionId, rowsLoading, rows.length, userRole])

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

  // Profil/rol henüz yükleniyor
  if (profileLoading || !userRole) return <Spinner />

  // Sayımcı: oturum seçimi ve sidebar yok — doğrudan tam ekran sayım akışı
  if (userRole === 'sayimci') {
    return (
      <Suspense fallback={<Spinner />}>
        <SayimciEkran mode="self" />
      </Suspense>
    )
  }

  // Yönetici/Kontrolcü: oturum seçilmemiş
  if (!activeSessionId) {
    return (
      <Suspense fallback={<Spinner />}>
        <Giris onNavigate={setActivePage} />
      </Suspense>
    )
  }

  const page = PAGES[activePage] || PAGES.panel
  const { Component: PageComponent, fullHeight, roles } = page
  const yetkili = roles.includes(userRole)

  return (
    <div className="h-screen flex overflow-hidden bg-slate-100">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar activePage={activePage} />
        <Suspense fallback={<div className="flex-1 flex items-center justify-center text-slate-400 text-[13px]">Yükleniyor…</div>}>
          {!yetkili ? (
            <ErisimYok />
          ) : fullHeight ? (
            <div className="flex-1 overflow-hidden flex flex-col">
              <PageComponent onNavigate={setActivePage} mode="preview" />
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
