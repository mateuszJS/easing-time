import { cubicPointAt, findClosestOnPathPx, getCubicForSegment } from './cubicBezierCurve'
import './style.css'
import type { ControlPoint } from './types'
import { updateControlPointPos } from './updateControlPointPos'
import { updateSvgSpline } from './updateSvgSpline'
import { updateBtnPos } from './utils'

const $sizeWrapper = document.querySelector('.editor-container')! as HTMLElement
const $splinePreview = document.querySelector('.spline-preview')! as SVGSVGElement
const $cps = document.querySelector('.cps')! as HTMLElement

// Initialize with some default points if empty
function setDefaultData() {
  $cps.appendChild(createPoint('cp', 0, 1)) // Start
  $cps.appendChild(createPoint('cp-after', 0.5, 1))
  $cps.appendChild(createPoint('cp-before', 0.5, 0))
  $cps.appendChild(createPoint('cp', 1, 0)) // End
}

setDefaultData()
updateSvgSpline(getCps())

function createPoint(type: 'cp-before' | 'cp' | 'cp-after', x: number, y: number) {
  const btn = document.createElement('button') as ControlPoint
  btn.dataset.type = type
  updateBtnPos(btn, x, y)
  attachEvents(btn)
  return btn
}

function getCps() {
  return Array.from($cps.children) as ControlPoint[]
}

function getMainCps() {
  return getCps().filter((p) => p.dataset.type === 'cp')
}

function onMoveControlPoint(this: ControlPoint, ev: PointerEvent) {
  const rect = $sizeWrapper.getBoundingClientRect()
  let nx = (ev.clientX - rect.left) / rect.width
  let ny = (ev.clientY - rect.top) / rect.height

  updateControlPointPos(this, nx, ny)
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
    }

    btn.addEventListener('pointermove', onMoveControlPoint)
    btn.addEventListener('pointerup', onUp)
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

  updateSvgSpline(getCps())
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
