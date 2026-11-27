import { useState } from 'react'
import type { Settings } from '../../shared/types'

interface Props {
  settings: Settings
  onSave: (partial: Partial<Settings>) => Promise<void>
}

export default function SettingsTab({ settings, onSave }: Props): React.JSX.Element {
  const [form, setForm] = useState<Settings>(settings)

  function set<K extends keyof Settings>(key: K, value: Settings[K]): void {
    setForm({ ...form, [key]: value })
  }

  return (
    <div className="panel">
      <h2>Ustawienia</h2>
      <div className="grid">
        <div>
          <div className="hint">ComfyUI URL</div>
          <input type="text" value={form.comfyUrl} onChange={(e) => set('comfyUrl', e.target.value)} />
        </div>
        <div>
          <div className="hint">Ollama URL</div>
          <input type="text" value={form.ollamaUrl} onChange={(e) => set('ollamaUrl', e.target.value)} />
        </div>
      </div>
      <div className="grid">
        <div>
          <div className="hint">Checkpoint (diffusion_models)</div>
          <input type="text" value={form.checkpoint} onChange={(e) => set('checkpoint', e.target.value)} />
        </div>
        <div>
          <div className="hint">Text encoder (text_encoders)</div>
          <input type="text" value={form.textEncoder} onChange={(e) => set('textEncoder', e.target.value)} />
        </div>
        <div>
          <div className="hint">VAE</div>
          <input type="text" value={form.vae} onChange={(e) => set('vae', e.target.value)} />
        </div>
      </div>
      <div className="grid">
        <div>
          <div className="hint">Model Ollama (prompty)</div>
          <input type="text" value={form.ollamaModel} onChange={(e) => set('ollamaModel', e.target.value)} />
        </div>
        <div>
          <div className="hint">Model wizyjny (auto-opisy)</div>
          <input type="text" value={form.visionModel} onChange={(e) => set('visionModel', e.target.value)} />
        </div>
        <div>
          <div className="hint">Katalog wyjściowy</div>
          <input type="text" value={form.outputDir} onChange={(e) => set('outputDir', e.target.value)} />
        </div>
      </div>
      <div className="grid">
        <div>
          <label>
            <input type="checkbox" checked={form.deepseekEnabled} onChange={(e) => set('deepseekEnabled', e.target.checked)} /> DeepSeek (płatny, opcjonalny)
          </label>
          <input
            type="password"
            placeholder="DeepSeek API key"
            value={form.deepseekApiKey}
            onChange={(e) => set('deepseekApiKey', e.target.value)}
          />
        </div>
        <div>
          <div className="hint">Model DeepSeek</div>
          <select value={form.deepseekModel} onChange={(e) => set('deepseekModel', e.target.value)}>
            <option value="deepseek-flash">deepseek-flash</option>
            <option value="deepseek-v4-pro">deepseek-v4-pro</option>
          </select>
        </div>
      </div>
      <div className="row">
        <button onClick={() => void onSave(form)}>Zapisz ustawienia</button>
      </div>
    </div>
  )
}
