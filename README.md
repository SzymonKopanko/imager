# imager

Desktopowa, **w pełni lokalna** generacja obrazów: silnik generacji to
[ComfyUI](https://github.com/comfyanonymous/ComfyUI) (model Z-Image Turbo),
a lokalny LLM to Ollama (`qwen3:8b` — rozszerzanie promptów, `qwen3-vl` —
auto-opisy zdjęć). Bez subskrypcji; opcjonalnie DeepSeek API (płatne za
tokeny) jako dodatek wyłączany w ustawieniach.

Funkcje:

- **txt2img** — generacja z promptu (PL/EN),
- **img2img** — własne zdjęcie jako wejście,
- **inpainting** — pędzel-maska: zaznaczasz fragment i przegenerowujesz go,
- **galeria** — historia generacji z metadanymi (prompt, seed, model),
- **auto-opisy** — etykiety/opis zdjęcia przez `qwen3-vl`,
- **prompty** — rozszerzanie/tłumaczenie promptów przez `qwen3:8b`.

Stack: Electron + Vite + React (TypeScript). Aplikacja jest klientem HTTP:
nie osadza ComfyUI ani Ollamy — URLe konfiguruje się w ustawieniach.

Research wykonalności i decyzje: [planning-imager](https://github.com/SzymonKopanko/planning-imager)
(podmoduł `planning/`). Konwencje sesji: [AGENTS.md](./AGENTS.md).
