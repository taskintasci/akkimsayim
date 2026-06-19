import { forwardRef } from 'react'

const PrintSheet = forwardRef(function PrintSheet(
  { rows, results, session, mode = 'sayim', hideSayilan = false },
  ref
) {
  const blindMode    = mode === 'kor'
  const sayilanGizli = blindMode || hideSayilan

  const tarihStr = session.tarih
    ? new Date(session.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  const now       = new Date()
  const printDate = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
  const printTime = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })

  const thStyle = (extra = {}) => ({
    padding: '3px 4px',
    fontFamily: 'monospace',
    fontSize: '6.5pt',
    fontWeight: 700,
    letterSpacing: '0.04em',
    ...extra,
  })

  const sigBox = (name) => (
    <div key={name} style={{ border: '1px solid #e2e8f0', borderRadius: 3, padding: '2px 5px' }}>
      <p style={{ fontSize: '7pt', fontWeight: 700, color: '#2563eb', marginBottom: 2 }}>{name}</p>
      <p style={{ fontSize: '5.5pt', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: 1 }}>Tarih</p>
      <div style={{ borderBottom: '1px dashed #cbd5e1', height: 7, marginBottom: 3 }} />
      <p style={{ fontSize: '5.5pt', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: 1 }}>İmza</p>
      <div style={{ borderBottom: '1px dashed #cbd5e1', height: 7 }} />
    </div>
  )

  return (
    <div ref={ref} id="print-area">
      {/* ── Tek tablo — tarayıcı otomatik paginate eder ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7pt' }}>

        {/* thead: her sayfada başlık tekrar eder */}
        <thead>
          <tr>
            <td colSpan={11} style={{ border: 'none', padding: '0 0 5px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 4, borderBottom: '1.5px solid #1e293b' }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <p style={{ fontSize: '11pt', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    AKKİM KİMYA SAN. TİC. A.Ş.
                  </p>
                  <div style={{ width: 40, height: 2.5, background: '#f59e0b', margin: '3px auto' }} />
                  <p style={{ fontSize: '10pt', fontWeight: 600, textTransform: 'uppercase', color: '#334155' }}>
                    {session.sayimBasligi || session.type || 'YIL SONU SAYIM'}
                  </p>
                  <p style={{ fontSize: '7.5pt', color: '#94a3b8', marginTop: 2, fontFamily: 'monospace' }}>
                    {session.tur ? `Tur ${session.tur} · ` : ''}
                    {tarihStr}
                    {session.depoAdi ? ` · ${session.depoAdi}` : ''}
                    {blindMode ? ' · KÖR SAYIM' : ''}
                  </p>
                </div>
                <div style={{ textAlign: 'right', minWidth: 80 }}>
                  <p style={{ fontSize: '6.5pt', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'monospace' }}>SAYFA</p>
                  <p style={{ fontSize: '16pt', fontWeight: 800, color: '#2563eb', lineHeight: 1 }}>—</p>
                  <p style={{ fontSize: '6pt', color: '#94a3b8', fontFamily: 'monospace', marginTop: 3 }}>Baskı: {printDate}</p>
                  <p style={{ fontSize: '6pt', color: '#94a3b8', fontFamily: 'monospace' }}>{printTime} · {rows.length} kalem</p>
                </div>
              </div>
            </td>
          </tr>
          <tr style={{ background: '#1e293b', color: 'white' }}>
            <th style={thStyle({ textAlign: 'center', width: 22 })}>#</th>
            <th style={thStyle({ textAlign: 'left',   width: 100 })}>ADRES</th>
            <th style={thStyle({ textAlign: 'left',   width: 100 })}>KOD</th>
            <th style={thStyle({ textAlign: 'left',   width: 300 })}>AD</th>
            <th style={thStyle({ textAlign: 'center', width: 100 })}>PARTİ</th>
            <th style={thStyle({ textAlign: 'center', width: 65 })}>DURUM</th>
            <th style={thStyle({ textAlign: 'right',  width: 65 })}>ADET</th>
            <th style={thStyle({ textAlign: 'center', width: 65 })}>AMBALAJ</th>
            <th style={thStyle({ textAlign: 'center', width: 65, background: '#1d4ed8' })}>SAYIM MİKTARI</th>
            <th style={thStyle({ textAlign: 'center', width: 65 })}>BİRİM</th>
            <th style={thStyle({ textAlign: 'left'              })}>NOT</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, i) => {
            const isEven = i % 2 === 1
            const miktar = results?.[row.id]?.miktar
            const notlar = results?.[row.id]?.notlar ?? ''
            const isDiff = miktar !== undefined && miktar !== '' && String(miktar) !== String(row.sayim)
            const rowBg  = isDiff ? '#fff1f2' : isEven ? '#f8fafc' : '#ffffff'

            return (
              <tr key={row.id || i} style={{ background: rowBg }}>
                <td style={{ padding: '2px 4px', textAlign: 'center', border: '1px solid #e2e8f0', fontFamily: 'monospace', fontSize: '6.5pt', color: '#94a3b8' }}>{i + 1}</td>
                <td style={{ padding: '2px 4px', border: '1px solid #e2e8f0', fontFamily: 'monospace', fontSize: '6.5pt' }}>{row.adres}</td>
                <td style={{ padding: '2px 4px', border: '1px solid #e2e8f0', fontFamily: 'monospace', fontSize: '6.5pt', color: '#2563eb', fontWeight: 700 }}>{row.kod}</td>
                <td style={{ padding: '2px 4px', border: '1px solid #e2e8f0', fontSize: '6pt', fontWeight: 500 }}>{row.ad}</td>
                <td style={{ padding: '2px 4px', textAlign: 'center', border: '1px solid #e2e8f0', fontFamily: 'monospace', fontSize: '6.5pt', color: '#64748b' }}>{row.parti}</td>
                <td style={{ padding: '2px 4px', textAlign: 'center', border: '1px solid #e2e8f0', fontSize: '6.5pt' }}>{row.durum}</td>
                <td style={{ padding: '2px 4px', textAlign: 'right', border: '1px solid #e2e8f0', fontFamily: 'monospace' }}>{row.adet1}</td>
                <td style={{ padding: '2px 4px', textAlign: 'center', border: '1px solid #e2e8f0', fontSize: '5.5pt', color: '#64748b' }}>{row.ambalaj}</td>
                <td style={{
                  padding: '2px 4px', textAlign: 'right',
                  border: '1px solid #3b82f6',
                  background: isDiff ? '#fee2e2' : '#eff6ff',
                  fontFamily: 'monospace', fontWeight: isDiff ? 700 : 400,
                  color: isDiff ? '#dc2626' : '#1e293b',
                }}>
                  {sayilanGizli ? ' ' : (miktar !== undefined && miktar !== '' ? miktar : ' ')}
                </td>
                <td style={{ padding: '2px 4px', textAlign: 'center', border: '1px solid #e2e8f0', fontFamily: 'monospace', fontSize: '6.5pt', color: '#64748b' }}>{row.birim}</td>
                <td style={{ padding: '2px 4px', border: '1px solid #e2e8f0', fontFamily: 'monospace', fontSize: '6pt', color: '#94a3b8' }}>{notlar || row.aciklama || ''}</td>
              </tr>
            )
          })}
        </tbody>

        {/* tfoot: her sayfanın altında imza + sayfa numarası */}
        <tfoot>
          <tr>
            <td colSpan={11} style={{ padding: '3px 0 0', border: 'none' }}>
              <div style={{ textAlign: 'right', paddingBottom: '1mm', fontFamily: 'monospace', fontSize: '6.5pt', color: '#94a3b8' }}>
                Sayfa <span className="print-page-num" style={{ fontWeight: 700, color: '#2563eb', fontSize: '8pt' }} />
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '4mm',
                padding: '2mm 0 3mm',
                borderTop: '1.5px solid #e2e8f0',
                background: 'white',
              }}>
                {['Sayan 1', 'Sayan 2', 'Sistem Girişi', 'Kontrol'].map(sigBox)}
              </div>
            </td>
          </tr>
        </tfoot>

      </table>
    </div>
  )
})

export default PrintSheet
