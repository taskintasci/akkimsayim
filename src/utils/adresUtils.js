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
