import { Camera, Move, RotateCcw, Save, SlidersHorizontal, Sparkles, ZoomIn } from 'lucide-react'
import { useRef, useState } from 'react'

const PREVIEW_SIZE = 280
const OUTPUT_SIZE = 512
const ZOOM_MIN = 1
const ZOOM_MAX = 3
const FILTER_MIN = 60
const FILTER_MAX = 140

function createDefaultEditorState() {
  return {
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    brightness: 100,
    contrast: 100,
    saturation: 100,
  }
}

export default function AvatarEditorModal({ open, src, onClose, onApply }) {
  const imageRef = useRef(null)
  const dragRef = useRef(null)
  const [editorState, setEditorState] = useState(createDefaultEditorState)
  const [imageMeta, setImageMeta] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  if (!open) return null

  const baseScale = imageMeta ? Math.max(PREVIEW_SIZE / imageMeta.width, PREVIEW_SIZE / imageMeta.height) : 1
  const scaledWidth = imageMeta ? imageMeta.width * baseScale * editorState.zoom : PREVIEW_SIZE
  const scaledHeight = imageMeta ? imageMeta.height * baseScale * editorState.zoom : PREVIEW_SIZE
  const previewFilter = `brightness(${editorState.brightness}%) contrast(${editorState.contrast}%) saturate(${editorState.saturation}%)`

  const updateEditorState = (updater) => {
    setEditorState((previous) => {
      const nextValue = typeof updater === 'function' ? updater(previous) : updater
      return clampEditorState(nextValue, imageMeta)
    })
  }

  const handlePointerDown = (event) => {
    if (!imageMeta) return

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: editorState.offsetX,
      originY: editorState.offsetY,
    }
    setIsDragging(true)
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const handlePointerMove = (event) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return

    const deltaX = event.clientX - dragRef.current.startX
    const deltaY = event.clientY - dragRef.current.startY
    updateEditorState((previous) => ({
      ...previous,
      offsetX: dragRef.current.originX + deltaX,
      offsetY: dragRef.current.originY + deltaY,
    }))
  }

  const handlePointerEnd = (event) => {
    if (dragRef.current?.pointerId !== event.pointerId) return
    dragRef.current = null
    setIsDragging(false)
    event.currentTarget.releasePointerCapture?.(event.pointerId)
  }

  const handleApply = async () => {
    if (!imageRef.current || !imageMeta) return

    setIsSaving(true)
    try {
      const avatarDataUrl = await renderEditedAvatar(imageRef.current, imageMeta, editorState)
      onApply(avatarDataUrl)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
      <div className="glass-card max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[32px] p-5 sm:p-6">
        <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <div className="flex flex-col gap-2 border-b border-slate-200/80 pb-5 dark:border-slate-800">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-100">
                <Camera size={14} />
                <span>Avatar Editor</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Crop and adjust your profile photo</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Drag the image to reposition it, then tune zoom and lighting before saving.
              </p>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_140px]">
              <div className="space-y-4">
                <div
                  className={`relative mx-auto aspect-square w-full max-w-[420px] overflow-hidden rounded-[36px] border border-slate-200 bg-slate-950/95 shadow-2xl dark:border-slate-700 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerEnd}
                  onPointerCancel={handlePointerEnd}
                  style={{ touchAction: 'none' }}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.18),transparent_42%),linear-gradient(180deg,rgba(15,23,42,0.35),rgba(2,6,23,0.88))]" />
                  <div
                    className="absolute left-1/2 top-1/2"
                    style={{
                      transform: `translate(-50%, -50%) translate(${editorState.offsetX}px, ${editorState.offsetY}px)`,
                    }}
                  >
                    <img
                      ref={imageRef}
                      src={src}
                      alt="Avatar source"
                      draggable={false}
                      onLoad={(event) =>
                        setImageMeta({
                          width: event.currentTarget.naturalWidth,
                          height: event.currentTarget.naturalHeight,
                        })
                      }
                      className="pointer-events-none max-w-none select-none rounded-[28px] object-cover"
                      style={{
                        width: `${scaledWidth}px`,
                        height: `${scaledHeight}px`,
                        filter: previewFilter,
                      }}
                    />
                  </div>
                  <div className="pointer-events-none absolute inset-[18px] rounded-[28px] border border-white/85 shadow-[0_0_0_9999px_rgba(2,6,23,0.48)]" />
                  <div className="pointer-events-none absolute inset-0 rounded-[36px] ring-1 ring-white/15" />
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/60">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <Move size={16} />
                    <span>Move</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Drag inside the crop frame to focus on the exact part of the photo you want.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/60">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <Sparkles size={16} />
                    <span>Live Preview</span>
                  </div>
                  <div className="mt-4 flex justify-center">
                    <PreviewAvatar
                      src={src}
                      imageMeta={imageMeta}
                      editorState={editorState}
                      size={92}
                      roundedClassName="rounded-full"
                    />
                  </div>
                  <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
                    This is how your avatar will look after upload.
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/60">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <ZoomIn size={16} />
                    <span>Zoom</span>
                  </div>
                  <RangeField
                    label={`${editorState.zoom.toFixed(2)}x`}
                    min={ZOOM_MIN}
                    max={ZOOM_MAX}
                    step={0.01}
                    value={editorState.zoom}
                    onChange={(value) => updateEditorState((previous) => ({ ...previous, zoom: value }))}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 dark:border-slate-700 dark:bg-slate-900/60">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <SlidersHorizontal size={16} />
                <span>Adjustments</span>
              </div>
              <div className="mt-4 space-y-4">
                <RangeField
                  label="Brightness"
                  value={editorState.brightness}
                  min={FILTER_MIN}
                  max={FILTER_MAX}
                  step={1}
                  onChange={(value) => updateEditorState((previous) => ({ ...previous, brightness: value }))}
                  valueSuffix="%"
                />
                <RangeField
                  label="Contrast"
                  value={editorState.contrast}
                  min={FILTER_MIN}
                  max={FILTER_MAX}
                  step={1}
                  onChange={(value) => updateEditorState((previous) => ({ ...previous, contrast: value }))}
                  valueSuffix="%"
                />
                <RangeField
                  label="Saturation"
                  value={editorState.saturation}
                  min={FILTER_MIN}
                  max={FILTER_MAX}
                  step={1}
                  onChange={(value) => updateEditorState((previous) => ({ ...previous, saturation: value }))}
                  valueSuffix="%"
                />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 dark:border-slate-700 dark:bg-slate-900/60">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Tips</p>
              <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <p>Use zoom first, then drag to align your face in the center.</p>
                <p>Keep brightness close to 100% for the most natural look.</p>
                <p>Your final avatar is exported as an optimized square image.</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">
              <button
                type="button"
                onClick={() => {
                  setEditorState(createDefaultEditorState())
                  setIsDragging(false)
                }}
                className="interactive-chip inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                <RotateCcw size={16} />
                <span>Reset</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="interactive-chip inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!imageMeta || isSaving}
                onClick={handleApply}
                className="interactive-strong inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={16} />
                <span>{isSaving ? 'Saving...' : 'Apply Avatar'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function RangeField({ label, value, min, max, step, onChange, valueSuffix = '' }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between gap-3 text-sm font-medium text-slate-700 dark:text-slate-200">
        <span>{label}</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {typeof value === 'number' ? value.toFixed(step < 1 ? 2 : 0) : value}
          {valueSuffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full accent-blue-600"
      />
    </label>
  )
}

function PreviewAvatar({ src, imageMeta, editorState, size, roundedClassName }) {
  const previewScale = imageMeta ? Math.max(size / imageMeta.width, size / imageMeta.height) * editorState.zoom : 1
  const previewWidth = imageMeta ? imageMeta.width * previewScale : size
  const previewHeight = imageMeta ? imageMeta.height * previewScale : size
  const previewFilter = `brightness(${editorState.brightness}%) contrast(${editorState.contrast}%) saturate(${editorState.saturation}%)`
  const ratio = size / PREVIEW_SIZE

  return (
    <div className={`relative overflow-hidden border border-white/70 bg-slate-950 shadow-lg ${roundedClassName}`} style={{ width: `${size}px`, height: `${size}px` }}>
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          transform: `translate(-50%, -50%) translate(${editorState.offsetX * ratio}px, ${editorState.offsetY * ratio}px)`,
        }}
      >
        <img
          src={src}
          alt="Avatar preview"
          draggable={false}
          className="pointer-events-none max-w-none select-none object-cover"
          style={{
            width: `${previewWidth}px`,
            height: `${previewHeight}px`,
            filter: previewFilter,
          }}
        />
      </div>
    </div>
  )
}

function clampEditorState(state, imageMeta) {
  if (!imageMeta) return state

  const baseScale = Math.max(PREVIEW_SIZE / imageMeta.width, PREVIEW_SIZE / imageMeta.height)
  const nextZoom = clampValue(state.zoom, ZOOM_MIN, ZOOM_MAX)
  const scaledWidth = imageMeta.width * baseScale * nextZoom
  const scaledHeight = imageMeta.height * baseScale * nextZoom
  const maxOffsetX = Math.max(0, (scaledWidth - PREVIEW_SIZE) / 2)
  const maxOffsetY = Math.max(0, (scaledHeight - PREVIEW_SIZE) / 2)

  return {
    ...state,
    zoom: nextZoom,
    offsetX: clampValue(state.offsetX, -maxOffsetX, maxOffsetX),
    offsetY: clampValue(state.offsetY, -maxOffsetY, maxOffsetY),
    brightness: clampValue(state.brightness, FILTER_MIN, FILTER_MAX),
    contrast: clampValue(state.contrast, FILTER_MIN, FILTER_MAX),
    saturation: clampValue(state.saturation, FILTER_MIN, FILTER_MAX),
  }
}

function clampValue(value, min, max) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return min
  return Math.min(max, Math.max(min, numericValue))
}

async function renderEditedAvatar(imageElement, imageMeta, editorState) {
  const canvas = document.createElement('canvas')
  canvas.width = OUTPUT_SIZE
  canvas.height = OUTPUT_SIZE

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas rendering is not supported in this browser.')
  }

  const baseScale = Math.max(PREVIEW_SIZE / imageMeta.width, PREVIEW_SIZE / imageMeta.height)
  const scaledWidth = imageMeta.width * baseScale * editorState.zoom
  const scaledHeight = imageMeta.height * baseScale * editorState.zoom
  const ratio = OUTPUT_SIZE / PREVIEW_SIZE

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.filter = `brightness(${editorState.brightness}%) contrast(${editorState.contrast}%) saturate(${editorState.saturation}%)`

  // Mirror the preview transform so the saved image matches what the user sees in the editor.
  context.drawImage(
    imageElement,
    OUTPUT_SIZE / 2 - (scaledWidth * ratio) / 2 + editorState.offsetX * ratio,
    OUTPUT_SIZE / 2 - (scaledHeight * ratio) / 2 + editorState.offsetY * ratio,
    scaledWidth * ratio,
    scaledHeight * ratio,
  )

  return canvas.toDataURL('image/jpeg', 0.9)
}
