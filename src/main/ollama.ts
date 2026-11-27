export async function ollamaHealth(baseUrl: string): Promise<boolean> {
  try {
    const r = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(3000) })
    return r.ok
  } catch {
    return false
  }
}

export async function ollamaGenerate(baseUrl: string, model: string, prompt: string, maxTokens = 600): Promise<string> {
  const r = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false, think: false, options: { num_predict: maxTokens } }),
  })
  if (!r.ok) throw new Error(`ollama generate failed: ${r.status}`)
  const j = (await r.json()) as { response?: string; error?: string }
  if (j.error) throw new Error(`ollama: ${j.error}`)
  return j.response ?? ''
}

/** Rozszerzenie/tłumaczenie promptu do bogatego opisu po angielsku. */
export async function expandPrompt(baseUrl: string, model: string, prompt: string): Promise<string> {
  return ollamaGenerate(
    baseUrl,
    model,
    'Rozszerz ten prompt do generowania obrazu na bogaty opis po angielsku (style Diffusion). ' +
      'Dodaj światło, kompozycję, detale i styl. Odpowiedz TYLKO samym promptem, bez komentarzy. Prompt: ' +
      prompt,
    800
  )
}

/** Auto-opis zdjęcia (base64 data URL) modelem wizyjnym. */
export async function visionDescribe(baseUrl: string, model: string, imageDataUrl: string): Promise<string> {
  const r = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt: 'Opisz krótko to zdjęcie: co na nim jest, styl, kolory, kompozycja. Odpowiedz po polsku, maksymalnie 3 zdania.',
      images: [imageDataUrl.replace(/^data:image\/[a-z+]+;base64,/, '')],
      stream: false,
      think: false,
      options: { num_predict: 700 },
    }),
  })
  if (!r.ok) throw new Error(`ollama vision failed: ${r.status}`)
  const j = (await r.json()) as { response?: string; error?: string }
  if (j.error) throw new Error(`ollama vision: ${j.error}`)
  return j.response ?? ''
}
