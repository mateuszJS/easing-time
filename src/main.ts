import './reset.css'
import './style.css'
import { attachHistoryEvents } from './attachHistoryEvents'
import { cubicPointAt, findClosestOnPathPx, getCubicForSegment } from './cubicBezierCurve'
import {
  $animationLoop,
  $animationTime,
  $breakHandles,
  $cps,
  $deletePoint,
  $funcPrecision,
  $mirrorHandles,
  $previewTargetBox,
  $sizeWrapper,
  $splineAnimProgress,
  $splinePreview,
  $timeline,
} from './elements'
import { HistoryManager } from './historyManager'
import type { ControlPoint, CpType, Point, SerializedControlPoint } from './types'
import { updateControlPointPos } from './updateControlPointPos'
import { updateSvg } from './updateSvg'
import { getMainCp, getPos, serialize, updateBtnPos } from './utils'
import { getApproxPoints } from './getApproxPoints'

let funcPrecision = 0.01

function applySerialized(state: SerializedControlPoint[]) {
  // Rebuild the controls DOM to exactly match the snapshot
  while ($cps.firstChild) $cps.removeChild($cps.firstChild)
  for (const p of state) {
    $cps.appendChild(createControlPoint(p.type, p.x, p.y))
  }
  updateSvg(getCps(), getApproxPoints(getMainCps(), funcPrecision))
}

const history = new HistoryManager({
  getState: () => serialize(getCps()),
  applyState: applySerialized,
})

// Initialize with some default points if empty
function setDefaultData() {
  const defaultCps: SerializedControlPoint[] = [
    { type: 'cp-main', x: 0, y: 1 },
    { type: 'cp-after', x: 0.5, y: 1 },
    { type: 'cp-before', x: 0.5, y: 0 },
    { type: 'cp-main', x: 1, y: 0 },
  ]
  applySerialized(defaultCps)
}

setDefaultData()
updateSvg(getCps(), getApproxPoints(getMainCps(), funcPrecision))
// Capture initial state for undo/redo
history.record()

function createControlPoint(type: CpType, x: number, y: number) {
  const btn = document.createElement('button') as ControlPoint
  btn.dataset.type = type
  // Tooltip label for clarity on hover/focus
  updateBtnPos(btn, x, y)
  attachEvents(btn)
  return btn
}

function getCps() {
  return Array.from($cps.children) as ControlPoint[]
}

function getMainCps() {
  return getCps().filter((p) => p.dataset.type === 'cp-main')
}

function getNormPos(ev: PointerEvent): Point {
  const rect = $sizeWrapper.getBoundingClientRect()
  const nx = (ev.clientX - rect.left) / rect.width
  const ny = (ev.clientY - rect.top) / rect.height

  return { x: nx, y: ny }
}

function onMoveControlPoint(this: ControlPoint, ev: PointerEvent) {
  const normPos = getNormPos(ev)
  updateControlPointPos(this, normPos)
  updateSvg(getCps(), getApproxPoints(getMainCps(), funcPrecision))
}

function selectControlPoint(cp: ControlPoint) {
  document.querySelectorAll('button').forEach((b) => b.classList.remove('cp-selected'))
  cp.classList.add('cp-selected')

  const isFirstOrLast = cp.nextElementSibling === null || cp.previousElementSibling === null

  $breakHandles.disabled = isFirstOrLast
  $mirrorHandles.disabled = isFirstOrLast
  $deletePoint.disabled = isFirstOrLast
}

function attachEvents(btn: ControlPoint) {
  btn.addEventListener('pointerdown', (e) => {
    e.stopPropagation() // Prevent creating new point
    btn.setPointerCapture(e.pointerId)

    selectControlPoint(btn)
    const initialPos = getPos(btn)

    const onUp = () => {
      btn.removeEventListener('pointermove', onMoveControlPoint)
      btn.removeEventListener('pointerup', onUp)
      // Record state at end of drag as a single undo step
      const finalPos = getPos(btn)
      const offset = Math.hypot(finalPos.x - initialPos.x, finalPos.y - initialPos.y)
      if (offset > 0.001) {
        history.record()
      }
    }

    btn.addEventListener('pointermove', onMoveControlPoint)
    btn.addEventListener('pointerup', onUp)
  })
}

function splitAndInsertAt(segIndex: number, t: number) {
  const cubic = getCubicForSegment(getMainCps(), segIndex)

  const { A, C, D, E, R } = cubicPointAt(cubic.p0, cubic.p1, cubic.p2, cubic.p3, t)

  // Update existing controls to preserve exact curve
  updateBtnPos(cubic.p1Btn, A.x, A.y) // cp-after of start
  updateBtnPos(cubic.p2Btn, C.x, C.y) // cp-before of end

  const ref = cubic.p2Btn
  $cps.insertBefore(createControlPoint('cp-before', D.x, D.y), ref)
  const mainCp = createControlPoint('cp-main', R.x, R.y)
  $cps.insertBefore(mainCp, ref)
  $cps.insertBefore(createControlPoint('cp-after', E.x, E.y), ref)

  updateSvg(getCps(), getApproxPoints(getMainCps(), funcPrecision))
  // Record insertion as an undoable step
  history.record()
  selectControlPoint(mainCp)
}

$splinePreview.addEventListener('pointerdown', (e) => {
  const rect = $sizeWrapper.getBoundingClientRect()

  const closest = findClosestOnPathPx(getMainCps(), rect, getNormPos(e))
  if (closest.distPx >= 50) return

  splitAndInsertAt(closest.segIndex, closest.t)
})

attachHistoryEvents(history)

$breakHandles.addEventListener('click', () => {
  const selectedCp = document.querySelector<ControlPoint>('.cp-selected')

  if (!selectedCp) {
    console.error("Button wasn't disabled but there is no selected cp-main")
    return
  }

  const mainCp = getMainCp(selectedCp)

  const maybeCpBefore = mainCp.previousElementSibling
  const maybeCpAfter = mainCp.nextElementSibling

  if (maybeCpBefore) {
    const cpMainPos = getPos(mainCp)
    const cpBeforePos = getPos(maybeCpBefore)
    const angle = Math.atan2((cpMainPos.y - cpBeforePos.y) * -1, cpMainPos.x - cpBeforePos.x)
    const dist = Math.hypot(cpMainPos.x - cpBeforePos.x, cpMainPos.y - cpBeforePos.y)
    const newAngle = angle + Math.PI / 4
    const newPos = {
      x: cpMainPos.x + Math.cos(newAngle) * dist,
      y: cpMainPos.y - Math.sin(newAngle) * dist,
    }

    const cpAfter = maybeCpAfter ?? createControlPoint('cp-before', cpMainPos.x, cpMainPos.y)
    if (!cpAfter.isConnected) {
      const ref = mainCp.nextElementSibling
      if (!ref) {
        console.error("Button to break handles wasn't diable for first or last cp")
        return
      }
      $cps.insertBefore(cpAfter, ref)
    }
    updateBtnPos(cpAfter, newPos.x, newPos.y)
    updateSvg(getCps(), getApproxPoints(getMainCps(), funcPrecision))
    history.record()
  }
})

document.body.attributeStyleMap.set('--anim-dir', 'normal')
document.body.attributeStyleMap.set('--anim-time', '3000')
document.body.attributeStyleMap.set('--anim-state', 'running')

$animationLoop.addEventListener('change', () => {
  document.body.attributeStyleMap.set('--anim-dir', $animationLoop.checked ? 'alternate' : 'normal')
})

$animationTime.addEventListener('input', () => {
  const time = Number($animationTime.value) || 1
  document.body.attributeStyleMap.set('--anim-time', time)
})

$funcPrecision.addEventListener('input', () => {
  const val = Number($funcPrecision.value)
  funcPrecision = isNaN(val) ? 0.01 : val
  updateSvg(getCps(), getApproxPoints(getMainCps(), funcPrecision))
})

let animation: Animation | null = null

$previewTargetBox.getAnimations().map((a) => {
  animation = a
})

function updateProgress() {
  if (!animation) throw Error('Animation not found for progress update')
  const duration = Number(document.body.attributeStyleMap.get('--anim-time'))
  const progress = (Number(animation.currentTime ?? 0) % duration) / duration

  const main = getMainCps()
  if (main.length < 2)
    throw Error('At least two main control points are required for animation progress calculation')

  // Find segment for target X (assumes increasing x across main cps)
  const targetX = progress
  let segIndex = -1
  for (let i = 0; i < main.length - 1; i++) {
    const cubic = getCubicForSegment(main, i)
    const minX = Math.min(cubic.p0.x, cubic.p3.x)
    const maxX = Math.max(cubic.p0.x, cubic.p3.x)
    if (targetX >= minX && targetX <= maxX) {
      segIndex = i
      break
    }
  }
  if (segIndex === -1) segIndex = 0

  const cubic = getCubicForSegment(main, segIndex)

  // Binary search for t where R.x ~= targetX
  let lo = 0
  let hi = 1
  let R = cubic.p0
  for (let iter = 0; iter < 25; iter++) {
    const mid = (lo + hi) / 2
    const res = cubicPointAt(cubic.p0, cubic.p1, cubic.p2, cubic.p3, mid)
    R = res.R
    if (R.x < targetX) lo = mid
    else hi = mid
  }

  // Position the progress marker on the spline (normalized coords)
  $splineAnimProgress.style.left = R.x * 100 + '%'
  $splineAnimProgress.style.top = R.y * 100 + '%'

  requestAnimationFrame(updateProgress)
}

requestAnimationFrame(updateProgress)

$timeline.addEventListener('input', () => {
  if (!animation) return
  const val = Number($timeline.value)
  const [durationStr] = document.body.attributeStyleMap.get('--anim-time') as [string]
  const duration = Number(durationStr)
  animation.currentTime = Math.min(val * duration, duration - 0.0001) // if currentTime = duration then it comes back to frame 0
  document.body.attributeStyleMap.set('--anim-state', 'paused')
})
