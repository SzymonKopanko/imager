import { useCallback, useEffect, useState } from 'react'
import type { GalleryEntry } from '../../shared/types'

export default function GalleryTab(): React.JSX.Element {
  const [items, setItems] = useState<GalleryEntry[]>([])

  const refresh = useCallback(() => {
    void window.imager.galleryList().then(setItems)
  }, [])

  useEffect(refresh, [refresh])

  return (
    <div className="panel">
      <div className="row">
        <h2 style={{ margin: 0 }}>Galeria ({items.length})</h2>
        <button className="secondary" onClick={() => void window.imager.galleryOpen()}>
          Otwórz folder
        </button>
      </div>
      {items.length === 0 && <div className="hint">Brak generacji. Wygeneruj coś w zakładce Generacja.</div>}
      <div className="gallery">
        {items.map((it) => (
          <div className="gallery-item" key={it.record.id}>
            <img src={it.dataUrl} alt={it.record.prompt} loading="lazy" />
            <div className="meta">
              {it.record.mode} · {it.record.width}×{it.record.height} · seed {it.record.seed}
              {'\n'}
              {it.record.prompt.slice(0, 180)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
