import { describe, expect, it, vi } from 'vitest'
import { buildWorkflow, type GenerationRequest } from './comfy'
import { DEFAULT_SETTINGS } from '../shared/types'

const s = { ...DEFAULT_SETTINGS }

describe('buildWorkflow', () => {
  it('txt2img: EmptyLatentImage + denoise 1.0', async () => {
    const req: GenerationRequest = {
      mode: 'txt2img',
      prompt: 'kot',
      negativePrompt: '',
      width: 1024,
      height: 768,
      steps: 8,
    }
    const wf = await buildWorkflow('http://127.0.0.1:8188', s, req)
    expect(wf['9']).toMatchObject({ class_type: 'EmptyLatentImage', inputs: { width: 1024, height: 768 } })
    expect(wf['5']).toMatchObject({ class_type: 'CLIPLoader', inputs: { type: 'qwen_image' } })
    expect(wf['10']).toMatchObject({
      class_type: 'KSampler',
      inputs: { denoise: 1.0, cfg: 1.0, sampler_name: 'euler' },
    })
    expect(wf['12']).toMatchObject({ class_type: 'SaveImage' })
  })

  it('txt2img: ustawiony seed trafia do KSampler', async () => {
    const req: GenerationRequest = {
      mode: 'txt2img',
      prompt: 'kot',
      negativePrompt: '',
      width: 1024,
      height: 1024,
      steps: 8,
      seed: 12345,
    }
    const wf = await buildWorkflow('http://127.0.0.1:8188', s, req)
    expect(wf['10']).toMatchObject({ inputs: { seed: 12345 } })
  })

  it('inpaint: SetLatentNoiseMask podłączony do KSampler', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ name: 'mock.png' }), { status: 200 }))
    )
    const req: GenerationRequest = {
      mode: 'inpaint',
      prompt: 'pies',
      negativePrompt: '',
      width: 1024,
      height: 1024,
      steps: 8,
      inputImage: 'data:image/png;base64,AAAA',
      mask: 'data:image/png;base64,AAAA',
    }
    const wf = await buildWorkflow('http://127.0.0.1:8188', s, req)
    expect(wf['32']).toMatchObject({ class_type: 'SetLatentNoiseMask' })
    expect((wf['10'] as { inputs: Record<string, unknown> }).inputs.latent_image).toEqual(['32', 0])
    expect(wf['9']).toMatchObject({ class_type: 'VAEEncode' })
  })
})
