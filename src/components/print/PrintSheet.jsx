import { forwardRef } from 'react'

const ROWS_PER_PAGE = 25

const PrintSheet = forwardRef(function PrintSheet({ rows, results, session, blindMode = false }, ref) {
  const pages = []
  for (let i = 0; i < rows.length; i += ROWS_PER_PAGE) {
    pages.push(rows.slice(i, i + ROWS_PER_PAGE))
  }
  const totalPages = pages.length || 1

  return (
    <div ref={ref} id="print-area">
      {(pages.length === 0 ? [[]] : pages).map((pageRows, pageIdx) => (
        <div key={pageIdx} className={pageIdx < totalPages - 1 ? 'page-break' : ''} style={{background: 'white', padding: '0'}}>
          {/* Header */}
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px', paddingBottom: '4px', borderBottom: '1px solid #c2c6d4'}}>
            <div style={{maxWidth: '30%'}}>
              <div style={{fontSize: '8pt', color: '#727783', marginBottom: '2px'}}>Sınıflandırma: Serbest / Public olarak etiketlenmiştir.</div>
              <div style={{fontSize: '14pt', fontWeight: '700', color: '#1a1c1e', lineHeight: '1.2'}}>{session.depoAdi || '901 ALİŞAN DEPO'}</div>
            </div>
            <div style={{textAlign: 'center', flex: 1, padding: '0 12px'}}>
              <div style={{fontSize: '11pt', fontWeight: '700', color: '#00478d', textTransform: 'uppercase'}}>AKKİM KİMYA SAN. TİC. A.Ş.</div>
              <div style={{width: '40px', height: '3px', background: '#7d5700', margin: '3px auto'}}></div>
              <div style={{fontSize: '10pt', fontWeight: '600', textTransform: 'uppercase', color: '#1a1c1e'}}>{session.sayimBasligi || 'YIL SONU SAYIM'}</div>
              {session.tarih && <div style={{fontSize: '7pt', color: '#727783', marginTop: '2px'}}>{session.tarih}{session.tur ? ` • Tur ${session.tur}` : ''}</div>}
            </div>
            <div style={{textAlign: 'right', minWidth: '80px'}}>
              <div style={{fontSize: '7pt', color: '#727783', marginBottom: '1px'}}>SAYFA</div>
              <div style={{fontSize: '14pt', fontWeight: '700', color: '#00478d'}}>{pageIdx + 1}/{totalPages}</div>
            </div>
          </div>

          {/* Table */}
          <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '7.5pt'}}>
            <thead>
              <tr style={{background: '#1a1c1e', color: '#ffffff'}}>
                {['Sıra No.','Adres','Kod','Ad','Parti','Durum','Adet1','Ambalaj', blindMode ? 'Sayılan Miktar' : 'Sayım','Birim','Açıklama'].map(h => (
                  <th key={h} style={{padding: '3px 4px', textAlign: h === 'Ad' ? 'left' : 'center', fontSize: '7pt', fontWeight: '600', letterSpacing: '0.03em'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, i) => {
                const isEven = i % 2 === 1
                const durum = row.durum || ''
                const rowBg = durum === 'Bloke' ? '#fff3f3' : durum === 'SKTG' ? '#fff8e0' : isEven ? '#f3f4f6' : '#ffffff'
                return (
                  <tr key={row.id || i} style={{background: rowBg}}>
                    <td style={{padding: '2px 4px', textAlign: 'center', border: '1px solid #c2c6d4', fontFamily: 'monospace'}}>{row.siraNo}</td>
                    <td style={{padding: '2px 4px', border: '1px solid #c2c6d4', fontFamily: 'monospace'}}>{row.adres}</td>
                    <td style={{padding: '2px 4px', border: '1px solid #c2c6d4', fontFamily: 'monospace', color: '#00478d', fontWeight: '600'}}>{row.kod}</td>
                    <td style={{padding: '2px 4px', border: '1px solid #c2c6d4', maxWidth: '120px', overflow: 'hidden'}}>{row.ad}</td>
                    <td style={{padding: '2px 4px', textAlign: 'center', border: '1px solid #c2c6d4', fontFamily: 'monospace'}}>{row.parti}</td>
                    <td style={{padding: '2px 4px', textAlign: 'center', border: '1px solid #c2c6d4'}}>{row.durum}</td>
                    <td style={{padding: '2px 4px', textAlign: 'right', border: '1px solid #c2c6d4', fontFamily: 'monospace'}}>{row.adet1}</td>
                    <td style={{padding: '2px 4px', textAlign: 'center', border: '1px solid #c2c6d4'}}>{row.ambalaj}</td>
                    <td style={{padding: '2px 4px', textAlign: 'right', border: '1px solid #c2c6d4', fontFamily: 'monospace', minWidth: '50px'}}>
                      {blindMode ? '' : (results[row.id]?.miktar ?? row.sayim)}
                    </td>
                    <td style={{padding: '2px 4px', textAlign: 'center', border: '1px solid #c2c6d4', fontFamily: 'monospace'}}>{row.birim}</td>
                    <td style={{padding: '2px 4px', border: '1px solid #c2c6d4', fontFamily: 'monospace', fontSize: '6.5pt'}}>{row.aciklama}</td>
                  </tr>
                )
              })}
              {/* Empty rows to fill page */}
              {Array.from({length: Math.max(0, ROWS_PER_PAGE - pageRows.length)}).map((_, i) => (
                <tr key={`empty-${i}`} style={{background: i % 2 === 0 ? '#ffffff' : '#f3f4f6'}}>
                  {Array.from({length: 11}).map((_, j) => (
                    <td key={j} style={{padding: '2px 4px', border: '1px solid #c2c6d4', height: '14px'}}>&nbsp;</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Signature boxes */}
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '10px'}}>
            {['Sayan 1','Sayan 2','Sistem Girişi','Kontrol'].map(name => (
              <div key={name} style={{border: '1px solid #c2c6d4', borderRadius: '4px', padding: '6px'}}>
                <div style={{fontSize: '8pt', fontWeight: '600', color: '#00478d', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '3px'}}>
                  {name}
                </div>
                <div style={{marginBottom: '4px'}}>
                  <div style={{fontSize: '7pt', color: '#727783', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px'}}>Tarih</div>
                  <div style={{borderBottom: '1px dashed #c2c6d4', height: '16px'}}></div>
                </div>
                <div>
                  <div style={{fontSize: '7pt', color: '#727783', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px'}}>İmza</div>
                  <div style={{borderBottom: '1px dashed #c2c6d4', height: '16px'}}></div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{marginTop: '6px', fontSize: '7pt', color: '#727783', textAlign: 'center', borderTop: '1px solid #e2e2e5', paddingTop: '4px'}}>
            Bu belge sistem tarafından otomatik oluşturulmuştur. / Sınıflandırma: Serbest / Public olarak etiketlenmiştir.
          </div>
        </div>
      ))}
    </div>
  )
})

export default PrintSheet
