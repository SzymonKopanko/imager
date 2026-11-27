import { useState } from 'react'
import type { GalleryEntry, GenerationRequest, Settings } from '../../shared/types'

interface Props {
  settings: Settings
}

export default function GenerateTab({ settings }: Props): React.JSX.Element {
  const [prompt, setPrompt] = useState('')
  const [negative, setNegative] = useState('')
  const [width, setWidth] = useState(settings.width)
  const [height, setHeight] = useState(settings.height)
  const [steps, setSteps] = useState(settings.steps)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<GalleryEntry | null>(null)

  async function run(): Promise<void> {
    if (!prompt.trim()) {
      setError('Podaj prompt.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const req: GenerationRequest = {
        mode: 'txt2img',
        prompt: prompt.trim(),
        negativePrompt: negative.trim(),
        width,
        height,
        steps,
      }
      const res = await window.imager.generate(req)
      setResult(res)
    } catch (e) {
      setError(String(e))
    } finally {
      setBusy(false)
    }
  }

  async function expand(): Promise<void> {
    if (!prompt.trim()) return
    setBusy(true)
    setError('')
    try {
      setPrompt(await window.imager.expandPrompt(prompt.trim()))
    } catch (e) {
      setError(String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="panel">
      <h2>Generacja (txt2img)</h2>
      <textarea placeholder="Prompt (PL lub EN)…" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      <div className="grid">
        <div>
          <div className="hint">Negatywny prompt</div>
          <input type="text" value={negative} onChange={(e) => setNegative(e.target.value)} />
        </div>
        <div>
          <div className="hint">Szerokość</div>
          <input type="number" min={512} max={2048} step={64} value={width} onChange={(e) => setWidth(Number(e.target.value))} />
        </div>
        <div>
          <div className="hint">Wysokość</div>
          <input type="number" min={512} max={2048} step={64} value={height} onChange={(e) => setHeight(Number(e.target.value))} />
        </div>
        <div>
          <div className="hint">Kroki</div>
          <input type="number" min={1} max={30} value={steps} onChange={(e) => setSteps(Number(e.target.value))} />
        </div>
      </div>
      <div className="row">
        <button onClick={() => void run()} disabled={busy}>
          {busy ? 'Generuję…' : 'Generuj'}
        </button>
        <button className="secondary" onClick={() => void expand()} disabled={busy}>
          Rozszerz prompt (Ollama)
        </button>
      </div>
      {error && <div className="error">{error}</div>}
      {result && (
        <div className="result">
          <img src={result.dataUrl} alt={result.record.prompt} />
          <div className="hint">seed: {result.record.seed} · {result.record.width}×{result.record.height} · {result.record.imagePath}</div>
        </div>
      )}
    </div>
  )
}
