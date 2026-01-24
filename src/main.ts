import './reset.css'
import './style.css'
import { attachHistoryEvents } from './attachHistoryEvents'
import { cubicPointAt, findClosestOnPathPx, getCubicForSegment } from './cubicBezierCurve'
import {
  $breakHandles,
  $cps,
  $deletePoint,
  $mirrorHandles,
  $sizeWrapper,
  $splinePreview,
} from './elements'
import { HistoryManager } from './historyManager'
import type { ControlPoint, CpType, Point, SerializedControlPoint } from './types'
import { updateControlPointPos } from './updateControlPointPos'
import { updateSvg } from './updateSvg'
import { getMainCp, getPos, serialize, updateBtnPos } from './utils'
import { getApproxPoints } from './getApproxPoints'

function applySerialized(state: SerializedControlPoint[]) {
  // Rebuild the controls DOM to exactly match the snapshot
  while ($cps.firstChild) $cps.removeChild($cps.firstChild)
  for (const p of state) {
    $cps.appendChild(createControlPoint(p.type, p.x, p.y))
  }
  updateSvg(getCps(), getApproxPoints(getMainCps()))
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
updateSvg(getCps(), getApproxPoints(getMainCps()))
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
  updateSvg(getCps(), getApproxPoints(getMainCps()))
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
  if (!cubic) return
  const { A, C, D, E, R } = cubicPointAt(cubic.p0, cubic.p1, cubic.p2, cubic.p3, t)

  // Update existing controls to preserve exact curve
  updateBtnPos(cubic.p1Btn, A.x, A.y) // cp-after of start
  updateBtnPos(cubic.p2Btn, C.x, C.y) // cp-before of end

  const ref = cubic.p2Btn
  $cps.insertBefore(createControlPoint('cp-before', D.x, D.y), ref)
  const mainCp = createControlPoint('cp-main', R.x, R.y)
  $cps.insertBefore(mainCp, ref)
  $cps.insertBefore(createControlPoint('cp-after', E.x, E.y), ref)

  updateSvg(getCps(), getApproxPoints(getMainCps()))
  // Record insertion as an undoable step
  history.record()
  selectControlPoint(mainCp)
}

$splinePreview.addEventListener('pointerdown', (e) => {
  const rect = $sizeWrapper.getBoundingClientRect()

  const closest = findClosestOnPathPx(getMainCps(), rect, getNormPos(e))
  if (!closest) return
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
    updateSvg(getCps(), getApproxPoints(getMainCps()))
    history.record()
  }
})
