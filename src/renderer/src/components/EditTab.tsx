import { useRef, useState } from 'react'
import type { GenerationRequest, Settings } from '../../shared/types'
import MaskEditor from './MaskEditor'

interface Props {
  settings: Settings
}

export default function EditTab({ settings }: Props): React.JSX.Element {
  const fileRef = useRef<HTMLInputElement>(null)
  const [image, setImage] = useState<string | null>(null)
  const [mask, setMask] = useState<string | null>(null)
  const [brush, setBrush] = useState(40)
  const [prompt, setPrompt] = useState('')
  const [denoise, setDenoise] = useState(0.7)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ dataUrl: string; imagePath: string } | null>(null)
  const [description, setDescription] = useState('')

  function loadFile(file: File): void {
    const reader = new FileReader()
    reader.onload = () => {
      setImage(String(reader.result))
      setMask(null)
      setDescription('')
    }
    reader.readAsDataURL(file)
  }

  async function runInpaint(): Promise<void> {
    if (!image || !mask) {
      setError('Wczytaj zdjęcie i pomaluj maskę (pędzel).')
      return
    }
    if (!prompt.trim()) {
      setError('Podaj prompt opisujący, co ma powstać w zamalowanym obszarze.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const req: GenerationRequest = {
        mode: 'inpaint',
        prompt: prompt.trim(),
        negativePrompt: '',
        width: settings.width,
        height: settings.height,
        steps: settings.steps,
        denoise,
        inputImage: image,
        mask,
      }
      setResult(await window.imager.generate(req))
    } catch (e) {
      setError(String(e))
    } finally {
      setBusy(false)
    }
  }

  async function runImg2img(): Promise<void> {
    if (!image || !prompt.trim()) {
      setError('Wczytaj zdjęcie i podaj prompt.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const req: GenerationRequest = {
        mode: 'img2img',
        prompt: prompt.trim(),
        negativePrompt: '',
        width: settings.width,
        height: settings.height,
        steps: settings.steps,
        denoise,
        inputImage: image,
      }
      setResult(await window.imager.generate(req))
    } catch (e) {
      setError(String(e))
    } finally {
      setBusy(false)
    }
  }

  async function describe(): Promise<void> {
    if (!image) return
    setBusy(true)
    setError('')
    try {
      const res = await window.imager.describeImage(image)
      if (res.error) setError(res.error)
      else setDescription(`${res.source}: ${res.text}`)
    } catch (e) {
      setError(String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="panel">
      <h2>Edycja: img2img i inpainting z maską</h2>
      <div className="row">
        <button onClick={() => fileRef.current?.click()}>Wczytaj zdjęcie</button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])} />
        <label>
          Pędzel: {brush}px{' '}
          <input type="range" min={8} max={140} value={brush} onChange={(e) => setBrush(Number(e.target.value))} />
        </label>
        <button className="secondary" onClick={() => void describe()} disabled={!image || busy}>
          Opisz zdjęcie (AI)
        </button>
      </div>
      {description && <div className="hint">{description}</div>}
      {image && (
        <>
          <MaskEditor imageDataUrl={image} brush={brush} onMaskChange={setMask} />
          <div className="hint">Maluj miejsca do przegenerowania (czerń). {mask ? 'Maska ustawiona.' : 'Brak maski.'}</div>
        </>
      )}
      <div className="grid">
        <div>
          <div className="hint">Prompt (co ma powstać)</div>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        </div>
        <div>
          <div className="hint">Denoise (0–1)</div>
          <input type="number" min={0} max={1} step={0.05} value={denoise} onChange={(e) => setDenoise(Number(e.target.value))} />
        </div>
      </div>
      <div className="row">
        <button onClick={() => void runInpaint()} disabled={busy || !mask}>
          {busy ? 'Przetwarzam…' : 'Inpainting (przegeneruj maskę)'}
        </button>
        <button className="secondary" onClick={() => void runImg2img()} disabled={busy}>
          Img2img (cały obraz)
        </button>
      </div>
      {error && <div className="error">{error}</div>}
      {result && (
        <div className="result">
          <img src={result.dataUrl} alt="wynik" />
          <div className="hint">{result.imagePath}</div>
        </div>
      )}
    </div>
  )
}
