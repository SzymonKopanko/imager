# imager — konwencje sesji

## Czym jest

Aplikacja desktopowa (Electron) do lokalnej generacji obrazów: klient HTTP
dla ComfyUI (generacja) i Ollamy (LLM: prompty + auto-opisy). Research i
decyzje leżą w podmodule `planning/` (repo `planning-imager`); tu jest kod.

## Stack i komendy

- Node ≥ 22, npm. UI: Electron + Vite + React (TypeScript), electron-vite.
- `npm install`
- `npm run dev` — dev (HMR, okno Electron)
- `npm run build` — build produkcyjny (`out/`)
- `npm run lint` — oxlint
- `npm run test` — vitest (testy jednostkowe modułów głównych)
- `npm run smoke` — build + uruchomienie Electron ze zrzutem ekranu (`out/main/smoke.png`) i automatycznym zamknięciem
- `npm start` — Electron na buildzie (po `npm run build`)

## Struktura

- `src/main/` — proces główny: IPC, klienci ComfyUI/Ollama/DeepSeek,
  ustawienia (plik JSON w `app.getPath('userData')`), galeria
- `src/preload/` — contextBridge
- `src/renderer/` — React: zakładki Generacja / Edycja (img2img+inpaint) /
  Galeria / Ustawienia

## Zasady

- Bez sekretów w repo: klucz DeepSeek trzyma aplikacja w ustawieniach
  lokalnych (`userData/settings.json`, poza gitem). Gitleaks w CI.
- Zmiany wchodzą przez PR (checklist `.github/pull_request_template.md`);
  branchy i ścieżka testów: [../TESTING.md](../TESTING.md).
- ComfyUI i Ollama to zewnętrzne usługi lokalne — testy ich nie wymagają
  (mocki), E2E ręczne wg `planning/`.
