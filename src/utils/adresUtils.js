export function parseAdres(adres) {
  const parts = String(adres || '').split('-')
  return { raf: parts[0] || '', sira: parts[1] || '', kolon: parts[2] || '', goz: parts[3] || '' }
}

export function sortRows(rows, sortType) {
  return [...rows].sort((a, b) => {
    const pa = parseAdres(a.adres), pb = parseAdres(b.adres)
    if (pa.raf !== pb.raf) return pa.raf.localeCompare(pb.raf)
    if (pa.sira !== pb.sira) return pa.sira.localeCompare(pb.sira)
    if (sortType === '2') {
      if (pa.goz !== pb.goz) return pa.goz.localeCompare(pb.goz)
      return pa.kolon.localeCompare(pb.kolon)
    }
    if (pa.kolon !== pb.kolon) return pa.kolon.localeCompare(pb.kolon)
    return pa.goz.localeCompare(pb.goz)
  })
}

export function getUniqueAdresValues(rows) {
  const rafSet = new Set(), siraSet = new Set(), kolonSet = new Set(), gozSet = new Set()
  rows.forEach(r => {
    const p = parseAdres(r.adres)
    if (p.raf) rafSet.add(p.raf)
    if (p.sira) siraSet.add(p.sira)
    if (p.kolon) kolonSet.add(p.kolon)
    if (p.goz) gozSet.add(p.goz)
  })
  return {
    raflar: [...rafSet].sort(),
    siralar: [...siraSet].sort(),
    kolonlar: [...kolonSet].sort((a, b) => Number(a) - Number(b)),
    gozler: [...gozSet].sort((a, b) => Number(a) - Number(b)),
  }
}

/**
 * Simetrik (mutual) cascade filtre seçenekleri hesaplar.
 * Her boyutun seçenekleri, o boyutun filtresi HARİÇ diğer tüm aktif filtreler
 * uygulanmış veriden türetilir.
 *
 * filters: { filterSearch, filterDurum, filterKategori, filterPalet?,
 *            filterRaf, filterSira, filterKolon, filterGoz, filterGirisGun? }
 */
export function computeFilterOptions(sourceRows, filters) {
  const {
    filterSearch = '',
    filterDurum = [], filterKategori = [], filterPalet,
    filterRaf = [], filterSira = [], filterKolon = [], filterGoz = [],
    filterGirisGun = [],
  } = filters

  const hasPalet = filterPalet !== undefined

  function apply(rows, exclude) {
    const q = filterSearch.trim().toLowerCase()
    return rows.filter(r => {
      if (q && !(r.kod?.toLowerCase().includes(q) || r.ad?.toLowerCase().includes(q) || r.parti?.toLowerCase().includes(q))) return false
      if (exclude !== 'durum'    && filterDurum.length > 0    && !filterDurum.includes(r.durum))       return false
      if (exclude !== 'kategori' && filterKategori.length > 0 && !filterKategori.includes(r.kategori)) return false
      if (hasPalet && exclude !== 'palet' && filterPalet.length > 0 && !filterPalet.includes(r.partiEk)) return false
      if (exclude !== 'girisGun' && filterGirisGun.length > 0) {
        const g = Number(r.girisGun)
        const ok = filterGirisGun.some(range => {
          if (range.startsWith('0-30')   && !isNaN(g) && g > 0 && g <= 30)   return true
          if (range.startsWith('31-90')  && !isNaN(g) && g >= 31 && g <= 90)  return true
          if (range.startsWith('91-180') && !isNaN(g) && g >= 91 && g <= 180) return true
          if (range.startsWith('180+')   && !isNaN(g) && g > 180)             return true
          return false
        })
        if (!ok) return false
      }
      const p = parseAdres(r.adres)
      if (exclude !== 'raf'   && filterRaf.length > 0   && !filterRaf.includes(p.raf))     return false
      if (exclude !== 'sira'  && filterSira.length > 0  && !filterSira.includes(p.sira))   return false
      if (exclude !== 'kolon' && filterKolon.length > 0 && !filterKolon.includes(p.kolon)) return false
      if (exclude !== 'goz'   && filterGoz.length > 0   && !filterGoz.includes(p.goz))     return false
      return true
    })
  }

  const result = {
    kategoriler: [...new Set(apply(sourceRows, 'kategori').map(r => r.kategori).filter(Boolean))].sort(),
    raflar:      [...new Set(apply(sourceRows, 'raf').map(r => parseAdres(r.adres).raf).filter(Boolean))].sort(),
    siralar:     [...new Set(apply(sourceRows, 'sira').map(r => parseAdres(r.adres).sira).filter(Boolean))].sort(),
    kolonlar:    [...new Set(apply(sourceRows, 'kolon').map(r => parseAdres(r.adres).kolon).filter(Boolean))].sort((a, b) => Number(a) - Number(b)),
    gozler:      [...new Set(apply(sourceRows, 'goz').map(r => parseAdres(r.adres).goz).filter(Boolean))].sort((a, b) => Number(a) - Number(b)),
  }

  if (hasPalet) {
    result.paletler = [...new Set(apply(sourceRows, 'palet').map(r => r.partiEk).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'tr', { numeric: true }))
  }

  return result
}
