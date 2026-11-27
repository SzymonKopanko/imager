import { type GenerationRequest, type Settings } from '../shared/types'

export interface ComfyImageOutput {
  filename: string
  subfolder: string
  type: string
}

export interface GenerationResult {
  images: ComfyImageOutput[]
  seed: number
}

function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000_000)
}

export async function comfyHealth(baseUrl: string): Promise<boolean> {
  try {
    const r = await fetch(`${baseUrl}/system_stats`, { signal: AbortSignal.timeout(3000) })
    return r.ok
  } catch {
    return false
  }
}

async function uploadImage(baseUrl: string, dataUrl: string, name: string): Promise<string> {
  const b64 = String(dataUrl).split(',')[1]
  const form = new FormData()
  form.append('image', new Blob([Buffer.from(b64, 'base64')], { type: 'image/png' }), name)
  form.append('overwrite', 'true')
  const r = await fetch(`${baseUrl}/upload/image`, { method: 'POST', body: form })
  if (!r.ok) throw new Error(`upload image failed: ${r.status}`)
  const j = (await r.json()) as { name: string }
  return j.name
}

/**
 * Buduje workflow Z-Image Turbo (ComfyUI API format).
 * węzły: UNETLoader + CLIPLoader(type qwen_image) + VAELoader,
 *   kodowanie promptu, latent (empty / VAEEncode z obrazem),
 *   KSampler (euler/simple, cfg 1.0), VAEDecode, SaveImage.
 */
export async function buildWorkflow(baseUrl: string, s: Settings, req: GenerationRequest): Promise<Record<string, unknown>> {
  const seed = req.seed ?? randomSeed()
  const wf: Record<string, unknown> = {
    '4': { class_type: 'UNETLoader', inputs: { unet_name: s.checkpoint, weight_dtype: 'default' } },
    '5': { class_type: 'CLIPLoader', inputs: { clip_name: s.textEncoder, type: 'qwen_image', device: 'default' } },
    '6': { class_type: 'VAELoader', inputs: { vae_name: s.vae } },
    '7': { class_type: 'CLIPTextEncode', inputs: { text: req.prompt, clip: ['5', 0] } },
    '8': { class_type: 'CLIPTextEncode', inputs: { text: req.negativePrompt || '', clip: ['5', 0] } },
    '10': {
      class_type: 'KSampler',
      inputs: {
        seed,
        steps: req.steps,
        cfg: 1.0,
        sampler_name: 'euler',
        scheduler: 'simple',
        denoise: req.mode === 'txt2img' ? 1.0 : (req.denoise ?? 0.7),
        model: ['4', 0],
        positive: ['7', 0],
        negative: ['8', 0],
        latent_image: ['9', 0],
      },
    },
    '11': { class_type: 'VAEDecode', inputs: { samples: ['10', 0], vae: ['6', 0] } },
    '12': { class_type: 'SaveImage', inputs: { filename_prefix: 'imager', images: ['11', 0] } },
  }

  if (req.mode === 'txt2img') {
    wf['9'] = {
      class_type: 'EmptyLatentImage',
      inputs: { width: req.width, height: req.height, batch_size: 1 },
    }
  } else if (req.mode === 'img2img') {
    const name = await uploadImage(baseUrl, req.inputImage ?? '', 'input.png')
    wf['3'] = { class_type: 'LoadImage', inputs: { image: name } }
    wf['9'] = { class_type: 'VAEEncode', inputs: { pixels: ['3', 0], vae: ['6', 0] } }
  } else {
    // inpaint: obraz + maska (ten sam rozmiar)
    const imgName = await uploadImage(baseUrl, req.inputImage ?? '', 'input.png')
    const maskName = await uploadImage(baseUrl, req.mask ?? '', 'mask.png')
    wf['3'] = { class_type: 'LoadImage', inputs: { image: imgName } }
    wf['31'] = { class_type: 'LoadImage', inputs: { image: maskName } }
    wf['9'] = { class_type: 'VAEEncode', inputs: { pixels: ['3', 0], vae: ['6', 0] } }
    wf['32'] = { class_type: 'SetLatentNoiseMask', inputs: { samples: ['9', 0], mask: ['31', 0] } }
    ;(wf['10'] as { inputs: Record<string, unknown> }).inputs.latent_image = ['32', 0]
  }

  return wf
}

export async function queuePrompt(baseUrl: string, workflow: Record<string, unknown>): Promise<string> {
  const r = await fetch(`${baseUrl}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: workflow }),
  })
  const j = (await r.json()) as { prompt_id?: string; error?: unknown; node_errors?: unknown }
  if (!r.ok || !j.prompt_id) {
    throw new Error(`queue prompt failed: ${r.status} ${JSON.stringify(j.error ?? j.node_errors ?? j)}`)
  }
  return j.prompt_id
}

export async function pollResult(baseUrl: string, promptId: string, timeoutMs = 10 * 60 * 1000): Promise<GenerationResult> {
  const start = Date.now()
  for (;;) {
    const r = await fetch(`${baseUrl}/history/${promptId}`)
    const j = (await r.json()) as Record<string, unknown>
    const entry = j[promptId]
    if (entry) {
      const status = (entry as { status?: { completed?: boolean; status_str?: string } }).status
      if (status?.status_str === 'error') throw new Error('generation failed in ComfyUI')
      if (status?.completed) {
        const outputs = (entry as { outputs?: Record<string, { images?: ComfyImageOutput[] }> }).outputs
        const node = outputs && Object.values(outputs).find((o) => o.images?.length)
        if (node?.images?.length) {
          const seedInputs = (entry as { inputs?: Record<string, unknown> })['inputs']?.['10'] as { seed?: number }
          return { images: node.images, seed: seedInputs?.seed ?? 0 }
        }
        throw new Error('generation completed without images')
      }
    }
    if (Date.now() - start > timeoutMs) throw new Error('generation timeout')
    await new Promise((res) => setTimeout(res, 1000))
  }
}

export async function fetchImage(baseUrl: string, img: ComfyImageOutput): Promise<Buffer> {
  const params = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder, type: img.type })
  const r = await fetch(`${baseUrl}/view?${params}`)
  if (!r.ok) throw new Error(`fetch image failed: ${r.status}`)
  return Buffer.from(await r.arrayBuffer())
}
