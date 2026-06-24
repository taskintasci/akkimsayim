import { collection, doc, getDocs, writeBatch } from 'firebase/firestore'
import { db } from './index'

// 150 satır/doküman → ~75KB, Firestore 1MB limitinden güvenli uzaklıkta
const CHUNK_SIZE = 150
// Tek writeBatch max 500 op; 480 bırakıyoruz
const BATCH_OPS  = 480

export async function uploadRows(sessionId, rows) {
  const chunksRef = collection(db, 'sessions', sessionId, 'rowChunks')

  // 1) Mevcut chunk'ları sil — eski yükleme kalıntısı olmadan temiz yükle
  const existing = await getDocs(chunksRef)
  if (!existing.empty) {
    const delBatch = writeBatch(db)
    existing.docs.forEach(d => delBatch.delete(d.ref))
    await delBatch.commit()
  }

  // 2) Satırları chunk'lara böl
  const chunks = []
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    chunks.push({
      id:   String(chunks.length).padStart(4, '0'),
      rows: rows.slice(i, i + CHUNK_SIZE),
    })
  }

  // 3) Chunk'ları BATCH_OPS'luk gruplar halinde yaz
  for (let b = 0; b < chunks.length; b += BATCH_OPS) {
    const batch = writeBatch(db)
    chunks.slice(b, b + BATCH_OPS).forEach(chunk => {
      batch.set(doc(chunksRef, chunk.id), { rows: chunk.rows })
    })
    await batch.commit()
  }
}

export async function downloadRows(sessionId) {
  try {
    const snap = await getDocs(collection(db, 'sessions', sessionId, 'rowChunks'))
    const chunks = snap.docs
      .map(d => ({ id: d.id, rows: d.data().rows }))
      .sort((a, b) => a.id.localeCompare(b.id))
    return chunks.flatMap(c => c.rows)
  } catch {
    return []
  }
}
