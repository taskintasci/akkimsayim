import { useRef, useState } from 'react'

export default function FileDropZone({ onFile, accept = '.xlsx,.xls', label = 'Excel dosyasını sürükle veya seç' }) {
  const inputRef = useRef()
  const [drag, setDrag] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setDrag(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current.click()}
      className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
        drag ? 'border-primary bg-primary-fixed' : 'border-outline-variant hover:border-primary hover:bg-surface-container-low'
      }`}
    >
      <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3 block">upload_file</span>
      <p className="text-sm text-on-surface font-medium">{label}</p>
      <p className="text-xs text-on-surface-variant mt-1">Desteklenen format: {accept}</p>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => { if (e.target.files[0]) onFile(e.target.files[0]) }} />
    </div>
  )
}
