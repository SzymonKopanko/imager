const BASE = 'https://api.deepseek.com'

export async function deepseekHealth(apiKey: string): Promise<boolean> {
  if (!apiKey) return false
  try {
    const r = await fetch(`${BASE}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5000),
    })
    return r.ok
  } catch {
    return false
  }
}

async function chat(apiKey: string, model: string, messages: unknown[], maxTokens = 300): Promise<string> {
  const r = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, stream: false, max_tokens: maxTokens }),
  })
  const j = (await r.json()) as {
    choices?: { message?: { content?: string } }[]
    error?: { message?: string }
  }
  if (!r.ok || !j.choices?.length) throw new Error(`deepseek: ${r.status} ${j.error?.message ?? ''}`)
  return j.choices[0].message?.content ?? ''
}

/** Opcjonalne rozszerzenie promptu przez DeepSeek (płatne za tokeny). */
export async function deepseekExpandPrompt(apiKey: string, model: string, prompt: string): Promise<string> {
  return chat(apiKey, model, [
    {
      role: 'system',
      content: 'Rozszerzasz krótkie prompty do generowania obrazów na bogaty opis po angielsku. Odpowiedz TYLKO promptem.',
    },
    { role: 'user', content: prompt },
  ])
}

/** Opcjonalny opis zdjęcia przez DeepSeek Vision (płatne za tokeny). */
export async function deepseekDescribeImage(apiKey: string, model: string, imageDataUrl: string): Promise<string> {
  return chat(apiKey, model, [
    {
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: imageDataUrl } },
        {
          type: 'text',
          text: 'Opisz krótko to zdjęcie: co na nim jest, styl, kolory, kompozycja. Odpowiedz po polsku, maksymalnie 3 zdania.',
        },
      ],
    },
  ])
}
