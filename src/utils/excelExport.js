export async function exportResults(rows, results, session) {
  const { default: ExcelJS } = await import('exceljs')

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Akkim Sayım'
  workbook.created = new Date()

  const ws = workbook.addWorksheet('Sayım Sonuçları')

  ws.columns = [
    { header: 'Sıra No.',     key: 'siraNo',   width: 8 },
    { header: 'Adres',        key: 'adres',    width: 14 },
    { header: 'Kod',          key: 'kod',      width: 16 },
    { header: 'Ad',           key: 'ad',       width: 35 },
    { header: 'Parti',        key: 'parti',    width: 14 },
    { header: 'Durum',        key: 'durum',    width: 10 },
    { header: 'Adet1',        key: 'adet1',    width: 8 },
    { header: 'Ambalaj',      key: 'ambalaj',  width: 12 },
    { header: 'Sistem Mikt.', key: 'sayim',    width: 12 },
    { header: 'Sayılan',      key: 'sayilan',  width: 12 },
    { header: 'Fark',         key: 'fark',     width: 10 },
    { header: 'Birim',        key: 'birim',    width: 8 },
    { header: 'Durum',        key: 'status',   width: 12 },
    { header: 'Not',          key: 'notlar',   width: 25 },
  ]

  ws.getRow(1).eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1C1E' } }
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 10 }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
  })
  ws.getRow(1).height = 18

  rows.forEach((row, i) => {
    const res    = results[row.id] || {}
    const sayilan = res.miktar !== undefined && res.miktar !== '' ? Number(res.miktar) : null
    const sistem  = row.sayim !== '' ? Number(String(row.sayim).replace(',', '.')) : null
    const fark    = sayilan !== null && sistem !== null ? sayilan - sistem : null

    const wsRow = ws.addRow({
      siraNo: row.siraNo, adres: row.adres, kod: row.kod, ad: row.ad,
      parti: row.parti, durum: row.durum, adet1: row.adet1, ambalaj: row.ambalaj,
      sayim: sistem, sayilan, fark, birim: row.birim,
      status: res.status || '', notlar: res.notlar || '',
    })

    const rowNum = wsRow.number
    if (fark !== null && fark !== 0) {
      ws.getRow(rowNum).eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } }
      })
    } else if (res.status === 'Onaylandı') {
      ws.getRow(rowNum).eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EDDA' } }
      })
    } else if (i % 2 === 1) {
      ws.getRow(rowNum).eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }
      })
    }
  })

  ws.views = [{ state: 'frozen', ySplit: 1 }]

  const buffer = await workbook.xlsx.writeBuffer()
  const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url    = URL.createObjectURL(blob)
  const a      = document.createElement('a')
  a.href       = url
  a.download   = `Akkim_Sayim_Sonuclari_${new Date().toISOString().slice(0, 10)}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
