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

// xlsx + codepage tablosunu birlikte yükle.
// SheetJS ESM build'i ($cptable) bundler ortamında codepage modülünü
// otomatik yükleyemez; Türkçe (cp1254) .xls dosyalarinda string decode
// $cptable.utils üzerinden patlayip parse'i erken kesiyordu (2168 satir).
// Resmi cozum: cpexcel.full tablosunu set_cptable ile acikca ver.
let _xlsxPromise = null
function loadXLSX() {
  if (_xlsxPromise) return _xlsxPromise
  _xlsxPromise = (async () => {
    const [XLSX, cptable] = await Promise.all([
      import('xlsx'),
      import('xlsx/dist/cpexcel.full.mjs'),
    ])
    XLSX.set_cptable(cptable)
    return XLSX
  })()
  return _xlsxPromise
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
        const wb = XLSX.read(new Uint8Array(e.target.result), {
          type: 'array',
          cellDates: false,
          raw: false,
        })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rawArr = ws
          ? XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false })
          : []

        if (rawArr.length < 2) {
          reject(new Error('Excel dosyası boş veya çok az satır içeriyor.'))
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
        })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}
