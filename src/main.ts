import { cubicPointAt, findClosestOnPathPx, getCubicForSegment } from './cubicBezierCurve'
import { getBounds } from './getBounds'
import './style.css'
import updateConnectionLines from './updateConnectionLines'
import { getMainCp, getMirrorCp, getPos } from './utils'

const $sizeWrapper = document.querySelector('.editor-container')! as HTMLElement
const $splinePreview = document.querySelector('.spline-preview')! as SVGSVGElement
const $path = $splinePreview.querySelector('path')!
const $cps = document.querySelector('.cps')! as HTMLElement

// Initialize with some default points if empty
function setDefaultData() {
  $cps.appendChild(createPoint('cp', 0, 1)) // Start
  $cps.appendChild(createPoint('cp-after', 0.5, 1))
  $cps.appendChild(createPoint('cp-before', 0.5, 0))
  $cps.appendChild(createPoint('cp', 1, 0)) // End
}

setDefaultData()
render()

function createPoint(type: 'cp-before' | 'cp' | 'cp-after', x: number, y: number) {
  const btn = document.createElement('button')
  btn.dataset.type = type
  updateBtnPos(btn, x, y)
  attachEvents(btn)
  return btn
}

function getCps() {
  return Array.from($cps.children) as HTMLButtonElement[]
}

function getMainCps() {
  return getCps().filter((p) => p.dataset.type === 'cp')
}

function updateBtnPos(btn: HTMLElement, x: number, y: number) {
  btn.dataset.x = x.toString()
  btn.dataset.y = y.toString()
  // once firefox and safari supports attr(value, <type>) we can remove below assignments
  btn.style.left = x * 100 + '%'
  btn.style.top = y * 100 + '%'
}

// --- Rendering ---
// This relies purely on the DOM state of buttons
function render() {
  const cps = getCps()
  const [startCp, ...restCps] = cps
  const startCpPos = getPos(startCp)
  let d = `M ${startCpPos.x} ${startCpPos.y}`

  restCps.forEach((cp, i) => {
    if (cp.dataset.type === 'cp') {
      const idx = i + 1
      const cp1Btn = cps[idx - 2]
      const cp2Btn = cps[idx - 1]

      if (cp1Btn && cp2Btn) {
        const cp1 = getPos(cp1Btn)
        const cp2 = getPos(cp2Btn)
        const curr = getPos(cp)
        d += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${curr.x} ${curr.y}`
      }
    }
  })
  $path.setAttribute('d', d)

  updateConnectionLines($splinePreview, cps)
}

// function getBlockingMainCp(cp: HTMLButtonElement) {
//   const direction =
//     cp.dataset.type === 'cp-before' ? 'previousElementSibling' : 'nextElementSibling'

//   if (cp.dataset.type === 'cp-before') {
//     const maybeBlocker = cp[direction] as HTMLButtonElement | null
//     return maybeBlocker?.dataset.type === 'cp'
//       ? maybeBlocker
//       : (maybeBlocker?.[direction] as HTMLButtonElement | null)
//   }
// }

function onButtonMove(this: HTMLButtonElement, ev: PointerEvent) {
  const prev = this.previousElementSibling as HTMLElement | null
  const next = this.nextElementSibling as HTMLElement | null
  const isEdge = prev === null || next === null
  const rect = $sizeWrapper.getBoundingClientRect()
  let y = (ev.clientY - rect.top) / rect.height
  let x = (ev.clientX - rect.left) / rect.width

  if (isEdge) {
    x = getPos(this).x
  }

  const blockers = getBounds(this)
  x = Math.max(x, blockers.left)
  x = Math.min(x, blockers.right)

  // Mirror/relative handle logic
  const type = this.dataset.type
  if (type === 'cp-before' || type === 'cp-after') {
    // Find partner
    updateBtnPos(this, x, y)

    const mirrorCp = getMirrorCp(this)

    if (mirrorCp) {
      const mainCp = getMainCp(this)
      const mainCpPos = getPos(mainCp)
      // Mirror: Partner = 2*Center - Current
      const px = 2 * mainCpPos.x - x
      const py = 2 * mainCpPos.y - y
      updateBtnPos(mirrorCp, px, py)
    }
  } else if (type === 'cp') {
    const oldPos = getPos(this)
    const dx = x - oldPos.x
    const dy = y - oldPos.y

    updateBtnPos(this, x, y)
    const prev = this.previousElementSibling as HTMLButtonElement | null
    if (prev && prev.dataset.type === 'cp-before') {
      const prevPos = getPos(prev)
      updateBtnPos(prev, prevPos.x + dx, prevPos.y + dy)
    }
    const next = this.nextElementSibling as HTMLButtonElement | null
    if (next && next.dataset.type === 'cp-after') {
      const nextPos = getPos(next)
      updateBtnPos(next, nextPos.x + dx, nextPos.y + dy)
    }
  }

  render()
}

function attachEvents(btn: HTMLButtonElement) {
  btn.addEventListener('pointerdown', (e) => {
    e.stopPropagation() // Prevent creating new point
    btn.setPointerCapture(e.pointerId)
    // Capture initial positions for relative move when dragging an anchor (cp)

    const onUp = () => {
      btn.removeEventListener('pointermove', onButtonMove)
      btn.removeEventListener('pointerup', onUp)
    }

    btn.addEventListener('pointermove', onButtonMove as EventListener)
    btn.addEventListener('pointerup', onUp as EventListener)
  })
}

function splitAndInsertAt(segIndex: number, t: number) {
  const cubic = getCubicForSegment(getMainCps(), segIndex)
  if (!cubic) return
  const { A, B, C, D, E, R } = cubicPointAt(cubic.p0, cubic.p1, cubic.p2, cubic.p3, t)

  // Update existing controls to preserve exact curve
  updateBtnPos(cubic.p1Btn, A.x, A.y) // cp-after of start
  updateBtnPos(cubic.p2Btn, C.x, C.y) // cp-before of end

  const ref = cubic.p2Btn
  $cps.insertBefore(createPoint('cp-before', D.x, D.y), ref)
  $cps.insertBefore(createPoint('cp', R.x, R.y), ref)
  $cps.insertBefore(createPoint('cp-after', E.x, E.y), ref)

  render()
}

$splinePreview.addEventListener('pointerdown', (e) => {
  const rect = $sizeWrapper.getBoundingClientRect()
  const nx = (e.clientX - rect.left) / rect.width
  const ny = (e.clientY - rect.top) / rect.height

  const closest = findClosestOnPathPx(getMainCps(), rect, nx, ny)
  if (!closest) return
  if (closest.distPx >= 50) return

  splitAndInsertAt(closest.segIndex, closest.t)
})
