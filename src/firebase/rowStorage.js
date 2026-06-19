import { ref, uploadString, getBytes } from 'firebase/storage'
import { storage } from './index'

export async function uploadRows(sessionId, rows) {
  const storageRef = ref(storage, `sessions/${sessionId}/rows.json`)
  await uploadString(storageRef, JSON.stringify(rows), 'raw', { contentType: 'application/json' })
}

export async function downloadRows(sessionId) {
  try {
    const storageRef = ref(storage, `sessions/${sessionId}/rows.json`)
    const bytes = await getBytes(storageRef)
    const text = new TextDecoder().decode(bytes)
    return JSON.parse(text)
  } catch {
    return []
  }
}
