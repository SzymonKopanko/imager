import type { ImagerApi } from './index'

declare global {
  interface Window {
    imager: ImagerApi
  }
}

export {}
