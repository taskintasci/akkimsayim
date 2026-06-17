import * as XLSX from 'xlsx'

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function norm(val) {
  return String(val ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function toNum(val) {
  if (val === undefined || val === null || val === '') return ''
  return String(val).replace(',', '.')
}

// ─── Format 1: Sku_Sayım_Listesi ────────────────────────────────────────────
const SKU_MAP = {
  'sira no.' : 'siraNo',
  'sıra no.' : 'siraNo',
  'adres'    : 'adres',
  'kod'      : 'kod',
  'ad'       : 'ad',
  'parti'    : 'parti',
  'durum'    : 'durum',
  'adet1'    : 'adet1',
  'adet 1'   : 'adet1',
  'ambalaj'  : 'ambalaj',
  'sayım'    : 'sayim',
  'sayim'    : 'sayim',
  'birim'    : 'birim',
  'birim 1'  : 'birim',
  'açıklama' : 'aciklama',
  'aciklama' : 'aciklama',
}

// ─── Format 2: RAPOR5 ───────────────────────────────────────────────────────
// RAPOR5 sütunları → iç alan adı
const RAPOR5_MAP = {
  'adres'              : 'adres',
  'kod'                : 'kod',
  'ad'                 : 'ad',
  'parti'              : 'parti',
  'durum'              : 'durum',
  'palet adet'         : 'adet1',
  'palet tip'          : 'ambalaj',
  // Birincil miktar: Son Kırılım (gerçek stok miktarı)
  'son kırılım miktar' : 'sayim',
  'son kirilim miktar' : 'sayim',
  'son kırılım birim'  : 'birim',
  'son kirilim birim'  : 'birim',
  // Yedek: Son Kırılım yoksa Adet 2 / Birim 2
  'adet 2'             : 'sayim_yedek',
  'birim 2'            : 'birim_yedek',
  // Açıklama olarak barkod
  'barkod'             : 'aciklama',
}

// RAPOR5 tespiti: "Depo Kod", "Palet Tip" veya "Son Kırılım" sütunu varsa
function detectFormat(headerValues) {
  const norms = headerValues.map(norm)
  if (
    norms.some(h => h.includes('depo kod')) ||
    norms.some(h => h.includes('palet tip')) ||
    norms.some(h => h.includes('son k'))
  ) return 'rapor5'
  return 'sku'
}

// Excel başlık satırı → { excelKey: internalField } haritası
function buildColMap(headerRow, fieldMap) {
  const result = {}
  Object.keys(headerRow).forEach(excelKey => {
    const field = fieldMap[norm(headerRow[excelKey])]
    if (field) result[excelKey] = field
  })
  return result
}

function mapRow(rawRow, colMap, index, format) {
  const mapped = { id: makeId(), siraNo: index + 1 }

  Object.entries(colMap).forEach(([excelKey, field]) => {
    const val = rawRow[excelKey] ?? ''

    if (field === 'sayim_yedek') {
      if (!mapped.sayim) mapped.sayim = toNum(val)
    } else if (field === 'birim_yedek') {
      if (!mapped.birim) mapped.birim = String(val)
    } else if (field === 'sayim' || field === 'adet1') {
      mapped[field] = toNum(val)
    } else {
      mapped[field] = String(val)
    }
  })

  // Sıra no SKU formatında satırdan gelebilir
  if (format === 'sku' && mapped.siraNo && mapped.siraNo !== index + 1) {
    // koru
  } else {
    mapped.siraNo = index + 1
  }

  return mapped
}

export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, {
          type: 'array',
          cellDates: true,
          bookVBA: false,
        })

        const ws = wb.Sheets[wb.SheetNames[0]]
        const raw = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false })

        if (raw.length === 0) {
          reject(new Error('Excel dosyası boş'))
          return
        }

        const headerValues = Object.values(raw[0])
        const format = detectFormat(headerValues)
        const fieldMap = format === 'rapor5' ? RAPOR5_MAP : SKU_MAP
        const colMap = buildColMap(raw[0], fieldMap)

        const rows = raw
          .map((rawRow, i) => mapRow(rawRow, colMap, i, format))
          // Kodu olmayan satırları filtrele (RAPOR5'te başlık tekrarları olabilir)
          .filter(r => r.kod && String(r.kod).trim())

        resolve({ rows, format })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}
