import { lazy, Suspense, useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { useShallow } from 'zustand/react/shallow'
import { auth } from './firebase/index'
import useStore from './store/useStore'
import Sidebar from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'

const FirmaSecimi     = lazy(() => import('./components/pages/FirmaSecimi'))
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
const SayimciEkran        = lazy(() => import('./components/pages/SayimciEkran'))
const EpsonPanel          = lazy(() => import('./components/pages/EpsonPanel'))
const EpsonSayim          = lazy(() => import('./components/pages/EpsonSayim'))
const EpsonRapor          = lazy(() => import('./components/pages/EpsonRapor'))
const EpsonKorSayim       = lazy(() => import('./components/pages/EpsonKorSayim'))
const EpsonKorSayimRapor  = lazy(() => import('./components/pages/EpsonKorSayimRapor'))

// Oturum seçilmeden de erişilebilen sayfalar (Sidebar/TopBar kabuğu içinde)
const SESSIONLESS = ['giris', 'ayarlar']

const HEPSI = ['yonetici', 'kontrolcu', 'sayimci']
const YON       = ['yonetici', 'superadmin']              // yönetici yetkisi (süper yönetici her firmayı yönetebilir)
const YON_KONT  = ['yonetici', 'kontrolcu', 'superadmin']  // yönetici + kontrolcü yetkisi
const FIRMA_KEY = 'sayimplani_secili_firma'

// sablon: hangi firma şablonunda görünür (belirtilmemişse şablondan bağımsız/paylaşılan sayfa)
const PAGES = {
  giris:     { Component: Giris,            fullHeight: true,  roles: YON_KONT },
  panel:     { Component: Panel,            fullHeight: false, roles: YON_KONT, sablon: ['standart'] },
  upload:    { Component: ExcelYukle,       fullHeight: false, roles: YON },
  sayim:     { Component: StokSayim,        fullHeight: true,  roles: YON, sablon: ['standart'] },
  analiz:    { Component: SayimAnalizi,     fullHeight: false, roles: YON_KONT, sablon: ['standart'] },
  rapor:     { Component: Rapor,            fullHeight: false, roles: YON_KONT, sablon: ['standart'] },
  kor:       { Component: KorSayim,         fullHeight: true,  roles: YON, sablon: ['standart'] },
  koranaliz: { Component: KorSayimAnalizi,  fullHeight: false, roles: YON_KONT, sablon: ['standart'] },
  korrapor:      { Component: KorSayimRapor,      fullHeight: false, roles: YON_KONT, sablon: ['standart'] },
  hareketlilik:  { Component: HareketlilikSayim,  fullHeight: true,  roles: YON, sablon: ['standart'] },
  membran:       { Component: MembranSayim,       fullHeight: true,  roles: YON, sablon: ['standart'] },
  ayarlar:       { Component: Ayarlar,            fullHeight: false, roles: YON_KONT },
  sayimciekran:  { Component: SayimciEkran,       fullHeight: true,  roles: [...HEPSI, 'superadmin'] },
  epsonpanel:     { Component: EpsonPanel,         fullHeight: false, roles: YON_KONT, sablon: ['wms31'] },
  epsonsayim:     { Component: EpsonSayim,         fullHeight: true,  roles: YON, sablon: ['wms31'] },
  epsonanaliz:    { Component: SayimAnalizi,       fullHeight: false, roles: YON_KONT, sablon: ['wms31'] },
  epsonrapor:     { Component: EpsonRapor,         fullHeight: false, roles: YON_KONT, sablon: ['wms31'] },
  epsonkor:       { Component: EpsonKorSayim,      fullHeight: true,  roles: YON, sablon: ['wms31'] },
  epsonkoranaliz: { Component: KorSayimAnalizi,    fullHeight: false, roles: YON_KONT, sablon: ['wms31'] },
  epsonkorrapor:  { Component: EpsonKorSayimRapor, fullHeight: false, roles: YON_KONT, sablon: ['wms31'] },
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
    <div className="h-screen flex items-center justify-center bg-slate-100">
      <span className="ms text-blue-400 animate-spin" style={{ fontSize: 40 }}>progress_activity</span>
    </div>
  )
}

export default function App() {
  // undefined = henüz kontrol edilmedi, null = giriş yok, object = giriş yapılmış
  const [firebaseUser, setFirebaseUser] = useState(undefined)
  const {
    setCurrentUser, loadUserProfile, userRole, profileLoading,
    activeSessionId, rows, rowsLoading, firmalar, firmaProfile,
  } = useStore(
    useShallow(s => ({
      setCurrentUser:  s.setCurrentUser,
      loadUserProfile: s.loadUserProfile,
      userRole:        s.userRole,
      profileLoading:  s.profileLoading,
      activeSessionId: s.activeSessionId,
      rows:            s.rows,
      rowsLoading:     s.rowsLoading,
      firmalar:        s.firmalar,
      firmaProfile:    s.firmaProfile,
    }))
  )
  const [activePage, setActivePage] = useState('panel')
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedFirma, setSelectedFirma] = useState(() => {
    try { return localStorage.getItem(FIRMA_KEY) } catch { return null }
  })

  function handleNavigate(page) { setActivePage(page); setMenuOpen(false) }

  function handleFirmaDegistir() {
    try { localStorage.removeItem(FIRMA_KEY) } catch { /* localStorage kapalı olabilir */ }
    setSelectedFirma(null)
  }

  useEffect(() => {
    return onAuthStateChanged(auth, user => {
      setFirebaseUser(user)
      setCurrentUser(user)
      loadUserProfile(user, selectedFirma)
    })
  }, [])

  // Oturum değiştiğinde satır yoksa upload sayfasına yönlendir (yalnızca yönetici)
  useEffect(() => {
    if (userRole === 'sayimci') return
    if (!activeSessionId) return
    if (rowsLoading) return
    if (rows.length === 0 && (userRole === 'yonetici' || userRole === 'superadmin')) {
      setActivePage('upload')
    }
  }, [activeSessionId, rowsLoading, rows.length, userRole])

  // Aktif firmanın şablonu değiştiğinde (ilk yükleme veya süper yönetici
  // firma değiştirdiğinde), geçerli olmayan bir sayfadaysak o şablonun
  // varsayılan paneline yönlendir.
  useEffect(() => {
    if (!firmaProfile) return
    const pageDef = PAGES[activePage]
    const uygun = pageDef && (!pageDef.sablon || pageDef.sablon.includes(firmaProfile.sablon))
    if (!uygun) setActivePage(firmaProfile.sablon === 'wms31' ? 'epsonpanel' : 'panel')
  }, [firmaProfile?.sablon])

  // Aktif oturum yoksa (henüz seçilmemiş veya "Sayım Değiştir"/firma switcher
  // ile temizlenmiş) ve oturum gerektirmeyen bir sayfada değilsek, güvenli
  // varsayılan olan Sayımlar listesine dön. Sidebar'daki asıl geçişler zaten
  // kendi handler'larında onNavigate('giris')'i senkron çağırıyor — bu effect
  // sadece ilk yükleme/güvenlik ağı içindir.
  useEffect(() => {
    if (userRole === 'sayimci') return
    if (activeSessionId) return
    if (!SESSIONLESS.includes(activePage)) setActivePage('giris')
  }, [activeSessionId, userRole, activePage])

  // Auth durumu henüz belli değil
  if (firebaseUser === undefined) return <Spinner />

  // Giriş yapılmamış: önce Firma Seçimi, sonra Login
  if (!firebaseUser) {
    if (!selectedFirma) {
      return (
        <Suspense fallback={<Spinner />}>
          <FirmaSecimi onSelect={setSelectedFirma} />
        </Suspense>
      )
    }
    const firma = firmalar.find(f => f.id === selectedFirma)
    return (
      <Suspense fallback={<Spinner />}>
        <Login firma={firma} onFirmaDegistir={handleFirmaDegistir} />
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

  const page = PAGES[activePage] || PAGES.giris
  const { Component: PageComponent, fullHeight, roles, sablon } = page
  const sablonUygun = !sablon || !firmaProfile || sablon.includes(firmaProfile.sablon)
  const sessionUygun = SESSIONLESS.includes(activePage) || !!activeSessionId
  const yetkili = roles.includes(userRole) && sablonUygun && sessionUygun

  return (
    <div className="h-screen flex overflow-hidden bg-slate-100">
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 shadow-xl">
            <Sidebar activePage={activePage} onNavigate={handleNavigate} />
          </div>
        </div>
      )}
      <Sidebar activePage={activePage} onNavigate={handleNavigate} className="hidden md:flex" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar activePage={activePage} onMenu={() => setMenuOpen(true)} />
        <Suspense fallback={<div className="flex-1 flex items-center justify-center text-slate-400 text-[13px]">Yükleniyor…</div>}>
          {!yetkili ? (
            <ErisimYok />
          ) : fullHeight ? (
            <div className="flex-1 overflow-hidden flex flex-col">
              <PageComponent onNavigate={handleNavigate} mode="preview" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <PageComponent onNavigate={handleNavigate} />
            </div>
          )}
        </Suspense>
      </div>
    </div>
  )
}
