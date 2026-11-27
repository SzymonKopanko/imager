export interface Settings {
  comfyUrl: string
  ollamaUrl: string
  checkpoint: string
  textEncoder: string
  vae: string
  ollamaModel: string
  visionModel: string
  width: number
  height: number
  steps: number
  deepseekEnabled: boolean
  deepseekApiKey: string
  deepseekModel: string
  outputDir: string
}

export const DEFAULT_SETTINGS: Settings = {
  comfyUrl: 'http://127.0.0.1:8188',
  ollamaUrl: 'http://127.0.0.1:11434',
  checkpoint: 'z_image_turbo_int8_convrot_bf16emixed.safetensors',
  textEncoder: 'qwen3-4b_int8_convrot_fp16emixed.safetensors',
  vae: 'Z-Image_half_natural_vae.safetensors',
  ollamaModel: 'qwen3:8b',
  visionModel: 'qwen3-vl',
  width: 1024,
  height: 1024,
  steps: 8,
  deepseekEnabled: false,
  deepseekApiKey: '',
  deepseekModel: 'deepseek-flash',
  outputDir: '',
}

export type GenerationMode = 'txt2img' | 'img2img' | 'inpaint'

export interface GenerationRequest {
  mode: GenerationMode
  prompt: string
  negativePrompt: string
  width: number
  height: number
  steps: number
  seed?: number
  denoise?: number
  inputImage?: string // base64 data URL, dla img2img / inpaint
  mask?: string // base64 data URL maski, dla inpaint
}

export interface ServiceStatus {
  comfy: boolean
  ollama: boolean
  deepseek: boolean
}

export interface GenerationRecord {
  id: string
  mode: GenerationMode
  prompt: string
  negativePrompt: string
  width: number
  height: number
  steps: number
  seed: number | null
  checkpoint: string
  imagePath: string
  createdAt: string
}

export interface GalleryEntry {
  record: GenerationRecord
  dataUrl: string
}

export interface VisionDescription {
  text: string
  source: 'ollama' | 'deepseek'
  error?: string
}
