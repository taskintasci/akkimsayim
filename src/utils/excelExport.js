// ExcelJS ile renkli export — exceljs paketi gerektirir
// npm install exceljs komutu ile kurulur

export async function exportResults(rows, results, session) {
  try {
    // Dinamik import — paket yoksa hata verir
    const ExcelJS = (await import('exceljs')).default

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Akkim Sayım'
    workbook.created = new Date()

    const ws = workbook.addWorksheet('Sayım Sonuçları')

    // Sütun tanımları
    ws.columns = [
      { header: 'Sıra No.',    key: 'siraNo',   width: 8 },
      { header: 'Adres',       key: 'adres',    width: 14 },
      { header: 'Kod',         key: 'kod',      width: 16 },
      { header: 'Ad',          key: 'ad',       width: 35 },
      { header: 'Parti',       key: 'parti',    width: 14 },
      { header: 'Durum',       key: 'durum',    width: 10 },
      { header: 'Adet1',       key: 'adet1',    width: 8 },
      { header: 'Ambalaj',     key: 'ambalaj',  width: 12 },
      { header: 'Sistem Mikt.',key: 'sayim',    width: 12 },
      { header: 'Sayılan',     key: 'sayilan',  width: 12 },
      { header: 'Fark',        key: 'fark',     width: 10 },
      { header: 'Birim',       key: 'birim',    width: 8 },
      { header: 'Durum',       key: 'status',   width: 12 },
      { header: 'Not',         key: 'notlar',   width: 25 },
    ]

    // Başlık satırı stili
    ws.getRow(1).eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1C1E' } }
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 10 }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })
    ws.getRow(1).height = 18

    // Veri satırları
    rows.forEach((row, i) => {
      const res = results[row.id] || {}
      const sayilan = res.miktar !== undefined && res.miktar !== '' ? Number(res.miktar) : null
      const sistem = row.sayim !== '' ? Number(String(row.sayim).replace(',', '.')) : null
      const fark = sayilan !== null && sistem !== null ? sayilan - sistem : null

      const wsRow = ws.addRow({
        siraNo:  row.siraNo,
        adres:   row.adres,
        kod:     row.kod,
        ad:      row.ad,
        parti:   row.parti,
        durum:   row.durum,
        adet1:   row.adet1,
        ambalaj: row.ambalaj,
        sayim:   sistem,
        sayilan: sayilan,
        fark:    fark,
        birim:   row.birim,
        status:  res.status || '',
        notlar:  res.notlar || '',
      })

      // Satır renklendirme
      const rowNum = wsRow.number
      if (fark !== null && fark !== 0) {
        // Fark var — sarı
        ws.getRow(rowNum).eachCell(cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } }
        })
      } else if (res.status === 'Onaylandı') {
        // Onaylandı — açık yeşil
        ws.getRow(rowNum).eachCell(cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EDDA' } }
        })
      } else if (i % 2 === 1) {
        // Zebra
        ws.getRow(rowNum).eachCell(cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }
        })
      }
    })

    // Freeze header
    ws.views = [{ state: 'frozen', ySplit: 1 }]

    // Dosyayı indir
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Akkim_Sayim_Sonuclari_${new Date().toISOString().slice(0,10)}.xlsx`
    a.click()
    URL.revokeObjectURL(url)

  } catch (err) {
    console.warn('ExcelJS yüklenemedi, SheetJS fallback kullanılıyor:', err)
    // SheetJS fallback (renksiz)
    const { default: XLSX } = await import('xlsx')
    const data = [
      ['Sıra No.','Adres','Kod','Ad','Parti','Durum','Adet1','Ambalaj','Sistem Mikt.','Sayılan','Fark','Birim','Not'],
      ...rows.map(row => {
        const res = results[row.id] || {}
        const sayilan = res.miktar ?? ''
        const sistem = row.sayim
        const fark = sayilan !== '' && sistem !== '' ? Number(sayilan) - Number(String(sistem).replace(',','.')) : ''
        return [row.siraNo, row.adres, row.kod, row.ad, row.parti, row.durum, row.adet1, row.ambalaj, sistem, sayilan, fark, row.birim, res.notlar || '']
      })
    ]
    const ws = XLSX.utils.aoa_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sayım Sonuçları')
    XLSX.writeFile(wb, `Akkim_Sayim_Sonuclari_${new Date().toISOString().slice(0,10)}.xlsx`)
  }
}
