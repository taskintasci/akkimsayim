import * as XLSX from 'xlsx'

// uuid yerine basit id üreteci
function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

// Sütun adlarını normalize et (Türkçe karakter + boşluk farklılıklarına karşı)
const COL_MAP = {
  'sira no.'  : 'siraNo',
  'sıra no.'  : 'siraNo',
  'adres'     : 'adres',
  'kod'       : 'kod',
  'ad'        : 'ad',
  'parti'     : 'parti',
  'durum'     : 'durum',
  'adet1'     : 'adet1',
  'adet 1'    : 'adet1',
  'ambalaj'   : 'ambalaj',
  'sayım'     : 'sayim',
  'sayim'     : 'sayim',
  'birim'     : 'birim',
  'birim 1'   : 'birim',
  'açıklama'  : 'aciklama',
  'aciklama'  : 'aciklama',
}

function mapHeaders(headerRow) {
  const result = {}
  Object.keys(headerRow).forEach(key => {
    const normalized = String(headerRow[key]).trim().toLowerCase()
    const field = COL_MAP[normalized]
    if (field) result[key] = field
  })
  return result
}

export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array', cellDates: true })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const raw = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false })

        if (raw.length === 0) {
          reject(new Error('Excel dosyası boş'))
          return
        }

        // Header mapping
        const headerMap = mapHeaders(raw[0])

        const rows = raw.map((rawRow, i) => {
          const mapped = { id: makeId() }
          // Mapped keys
          Object.entries(headerMap).forEach(([excelKey, field]) => {
            mapped[field] = rawRow[excelKey] ?? ''
          })
          // Fallback: satır numarasını sıra no olarak kullan
          if (!mapped.siraNo) mapped.siraNo = i + 1
          // Sayım sayısal normalizasyonu (virgüllü Türkçe sayılar)
          if (mapped.sayim) {
            mapped.sayim = String(mapped.sayim).replace(',', '.')
          }
          if (mapped.adet1) {
            mapped.adet1 = String(mapped.adet1).replace(',', '.')
          }
          return mapped
        })

        resolve(rows)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}
