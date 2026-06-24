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

// ─── SKU_Sayım_Listesi sütun haritası ───────────────────────────────────────
const SKU_MAP = {
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

// ─── RAPOR5 sütun haritası ───────────────────────────────────────────────────
const RAPOR5_MAP = {
  'adres'              : 'adres',
  'kod'                : 'kod',
  'ad'                 : 'ad',
  'parti'              : 'parti',
  'durum'              : 'durum',
  'adet 1'             : 'adet1',
  'birim 1'            : 'ambalaj',
  'son kırılım miktar' : 'sayim',
  'son kirilim miktar' : 'sayim',
  'son kırılım birim'  : 'birim',
  'son kirilim birim'  : 'birim',
  'adet 2'             : 'sayim_yedek',
  'birim 2'            : 'birim_yedek',
  'barkod'             : 'aciklama',
  'giriş tarih'        : 'girisTarih',
  'giris tarih'        : 'girisTarih',
  'giriş tarihi'       : 'girisTarih',
  'giris tarihi'       : 'girisTarih',
  'giriş gün'          : 'girisGun',
  'giris gun'          : 'girisGun',
  'giriş gun'          : 'girisGun',
  'giris gün'          : 'girisGun',
  'giriş gün sayısı'   : 'girisGun',
  'giris gun sayisi'   : 'girisGun',
  'kategori'           : 'kategori',
  'ürün kategorisi'    : 'kategori',
  'urun kategorisi'    : 'kategori',
  'kategori kodu'      : 'kategori',
  'ürün grubu'         : 'kategori',
  'urun grubu'         : 'kategori',
  'parti ek'           : 'partiEk',
  'partiek'            : 'partiEk',
  'palet no'           : 'partiEk',
  'palet no.'          : 'partiEk',
}

// RAPOR5 ayırt edici başlıkları
const RAPOR5_SIGNATURES = ['depo kod', 'palet tip', 'son k', 'son kırılım', 'son kirilim']

function isRapor5(headers) {
  const norms = headers.map(norm)
  return RAPOR5_SIGNATURES.some(sig => norms.some(h => h.includes(sig)))
}

// Her iki format için: header adı → internal field
function buildColMap(headers, fieldMap) {
  const colMap = {}
  headers.forEach((header, colIdx) => {
    const field = fieldMap[norm(header)]
    if (field) colMap[colIdx] = field
  })
  return colMap
}

function mapDataRow(rowArr, colMap, siraNo) {
  const mapped = { id: makeId(), siraNo }

  Object.entries(colMap).forEach(([colIdxStr, field]) => {
    const val = rowArr[Number(colIdxStr)] ?? ''

    if (field === 'sayim_yedek') {
      if (!mapped.sayim) mapped.sayim = toNum(val)
    } else if (field === 'birim_yedek') {
      if (!mapped.birim) mapped.birim = String(val)
    } else if (field === 'sayim' || field === 'adet1') {
      mapped[field] = toNum(val)
    } else if (field === 'siraNo') {
      mapped.siraNo = val ? Number(val) || siraNo : siraNo
    } else {
      mapped[field] = String(val)
    }
  })

  return mapped
}

const VALID_MIMES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/octet-stream',
]
const MAX_FILE_SIZE = 30 * 1024 * 1024 // 30MB

// SheetJS standalone (full) build'i origin'den yükle.
// Vite/Rollup ile bundle edilen xlsx, codepage modülünü tarayıcıya
// taşıyamadığı için büyük eski .xls (BIFF) dosyalarını erken kesiyordu.
// Full build codepage'i içinde gömülü taşır → tam parse.
let _xlsxPromise = null
function loadXLSX() {
  if (typeof window !== 'undefined' && window.XLSX) return Promise.resolve(window.XLSX)
  if (_xlsxPromise) return _xlsxPromise
  _xlsxPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = `${import.meta.env.BASE_URL}vendor/xlsx.full.min.js`
    s.async = true
    s.onload = () => {
      if (window.XLSX) resolve(window.XLSX)
      else reject(new Error('XLSX global yüklenemedi'))
    }
    s.onerror = () => reject(new Error('xlsx.full.min.js yüklenemedi'))
    document.head.appendChild(s)
  })
  return _xlsxPromise
}

// ArrayBuffer → binary string (xlsx type:'binary' için)
function ab2bin(buf) {
  const bytes = new Uint8Array(buf)
  let s = ''
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    s += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK))
  }
  return s
}

// Bir workbook'tan 2D satır dizisini çıkar; ws['!ref'] eksikse gerçek
// son satırı hücrelerden bulup genişlet.
function wbToRows(XLSX, wb) {
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) return { rawArr: [], ref: '(sheet yok)' }

  const ref0 = ws['!ref'] || '(ref yok)'

  // !ref gerçek veriden küçükse (SAP/BIFF) hücreleri tarayıp genişlet
  if (ws['!ref']) {
    let maxRow = 0
    for (const k of Object.keys(ws)) {
      if (k[0] === '!') continue
      const r = XLSX.utils.decode_cell(k).r
      if (r > maxRow) maxRow = r
    }
    const range = XLSX.utils.decode_range(ws['!ref'])
    if (maxRow > range.e.r) {
      range.e.r = maxRow
      ws['!ref'] = XLSX.utils.encode_range(range)
    }
  }

  const rawArr = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false })
  return { rawArr, ref: ref0, refFixed: ws['!ref'] }
}

export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_FILE_SIZE) {
      reject(new Error('Dosya 30MB\'dan büyük olamaz.'))
      return
    }
    if (file.type && !VALID_MIMES.includes(file.type)) {
      reject(new Error('Yalnızca Excel dosyaları (.xlsx, .xls) kabul edilir.'))
      return
    }
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const XLSX = await loadXLSX()
        const buf = e.target.result

        // Birden fazla okuma stratejisi dene; en çok satır vereni kullan.
        const attempts = []
        const tryRead = (label, input, opts) => {
          try {
            const wb = XLSX.read(input, opts)
            const { rawArr, ref, refFixed } = wbToRows(XLSX, wb)
            attempts.push({ label, count: rawArr.length, ref, refFixed, rawArr })
          } catch (err) {
            attempts.push({ label, count: -1, error: err.message })
          }
        }

        tryRead('array',  new Uint8Array(buf), { type: 'array',  cellDates: false, raw: false })
        tryRead('binary', ab2bin(buf),         { type: 'binary', cellDates: false, raw: false })

        // En çok satır veren stratejiyi seç
        const best = attempts.reduce((a, b) => (b.count > a.count ? b : a), { count: -1 })
        const diag = attempts
          .map(a => `${a.label}:${a.count >= 0 ? a.count : 'HATA'}`)
          .join(' | ') + (best.ref ? ` [ref ${best.ref}→${best.refFixed}]` : '')

        const rawArr = best.rawArr || []
        if (rawArr.length < 2) {
          reject(new Error('Excel dosyası boş veya çok az satır içeriyor. ' + diag))
          return
        }

        // Başlık satırını bul: ilk N satır içinde en çok alan map eden satır
        let headerRowIdx = 0
        let bestScore = 0
        let bestFormat = 'sku'
        let bestFieldMap = SKU_MAP

        for (let i = 0; i < Math.min(rawArr.length, 6); i++) {
          const row = rawArr[i]
          const headers = row.map(v => norm(String(v ?? '')))

          const isR5 = isRapor5(headers)
          const fieldMap = isR5 ? RAPOR5_MAP : SKU_MAP

          const score = headers.filter(h => fieldMap[h]).length
          if (score > bestScore) {
            bestScore = score
            headerRowIdx = i
            bestFormat = isR5 ? 'rapor5' : 'sku'
            bestFieldMap = fieldMap
          }
        }

        if (bestScore === 0) {
          reject(new Error(
            'Tanınan sütun bulunamadı. Lütfen RAPOR5.xls veya Sku_Sayım_Listesi.xlsx yükleyin.'
          ))
          return
        }

        const headerRow = rawArr[headerRowIdx]
        const colMap = buildColMap(headerRow, bestFieldMap)

        let rowNum = 0
        const rows = rawArr
          .slice(headerRowIdx + 1)        // başlık satırından sonraki satırlar
          .map(rowArr => {
            rowNum++
            return mapDataRow(rowArr, colMap, rowNum)
          })
          .filter(r => r.kod && String(r.kod).trim())

        resolve({
          rows,
          format: bestFormat,
          rawCount: rawArr.length - (headerRowIdx + 1),
          diag,
        })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}
