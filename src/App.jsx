import { useState } from 'react'
import Sidebar from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import StokSayim from './components/pages/StokSayim'
import KorSayim from './components/pages/KorSayim'
import Raporlar from './components/pages/Raporlar'
import Ayarlar from './components/pages/Ayarlar'

export default function App() {
  const [activePage, setActivePage] = useState('panel')

  const pages = { panel: StokSayim, 'kor-sayim': KorSayim, raporlar: Raporlar, ayarlar: Ayarlar }
  const PageComponent = pages[activePage] || StokSayim

  return (
    <div className="h-screen flex overflow-hidden bg-background text-on-background" style={{fontFamily: 'Inter, sans-serif'}}>
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-8">
          <PageComponent onNavigate={setActivePage} />
        </main>
      </div>
    </div>
  )
}
