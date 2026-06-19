import { ref, uploadString, getDownloadURL } from 'firebase/storage'
import { storage } from './index'

export async function uploadRows(sessionId, rows) {
  const storageRef = ref(storage, `sessions/${sessionId}/rows.json`)
  await uploadString(storageRef, JSON.stringify(rows), 'raw', { contentType: 'application/json' })
  return `sessions/${sessionId}/rows.json`
}

export async function downloadRows(sessionId) {
  try {
    const storageRef = ref(storage, `sessions/${sessionId}/rows.json`)
    const url = await getDownloadURL(storageRef)
    const res = await fetch(url)
    return await res.json()
  } catch {
    return []
  }
}
