// =====================
// Pan & Zoom Management

import { $panZoomArea, $sizeWrapper } from './elements'

// =====================
let zoom = 1
let baseWidth = 0
let baseHeight = 0

function initPanZoom() {
  const rect = $sizeWrapper.getBoundingClientRect()
  baseWidth = rect.width
  baseHeight = rect.height
  applyZoom(1, { keepCenter: true })
}

function applyZoom(
  newZoom: number,
  opts?: { anchorClientX?: number; anchorClientY?: number; keepCenter?: boolean }
) {
  const minZoom = 0.25
  const maxZoom = 5
  const z0 = zoom
  const z1 = Math.max(minZoom, Math.min(maxZoom, newZoom))
  if (z1 === z0) return

  const areaRect = $panZoomArea.getBoundingClientRect()
  const viewportW = $panZoomArea.clientWidth
  const viewportH = $panZoomArea.clientHeight

  const contentW0 = baseWidth * z0
  const contentH0 = baseHeight * z0
  const contentW1 = baseWidth * z1
  const contentH1 = baseHeight * z1

  // Anchor position (pointer or center)
  const ax = opts?.keepCenter
    ? areaRect.left + viewportW / 2
    : (opts?.anchorClientX ?? areaRect.left + viewportW / 2)
  const ay = opts?.keepCenter
    ? areaRect.top + viewportH / 2
    : (opts?.anchorClientY ?? areaRect.top + viewportH / 2)

  // Current scroll and content offset within scroll area
  const sl0 = $panZoomArea.scrollLeft
  const st0 = $panZoomArea.scrollTop
  const ox0 = $sizeWrapper.offsetLeft
  const oy0 = $sizeWrapper.offsetTop

  // Anchor relative to scroll area
  const mx = ax - areaRect.left
  const my = ay - areaRect.top

  // Content coordinate under anchor before zoom
  const contentX0 = sl0 + mx - ox0
  const contentY0 = st0 + my - oy0
  const rx = contentW0 ? contentX0 / contentW0 : 0
  const ry = contentH0 ? contentY0 / contentH0 : 0

  zoom = z1
  $sizeWrapper.style.width = `${contentW1}px`
  $sizeWrapper.style.height = `${contentH1}px`

  // New content offset (may change due to centering)
  const ox1 = $sizeWrapper.offsetLeft
  const oy1 = $sizeWrapper.offsetTop

  // Choose scroll so the same content point stays under the anchor
  const sl1Raw = ox1 + rx * contentW1 - mx
  const st1Raw = oy1 + ry * contentH1 - my
  const maxSL = Math.max(0, $panZoomArea.scrollWidth - viewportW)
  const maxST = Math.max(0, $panZoomArea.scrollHeight - viewportH)
  const sl1 = Math.max(0, Math.min(maxSL, sl1Raw))
  const st1 = Math.max(0, Math.min(maxST, st1Raw))
  $panZoomArea.scrollLeft = isFinite(sl1) ? sl1 : 0
  $panZoomArea.scrollTop = isFinite(st1) ? st1 : 0
}

// Wheel zoom with Ctrl/Cmd
$panZoomArea.addEventListener(
  'wheel',
  (e) => {
    if (!(e.ctrlKey || e.metaKey)) return
    e.preventDefault()
    const scaleBy = 1 - Math.sign(e.deltaY) * 0.01
    applyZoom(zoom * scaleBy, { anchorClientX: e.clientX, anchorClientY: e.clientY })
  },
  { passive: false }
)

// Keyboard zoom: Cmd/Ctrl + '+', '-', '0'
document.addEventListener('keydown', (e) => {
  const plus = e.key === '+' || e.key === '='
  const minus = e.key === '-' || e.key === '_'
  const reset = e.key === '0'
  if ((plus || minus || reset) && (e.metaKey || e.ctrlKey)) {
    e.preventDefault()
    if (reset) {
      applyZoom(1, { keepCenter: true })
    } else if (plus) {
      applyZoom(zoom * 1.1, { keepCenter: true })
    } else if (minus) {
      applyZoom(zoom / 1.1, { keepCenter: true })
    }
  }
})

// Drag to pan (Space+drag left button, or Middle mouse)
let isPanning = false
let lastX = 0
let lastY = 0
let spacePressed = false

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') spacePressed = true
})
document.addEventListener('keyup', (e) => {
  if (e.code === 'Space') spacePressed = false
})

$panZoomArea.addEventListener('pointerdown', (e) => {
  const middle = e.button === 1
  const canPan = middle || (spacePressed && e.button === 0)
  if (!canPan) return
  isPanning = true
  $panZoomArea.classList.add('pan-grabbing')
  ;($panZoomArea as any).setPointerCapture?.(e.pointerId)
  lastX = e.clientX
  lastY = e.clientY
})

$panZoomArea.addEventListener('pointermove', (e) => {
  if (!isPanning) return
  e.preventDefault()
  const dx = e.clientX - lastX
  const dy = e.clientY - lastY
  lastX = e.clientX
  lastY = e.clientY
  $panZoomArea.scrollLeft -= dx
  $panZoomArea.scrollTop -= dy
})

$panZoomArea.addEventListener('pointerup', () => {
  if (!isPanning) return
  isPanning = false
  $panZoomArea.classList.remove('pan-grabbing')
})

$panZoomArea.addEventListener('pointerleave', () => {
  if (!isPanning) return
  isPanning = false
  $panZoomArea.classList.remove('pan-grabbing')
})

// Initialize on load
window.addEventListener('load', initPanZoom)

// ----- Pinch support (Safari gesture events and touch two-finger) -----
// Safari-specific gesture events
;($panZoomArea as any).addEventListener(
  'gesturestart',
  (e: any) => {
    e.preventDefault()
    ;($panZoomArea as any)._gestureZoomStart = zoom
  },
  { passive: false }
)
;($panZoomArea as any).addEventListener(
  'gesturechange',
  (e: any) => {
    e.preventDefault()
    const start = ($panZoomArea as any)._gestureZoomStart ?? zoom
    const targetZoom = start * (e.scale || 1)
    applyZoom(targetZoom, { anchorClientX: e.clientX, anchorClientY: e.clientY })
  },
  { passive: false }
)
;($panZoomArea as any).addEventListener(
  'gestureend',
  (e: any) => {
    e.preventDefault()
    ;($panZoomArea as any)._gestureZoomStart = undefined
  },
  { passive: false }
)

// Touch two-finger pinch using Pointer Events
type TouchPoint = { id: number; x: number; y: number }
const touches = new Map<number, TouchPoint>()
let isPinching = false
let pinchStartDist = 0
let pinchStartZoom = 1
let pinchAnchorX = 0
let pinchAnchorY = 0

function updateTouch(e: PointerEvent) {
  touches.set(e.pointerId, { id: e.pointerId, x: e.clientX, y: e.clientY })
}

$panZoomArea.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'touch') updateTouch(e)
})

$panZoomArea.addEventListener(
  'pointermove',
  (e) => {
    if (e.pointerType === 'touch') updateTouch(e)
    if (touches.size >= 2) {
      const [t1, t2] = Array.from(touches.values()).slice(0, 2)
      const dx = t2.x - t1.x
      const dy = t2.y - t1.y
      const dist = Math.hypot(dx, dy)
      const midX = (t1.x + t2.x) / 2
      const midY = (t1.y + t2.y) / 2
      if (!isPinching) {
        isPinching = true
        pinchStartDist = dist
        pinchStartZoom = zoom
        pinchAnchorX = midX
        pinchAnchorY = midY
      } else {
        const scale = dist / (pinchStartDist || dist)
        const targetZoom = pinchStartZoom * scale
        applyZoom(targetZoom, { anchorClientX: pinchAnchorX, anchorClientY: pinchAnchorY })
      }
    } else if (isPinching) {
      isPinching = false
    }
  },
  { passive: false }
)

$panZoomArea.addEventListener('pointerup', (e) => {
  if (e.pointerType === 'touch') touches.delete(e.pointerId)
  if (touches.size < 2) isPinching = false
})

$panZoomArea.addEventListener('pointercancel', (e) => {
  if (e.pointerType === 'touch') touches.delete(e.pointerId)
  if (touches.size < 2) isPinching = false
})
