import { loadXLSX, VALID_MIMES, MAX_FILE_SIZE } from './excelImport'

function norm(val) {
  return String(val ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function validateFile(file) {
  if (file.size > MAX_FILE_SIZE) throw new Error('Dosya 30MB\'dan büyük olamaz.')
  if (file.type && !VALID_MIMES.includes(file.type)) throw new Error('Yalnızca Excel dosyaları (.xlsx, .xls) kabul edilir.')
}

async function readSheetRows(file) {
  validateFile(file)
  const XLSX = await loadXLSX()
  const buf  = await file.arrayBuffer()
  const wb   = XLSX.read(new Uint8Array(buf), { type: 'array', cellDates: false, raw: false })
  const ws   = wb.Sheets[wb.SheetNames[0]]
  return ws ? XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false }) : []
}

// SKU Masterdata: sabit sütunlar Kod / Ad / Birim, ilk satır başlık.
export async function parseSkuMasterdataFile(file) {
  const rawArr = await readSheetRows(file)
  if (rawArr.length < 2) throw new Error('Excel dosyası boş veya çok az satır içeriyor.')

  const headers = rawArr[0].map(v => norm(v))
  const kodIdx   = headers.indexOf('kod')
  const adIdx    = headers.indexOf('ad')
  const birimIdx = headers.indexOf('birim')
  if (kodIdx === -1) throw new Error('Başlık satırında "Kod" sütunu bulunamadı. Şablonu kullanın.')

  const seen = new Set()
  const items = []
  rawArr.slice(1).forEach(row => {
    const kod = String(row[kodIdx] ?? '').trim()
    if (!kod || seen.has(kod)) return
    seen.add(kod)
    items.push({
      kod,
      ad:    adIdx    !== -1 ? String(row[adIdx]    ?? '').trim() : '',
      birim: birimIdx !== -1 ? String(row[birimIdx] ?? '').trim() : '',
    })
  })
  return items
}

// Lokasyonlar: tek sütun (Lokasyon), ilk satır başlık.
export async function parseLokasyonFile(file) {
  const rawArr = await readSheetRows(file)
  if (rawArr.length < 2) throw new Error('Excel dosyası boş veya çok az satır içeriyor.')

  const seen = new Set()
  const items = []
  rawArr.slice(1).forEach(row => {
    const val = String(row[0] ?? '').trim()
    if (!val || seen.has(val)) return
    seen.add(val)
    items.push(val)
  })
  return items
}
