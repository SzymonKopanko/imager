import { useEffect, useRef, useState } from 'react'

interface Props {
  imageDataUrl: string
  brush: number
  onMaskChange: (dataUrl: string | null) => void
}

/** Canvas z obrazem i warstwą maski (pędzel). Biel = zachowaj, czerń = przegeneruj. */
export default function MaskEditor({ imageDataUrl, brush, onMaskChange }: Props): React.JSX.Element {
  const imgCanvasRef = useRef<HTMLCanvasElement>(null)
  const maskCanvasRef = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const painting = useRef(false)
  const hasPaint = useRef(false)

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      const max = 760
      const scale = Math.min(1, max / img.naturalWidth, max / img.naturalHeight)
      const w = Math.round(img.naturalWidth * scale)
      const h = Math.round(img.naturalHeight * scale)
      setSize({ w, h })
      const ictx = imgCanvasRef.current?.getContext('2d')
      if (ictx) ictx.drawImage(img, 0, 0, w, h)
      const mctx = maskCanvasRef.current?.getContext('2d')
      if (mctx) {
        // biel = zachowaj, czerń = przegeneruj (konwencja maski ComfyUI)
        mctx.fillStyle = '#fff'
        mctx.fillRect(0, 0, w, h)
      }
    }
    img.src = imageDataUrl
  }, [imageDataUrl])

  function pos(e: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } {
    const r = maskCanvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  function paintAt(x: number, y: number): void {
    const ctx = maskCanvasRef.current?.getContext('2d')
    if (!ctx) return
    hasPaint.current = true
    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.arc(x, y, brush / 2, 0, Math.PI * 2)
    ctx.fill()
  }

  function emitMask(): void {
    const c = maskCanvasRef.current
    if (!c) return
    onMaskChange(hasPaint.current ? c.toDataURL('image/png') : null)
  }

  return (
    <div className="mask-editor">
      <canvas ref={imgCanvasRef} width={size.w} height={size.h} />
      <canvas
        ref={maskCanvasRef}
        width={size.w}
        height={size.h}
        style={{ position: 'absolute', left: 0, top: 0, cursor: 'crosshair', opacity: 0.85 }}
        onPointerDown={(e) => {
          painting.current = true
          const p = pos(e)
          paintAt(p.x, p.y)
        }}
        onPointerMove={(e) => {
          if (!painting.current) return
          const p = pos(e)
          paintAt(p.x, p.y)
        }}
        onPointerUp={() => {
          painting.current = false
          emitMask()
        }}
        onPointerLeave={() => {
          painting.current = false
        }}
      />
    </div>
  )
}
