import './reset.css'
import './style.css'
import { cubicPointAt, findClosestOnPathPx, getCubicForSegment } from './cubicBezierCurve'
import { updateControlPointPos } from './updateControlPointPos'
import { updateSvgSpline } from './updateSvgSpline'
import { serialize, updateBtnPos } from './utils'
import { HistoryManager } from './historyManager'
import type { ControlPoint, CpType, Point, SerializedControlPoint } from './types'
import { attachHistoryEvents } from './attachHistoryEvents'
import { $cps, $sizeWrapper, $splinePreview } from './elements'
import './PanZoomManager'

function applySerialized(state: SerializedControlPoint[]) {
  // Rebuild the controls DOM to exactly match the snapshot
  while ($cps.firstChild) $cps.removeChild($cps.firstChild)
  for (const p of state) {
    $cps.appendChild(createControlPoint(p.type, p.x, p.y))
  }
  updateSvgSpline(getCps())
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
updateSvgSpline(getCps())
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
  let nx = (ev.clientX - rect.left) / rect.width
  let ny = (ev.clientY - rect.top) / rect.height

  return { x: nx, y: ny }
}

function onMoveControlPoint(this: ControlPoint, ev: PointerEvent) {
  const normPos = getNormPos(ev)
  updateControlPointPos(this, normPos)
  updateSvgSpline(getCps())
}

function attachEvents(btn: ControlPoint) {
  btn.addEventListener('pointerdown', (e) => {
    e.stopPropagation() // Prevent creating new point
    btn.setPointerCapture(e.pointerId)
    // Capture initial positions for relative move when dragging an anchor (cp)

    const onUp = () => {
      btn.removeEventListener('pointermove', onMoveControlPoint)
      btn.removeEventListener('pointerup', onUp)
      // Record state at end of drag as a single undo step
      history.record()
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
  $cps.insertBefore(createControlPoint('cp-main', R.x, R.y), ref)
  $cps.insertBefore(createControlPoint('cp-after', E.x, E.y), ref)

  updateSvgSpline(getCps())
  // Record insertion as an undoable step
  history.record()
}

$splinePreview.addEventListener('pointerdown', (e) => {
  const rect = $sizeWrapper.getBoundingClientRect()

  const closest = findClosestOnPathPx(getMainCps(), rect, getNormPos(e))
  if (!closest) return
  if (closest.distPx >= 50) return

  splitAndInsertAt(closest.segIndex, closest.t)
})

attachHistoryEvents(history)
