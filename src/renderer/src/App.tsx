import { useCallback, useEffect, useState } from 'react'
import type { Settings, ServiceStatus } from '../../shared/types'
import GenerateTab from './components/GenerateTab'
import EditTab from './components/EditTab'
import GalleryTab from './components/GalleryTab'
import SettingsTab from './components/SettingsTab'

type Tab = 'generate' | 'edit' | 'gallery' | 'settings'

export default function App(): React.JSX.Element {
  const [tab, setTab] = useState<Tab>('generate')
  const [settings, setSettings] = useState<Settings | null>(null)
  const [status, setStatus] = useState<ServiceStatus | null>(null)

  useEffect(() => {
    void window.imager.settingsGet().then(setSettings)
    void window.imager.servicesStatus().then(setStatus)
  }, [])

  const updateSettings = useCallback(async (partial: Partial<Settings>) => {
    const merged = await window.imager.settingsSet(partial)
    setSettings(merged)
    setStatus(await window.imager.servicesStatus())
  }, [])

  const statusLine = settings
    ? `comfy: ${status?.comfy ? 'OK' : '—'} · ollama: ${status?.ollama ? 'OK' : '—'} · deepseek: ${
        settings.deepseekEnabled ? (status?.deepseek ? 'OK' : '—') : 'wył.'
      }`
    : 'ładowanie…'

  if (!settings) return <div className="loading">ładowanie…</div>

  const tabs: { id: Tab; label: string }[] = [
    { id: 'generate', label: 'Generacja' },
    { id: 'edit', label: 'Edycja (img2img + maska)' },
    { id: 'gallery', label: 'Galeria' },
    { id: 'settings', label: 'Ustawienia' },
  ]

  return (
    <div className="app">
      <nav className="tabs">
        {tabs.map((t) => (
          <button key={t.id} className={tab === t.id ? 'tab active' : 'tab'} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
        <span className="status">{statusLine}</span>
      </nav>
      <main className="content">
        {tab === 'generate' && <GenerateTab settings={settings} />}
        {tab === 'edit' && <EditTab settings={settings} />}
        {tab === 'gallery' && <GalleryTab />}
        {tab === 'settings' && <SettingsTab settings={settings} onSave={updateSettings} />}
      </main>
    </div>
  )
}
