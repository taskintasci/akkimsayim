import { collection, doc, getDocs, writeBatch } from 'firebase/firestore'
import { db } from './index'

const CHUNK_SIZE = 500

export async function uploadRows(sessionId, rows) {
  const chunksRef = collection(db, 'sessions', sessionId, 'rowChunks')
  const batch = writeBatch(db)

  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunkId = String(Math.floor(i / CHUNK_SIZE)).padStart(4, '0')
    batch.set(doc(chunksRef, chunkId), { rows: rows.slice(i, i + CHUNK_SIZE) })
  }

  await batch.commit()
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
