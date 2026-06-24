import { collection, doc, getDocs, writeBatch } from 'firebase/firestore'
import { db } from './index'

// Her doküman CHUNK_SIZE satır taşır. RAPOR5 satırı ~300-400 byte;
// 500 satır ≈ 200KB, Firestore 1MB doküman limitinden güvenli uzaklıkta.
const CHUNK_SIZE = 500
// Tek writeBatch en fazla 500 işlem alır; 480 ile güvenli sınırda kalıyoruz.
const BATCH_OPS  = 480

// İşlemleri BATCH_OPS'luk gruplara bölerek commit et.
async function commitInBatches(refsOrChunks, apply) {
  for (let i = 0; i < refsOrChunks.length; i += BATCH_OPS) {
    const batch = writeBatch(db)
    refsOrChunks.slice(i, i + BATCH_OPS).forEach(item => apply(batch, item))
    await batch.commit()
  }
}

export async function uploadRows(sessionId, rows) {
  const chunksRef = collection(db, 'sessions', sessionId, 'rowChunks')

  // 1) Mevcut chunk'ları sil — eski yükleme kalıntısı yeni veriyle karışmasın
  const existing = await getDocs(chunksRef)
  if (!existing.empty) {
    await commitInBatches(existing.docs, (batch, d) => batch.delete(d.ref))
  }

  // 2) Satırları chunk'lara böl
  const chunks = []
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    chunks.push({
      id:   String(chunks.length).padStart(4, '0'),
      rows: rows.slice(i, i + CHUNK_SIZE),
    })
  }

  // 3) Chunk'ları yaz
  await commitInBatches(chunks, (batch, chunk) =>
    batch.set(doc(chunksRef, chunk.id), { rows: chunk.rows })
  )
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
