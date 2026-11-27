import { contextBridge, ipcRenderer } from 'electron'
import type { GalleryEntry, GenerationRequest, Settings, ServiceStatus, VisionDescription } from '../shared/types'

const api = {
  settingsGet: (): Promise<Settings> => ipcRenderer.invoke('settings:get'),
  settingsSet: (partial: Partial<Settings>): Promise<Settings> => ipcRenderer.invoke('settings:set', partial),
  servicesStatus: (): Promise<ServiceStatus> => ipcRenderer.invoke('services:status'),
  generate: (req: GenerationRequest) => ipcRenderer.invoke('generate:run', req),
  expandPrompt: (prompt: string): Promise<string> => ipcRenderer.invoke('prompt:expand', prompt),
  describeImage: (dataUrl: string): Promise<VisionDescription> => ipcRenderer.invoke('image:describe', dataUrl),
  galleryList: (): Promise<GalleryEntry[]> => ipcRenderer.invoke('gallery:list'),
  galleryOpen: (): Promise<string> => ipcRenderer.invoke('gallery:open'),
}

export type ImagerApi = typeof api

contextBridge.exposeInMainWorld('imager', api)
