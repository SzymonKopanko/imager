import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import type { GalleryEntry, GenerationMode, GenerationRecord } from '../shared/types'

const HISTORY_FILE = 'history.json'

function outDir(settingsOutputDir: string): string {
  return settingsOutputDir || path.join(process.cwd(), 'output')
}

export function historyPath(outputDir: string): string {
  return path.join(outputDir, HISTORY_FILE)
}

export function readHistory(outputDir: string): GenerationRecord[] {
  try {
    const raw = fs.readFileSync(historyPath(outputDir), 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeHistory(outputDir: string, records: GenerationRecord[]): void {
  fs.mkdirSync(outputDir, { recursive: true })
  fs.writeFileSync(historyPath(outputDir), JSON.stringify(records, null, 2), 'utf8')
}

export function saveRecord(
  outputDir: string,
  data: {
    mode: GenerationMode
    prompt: string
    negativePrompt: string
    width: number
    height: number
    steps: number
    seed: number
    checkpoint: string
    imagePath: string
  }
): GenerationRecord {
  const record: GenerationRecord = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...data,
  }
  const records = readHistory(outputDir)
  records.unshift(record)
  writeHistory(outputDir, records.slice(0, 500))
  return record
}

export function listGallery(settingsOutputDir: string): GalleryEntry[] {
  const dir = outDir(settingsOutputDir)
  return readHistory(dir)
    .filter((rec) => fs.existsSync(rec.imagePath))
    .map((rec) => ({
      record: rec,
      dataUrl: `data:image/png;base64,${fs.readFileSync(rec.imagePath).toString('base64')}`,
    }))
}
