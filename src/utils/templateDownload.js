import * as XLSX from 'xlsx'

const HEADERS = [
  'Sıra No.',
  'Adres',
  'Kod',
  'Ad',
  'Parti',
  'Durum',
  'Adet1',
  'Ambalaj',
  'Sayım',
  'Birim',
  'Açıklama',
]

const COL_WIDTHS = [8, 14, 16, 35, 14, 10, 8, 12, 10, 8, 25]

export function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    HEADERS,
    // 3 örnek boş satır
    Array(HEADERS.length).fill(''),
    Array(HEADERS.length).fill(''),
    Array(HEADERS.length).fill(''),
  ])

  ws['!cols'] = COL_WIDTHS.map(w => ({ wch: w }))

  // Başlık satırı stilini ekle (community SheetJS stil desteklemiyor, sadece freeze)
  ws['!freeze'] = { xSplit: 0, ySplit: 1 }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sku_Sayım_Listesi')
  XLSX.writeFile(wb, 'Akkim_Sayim_Sablonu.xlsx')
}
