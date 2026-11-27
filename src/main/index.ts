import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { loadSettings, saveSettings, defaultOutputDir } from './settings'
import {
  buildWorkflow,
  comfyHealth,
  fetchImage,
  pollResult,
  queuePrompt,
} from './comfy'
import { expandPrompt, ollamaHealth, visionDescribe } from './ollama'
import { deepseekDescribeImage, deepseekHealth } from './deepseek'
import { listGallery, saveRecord } from './gallery'
import type { GenerationRequest, ServiceStatus, VisionDescription } from '../shared/types'

function effectiveOutputDir(): string {
  const s = loadSettings()
  return s.outputDir || defaultOutputDir()
}

function registerIpc(): void {
  ipcMain.handle('settings:get', () => {
    const s = loadSettings()
    if (!s.outputDir) s.outputDir = defaultOutputDir()
    return s
  })

  ipcMain.handle('settings:set', (_e, partial: Record<string, unknown>) => {
    return saveSettings(partial as never)
  })

  ipcMain.handle('services:status', async (): Promise<ServiceStatus> => {
    const s = loadSettings()
    const [comfy, ollama, deepseek] = await Promise.all([
      comfyHealth(s.comfyUrl),
      ollamaHealth(s.ollamaUrl),
      s.deepseekEnabled ? deepseekHealth(s.deepseekApiKey) : Promise.resolve(false),
    ])
    return { comfy, ollama, deepseek }
  })

  ipcMain.handle('generate:run', async (_e, req: GenerationRequest) => {
    const s = loadSettings()
    const outDir = effectiveOutputDir()
    const workflow = await buildWorkflow(s.comfyUrl, s, req)
    const promptId = await queuePrompt(s.comfyUrl, workflow)
    const result = await pollResult(s.comfyUrl, promptId)
    const img = result.images[0]
    const buf = await fetchImage(s.comfyUrl, img)
    fs.mkdirSync(outDir, { recursive: true })
    const file = `${Date.now()}-${img.filename}`
    const imagePath = path.join(outDir, file)
    fs.writeFileSync(imagePath, buf)
    const record = saveRecord(outDir, {
      mode: req.mode,
      prompt: req.prompt,
      negativePrompt: req.negativePrompt,
      width: req.width,
      height: req.height,
      steps: req.steps,
      seed: result.seed,
      checkpoint: s.checkpoint,
      imagePath,
    })
    return { ...record, dataUrl: `data:image/png;base64,${buf.toString('base64')}` }
  })

  ipcMain.handle('prompt:expand', async (_e, prompt: string) => {
    const s = loadSettings()
    return expandPrompt(s.ollamaUrl, s.ollamaModel, prompt)
  })

  ipcMain.handle('image:describe', async (_e, dataUrl: string): Promise<VisionDescription> => {
    const s = loadSettings()
    if (s.deepseekEnabled && s.deepseekApiKey) {
      try {
        return { text: await deepseekDescribeImage(s.deepseekApiKey, s.deepseekModel, dataUrl), source: 'deepseek' }
      } catch (e) {
        return { text: '', source: 'deepseek', error: String(e) }
      }
    }
    try {
      return { text: await visionDescribe(s.ollamaUrl, s.visionModel, dataUrl), source: 'ollama' }
    } catch (e) {
      return { text: '', source: 'ollama', error: String(e) }
    }
  })

  ipcMain.handle('gallery:list', () => {
    return listGallery(effectiveOutputDir())
  })

  ipcMain.handle('gallery:open', () => {
    const dir = effectiveOutputDir()
    fs.mkdirSync(dir, { recursive: true })
    return shell.openPath(dir)
  })
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    title: 'imager',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })
  if (process.env.ELECTRON_RENDERER_URL) {
    void win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
  win.webContents.on('did-finish-load', () => {
    if (process.env.IMAGER_SMOKE === '1') {
      setTimeout(async () => {
        try {
          const img = await win.webContents.capturePage()
          fs.writeFileSync(path.join(__dirname, 'smoke.png'), img.toPNG())
          console.log('[imager] smoke screenshot saved')
        } catch (e) {
          console.log('[imager] smoke screenshot failed:', e)
        }
        app.quit()
      }, 4000)
    }
  })
}

app.whenReady().then(() => {
  registerIpc()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
