import { collection, doc, getDocs, writeBatch } from 'firebase/firestore'
import { db } from './index'

// Her doküman CHUNK_SIZE öğe taşır. RAPOR5 satırı ~300-400 byte;
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

// Genel amaçlı chunked yükleme/indirme — sessions/{id}/rowChunks (rows) ve
// firmalar/{id}/skuMasterdataChunks|lokasyonChunks (items) hepsi bunu kullanır.
export async function uploadChunked(collectionRef, items, itemsKey) {
  // 1) Mevcut chunk'ları sil — eski yükleme kalıntısı yeni veriyle karışmasın
  const existing = await getDocs(collectionRef)
  if (!existing.empty) {
    await commitInBatches(existing.docs, (batch, d) => batch.delete(d.ref))
  }

  // 2) Öğeleri chunk'lara böl
  const chunks = []
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    chunks.push({
      id: String(chunks.length).padStart(4, '0'),
      slice: items.slice(i, i + CHUNK_SIZE),
    })
  }

  // 3) Chunk'ları yaz
  await commitInBatches(chunks, (batch, chunk) =>
    batch.set(doc(collectionRef, chunk.id), { [itemsKey]: chunk.slice })
  )
}

export async function downloadChunked(collectionRef, itemsKey) {
  try {
    const snap = await getDocs(collectionRef)
    const chunks = snap.docs
      .map(d => ({ id: d.id, slice: d.data()[itemsKey] || [] }))
      .sort((a, b) => a.id.localeCompare(b.id))
    return chunks.flatMap(c => c.slice)
  } catch {
    return []
  }
}

export async function uploadRows(sessionId, rows) {
  await uploadChunked(collection(db, 'sessions', sessionId, 'rowChunks'), rows, 'rows')
}

export async function downloadRows(sessionId) {
  return downloadChunked(collection(db, 'sessions', sessionId, 'rowChunks'), 'rows')
}

export async function uploadSkuMasterdata(firmaId, items) {
  await uploadChunked(collection(db, 'firmalar', firmaId, 'skuMasterdataChunks'), items, 'items')
}

export async function downloadSkuMasterdata(firmaId) {
  return downloadChunked(collection(db, 'firmalar', firmaId, 'skuMasterdataChunks'), 'items')
}

export async function uploadLokasyonlar(firmaId, items) {
  await uploadChunked(collection(db, 'firmalar', firmaId, 'lokasyonChunks'), items, 'items')
}

export async function downloadLokasyonlar(firmaId) {
  return downloadChunked(collection(db, 'firmalar', firmaId, 'lokasyonChunks'), 'items')
}
