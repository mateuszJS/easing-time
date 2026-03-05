import './number-input'
import { attachHistoryEvents } from './attachHistoryEvents'
import { cubicPointAt, findClosestOnPathPx, getCubicForSegment } from './cubicBezierCurve'
import {
  $animationLoop,
  $animationTime,
  $animStatePause,
  $animStatePlay,
  $breakHandles,
  $codeSnippet,
  $copyCode,
  $cpCoords,
  $cpPreview,
  $cps,
  $decimalPoint,
  $deletePoint,
  $funcPrecision,
  $endValue,
  $startValue,
  $mirrorHandles,
  $previewTargetBox,
  $redo,
  $rulerY,
  $splineAnimProgress,
  $splinePreview,
  $timeline,
  $undo,
  $graphSpaceStart,
  $graphSpaceEnd,
  $timeBlockerBack,
  $timeBlockerForward,
} from './elements'
import { HistoryManager } from './historyManager'
import type { ControlPoint, CpType, Point, SerializedControlPoint } from './types'
import { updateControlPointPos } from './updateControlPointPos'
import { updateSvg } from './updateSvg'
import {
  clamp,
  getConnectedCpHandle,
  getCps,
  getCssVarNumber,
  getCssVarStr,
  getIsMirrored,
  getMainCp,
  getMainCps,
  getPos,
  serialize,
  setCssVar,
  updateHtmlPos,
  updateQueryParam,
} from './utils'
import { getApproxPoints } from './getApproxPoints'
import { DRAG_INITIAL } from './drag'
import { getBounds } from './getBounds'
import { getInitialCps, urlCpsStringify } from './initialCps'
import { initAnimTypeSelect } from './animTypeSelect'

const queryParams = new URLSearchParams(window.location.search)
const ANIM_PREVIEW_ARROW_TIP_HEIGHT = 20

setCssVar('--anim-preview-arrow-tip-height', ANIM_PREVIEW_ARROW_TIP_HEIGHT + 'px')

function applySerialized(state: SerializedControlPoint[]) {
  // Rebuild the controls DOM to exactly match the snapshot
  while ($cps.firstChild) $cps.removeChild($cps.firstChild)
  for (const p of state) {
    $cps.appendChild(createControlPoint(p.type, p.x, p.y))
  }
  updateSvg(
    getCps(),
    getApproxPoints(getMainCps(), $funcPrecision.value, $decimalPoint.value),
    $decimalPoint.value
  )
}

$funcPrecision.onChange = () => {
  updateSvg(
    getCps(),
    getApproxPoints(getMainCps(), $funcPrecision.value, $decimalPoint.value),
    $decimalPoint.value
  )
}

$decimalPoint.onChange = () => {
  updateSvg(
    getCps(),
    getApproxPoints(getMainCps(), $funcPrecision.value, $decimalPoint.value),
    $decimalPoint.value
  )
}

function updateRulerY() {
  const min = $startValue.value
  const max = $endValue.value

  Array.from($rulerY.children as HTMLCollectionOf<HTMLElement>).forEach((li, i) => {
    if (i === 0 || i === $rulerY.children.length - 1) return // inputs

    const range = max - min
    const value = min + range * (i / ($rulerY.children.length - 1))
    li.dataset.stop = Math.round(value).toString() + '%'
  })

  if (min > -5) {
    // 2 is just more less enough to have enoug hspace to display label 0%
    $graphSpaceStart.classList.add('hidden')
  } else {
    $graphSpaceStart.classList.remove('hidden')
  }

  if (max < 105) {
    // 98 is just more less enough to have enoug hspace to display label 100%
    $graphSpaceEnd.classList.add('hidden')
  } else {
    $graphSpaceEnd.classList.remove('hidden')
  }
}

updateRulerY()
$startValue.onChange = updateRulerY
$endValue.onChange = updateRulerY

const history = new HistoryManager({
  getState: () => serialize(getCps()),
  applyState: applySerialized,
  onUpdate: (state) => {
    updateQueryParam('cps', urlCpsStringify(state))

    // update buttons
    $undo.disabled = !history.canUndo()
    $redo.disabled = !history.canRedo()
  },
})

applySerialized(getInitialCps())
onActionComplete()

function onActionComplete() {
  updateSvg(
    getCps(),
    getApproxPoints(getMainCps(), $funcPrecision.value, $decimalPoint.value),
    $decimalPoint.value
  )
  history.record()
}

function createControlPoint(type: CpType, x: number, y: number) {
  const btn = document.createElement('button') as ControlPoint
  btn.dataset.type = type
  // Tooltip label for clarity on hover/focus
  updateHtmlPos(btn, x, y)
  attachEvents(btn)
  return btn
}

const NO_OFFSET = { x: 0, y: 0 }
function getNormPos(ev: PointerEvent, nOffset = NO_OFFSET): Point {
  const rect = $splinePreview.getBoundingClientRect()
  const nx = (ev.clientX - rect.left) / rect.width + nOffset.x
  const ny = (ev.clientY - rect.top) / rect.height + nOffset.y

  return { x: nx, y: ny }
}

function selectControlPoint(cp: ControlPoint) {
  document.querySelectorAll('button').forEach((b) => b.classList.remove('cp-selected'))
  cp.classList.add('cp-selected')

  const isFirstOrLast =
    cp.nextElementSibling === null ||
    cp.nextElementSibling.nextElementSibling === null ||
    cp.previousElementSibling === null ||
    cp.previousElementSibling.previousElementSibling === null

  $breakHandles.disabled = isFirstOrLast
  $mirrorHandles.disabled = isFirstOrLast
  $deletePoint.disabled = isFirstOrLast
}

let dragProps = DRAG_INITIAL

function attachEvents(cp: ControlPoint) {
  cp.addEventListener('pointerdown', (e) => {
    e.stopPropagation() // Prevent creating new point
    selectControlPoint(cp)

    const normPos = getNormPos(e)
    const cpPos = getPos(cp)
    updateCoordsInfo(normPos.x, normPos.y)

    dragProps = {
      initialPos: cpPos,
      cp: cp,
      mirroredHandleDistance: null,
      cursorOffset: {
        x: cpPos.x - normPos.x,
        y: cpPos.y - normPos.y,
      },
    }

    const cpBefore = getConnectedCpHandle(cp, 'cp-before')
    const cpMain = getMainCp(cp)
    const cpAfter = getConnectedCpHandle(cp, 'cp-after')

    if (cpBefore && cpAfter && cp !== cpMain) {
      const isMirrored = getIsMirrored(cpBefore, cpMain, cpAfter)
      if (isMirrored) {
        const cpBeforePos = getPos(cpBefore)
        const cpAfterPos = getPos(cpAfter)
        const cpMainPos = getPos(cpMain)

        dragProps.mirroredHandleDistance =
          cp === cpBefore ?
            Math.hypot(cpMainPos.x - cpAfterPos.x, cpMainPos.y - cpAfterPos.y)
          : Math.hypot(cpMainPos.x - cpBeforePos.x, cpMainPos.y - cpBeforePos.y)
      }
    }
  })

  cp.addEventListener('pointerenter', () => {
    const cpPos = getPos(cp)
    updateCoordsInfo(cpPos.x, cpPos.y)
  })
}

document.body.addEventListener('pointermove', (e) => {
  if (!dragProps.cp) return

  const normPos = getNormPos(e, dragProps.cursorOffset)

  updateControlPointPos(dragProps.cp, normPos, dragProps.mirroredHandleDistance)
  updateCoordsInfo(normPos.x, normPos.y)
  updateSvg(
    getCps(),
    getApproxPoints(getMainCps(), $funcPrecision.value, $decimalPoint.value),
    $decimalPoint.value
  )
})

function onPointerUp() {
  if (!dragProps.cp) return
  // Record state at end of drag as a single undo step
  const finalPos = getPos(dragProps.cp)
  const offset = Math.hypot(
    finalPos.x - dragProps.initialPos.x,
    finalPos.y - dragProps.initialPos.y
  )
  if (offset > 0.001) {
    onActionComplete()
  }
  dragProps = DRAG_INITIAL

  delete $timeBlockerBack.dataset.active
  delete $timeBlockerForward.dataset.active
}

document.body.addEventListener('pointerleave', onPointerUp)
document.body.addEventListener('pointercancel', onPointerUp)
document.body.addEventListener('pointerup', onPointerUp)

function splitAndInsertAt(segIndex: number, t: number) {
  const cubic = getCubicForSegment(getMainCps(), segIndex)

  const { A, C, D, E, R } = cubicPointAt(cubic.p0, cubic.p1, cubic.p2, cubic.p3, t)

  // Update existing handles if they exist to preserve exact curve
  if (cubic.p1Btn) updateHtmlPos(cubic.p1Btn, A.x, A.y) // cp-after of start
  if (cubic.p2Btn) updateHtmlPos(cubic.p2Btn, C.x, C.y) // cp-before of end

  const ref = cubic.p2Btn ?? cubic.p3Btn
  $cps.insertBefore(createControlPoint('cp-before', D.x, D.y), ref)
  const mainCp = createControlPoint('cp-main', R.x, R.y)
  $cps.insertBefore(mainCp, ref)
  $cps.insertBefore(createControlPoint('cp-after', E.x, E.y), ref)

  onActionComplete()

  selectControlPoint(mainCp)

  dragProps = {
    initialPos: getPos(mainCp),
    cp: mainCp,
    cursorOffset: { x: 0, y: 0 },
    mirroredHandleDistance: null,
  }
}

const ADD_CP_THRESHOLD = 30

function getClosest(e: PointerEvent) {
  const rect = $splinePreview.getBoundingClientRect()
  const normPos = getNormPos(e)
  const mainCps = getMainCps()
  const closest = findClosestOnPathPx(mainCps, rect, normPos)

  if (closest.distPx >= ADD_CP_THRESHOLD) return null

  return closest
}

function updateCoordsInfo(x: number, y: number) {
  // const rangeY = $endValue.value - $startValue.value
  const absoluteY = (1 - y) * 100
  const absoluteX = x * $animationTime.value
  $cpCoords.textContent = `progress: ${absoluteY.toFixed(2)}%\ntime: ${Math.round(absoluteX)}ms`
}

$splinePreview.addEventListener('pointermove', (e) => {
  if (dragProps.cp) {
    return // Don't show preview while dragging a point
  }

  const closest = getClosest(e)

  if (closest) {
    updateHtmlPos($cpPreview, closest.R.x, closest.R.y)
    $splinePreview.classList.add('show-cp-preview')
    updateCoordsInfo(closest.R.x, closest.R.y)
  } else {
    $splinePreview.classList.remove('show-cp-preview')
  }
})

$splinePreview.addEventListener('pointerleave', () => {
  $splinePreview.classList.remove('show-cp-preview')
})

$splinePreview.addEventListener('pointerdown', (e) => {
  const closest = getClosest(e)
  if (!closest) return

  $splinePreview.classList.remove('show-cp-preview')

  splitAndInsertAt(closest.segIndex, closest.t)

  const normPointerPos = getNormPos(e)
  dragProps.cursorOffset = {
    x: closest.R.x - normPointerPos.x,
    y: closest.R.y - normPointerPos.y,
  }
})

attachHistoryEvents(history)

$deletePoint.addEventListener('click', () => {
  const selectedCp = document.querySelector<ControlPoint>('.cp-selected')
  if (!selectedCp) {
    console.error("Button wasn't disabled but there is no selected cp-main")
    return
  }

  if (selectedCp.dataset.type === 'cp-main') {
    const cpBefore = getConnectedCpHandle(selectedCp, 'cp-before')
    const cpAfter = getConnectedCpHandle(selectedCp, 'cp-after')
    if (cpBefore) $cps.removeChild(cpBefore)
    if (cpAfter) $cps.removeChild(cpAfter)
  }

  $cps.removeChild(selectedCp)
  onActionComplete()
})

$mirrorHandles.addEventListener('click', () => {
  const selectedCp = document.querySelector<ControlPoint>('.cp-selected')

  if (!selectedCp) {
    console.error("Button wasn't disabled but there is no selected cp-main")
    return
  }

  const mainCp = getMainCp(selectedCp)
  const maybeCpBefore = getConnectedCpHandle(mainCp, 'cp-before')
  const maybeCpAfter = getConnectedCpHandle(mainCp, 'cp-after')
  const cpMainPos = getPos(mainCp)

  const existingHandle =
    maybeCpBefore ||
    maybeCpAfter ||
    (() => {
      const cp = createControlPoint('cp-before', cpMainPos.x - 0.1, cpMainPos.y)
      $cps.insertBefore(cp, mainCp)
      const bounds = getBounds(cp)
      const safeX = clamp(cpMainPos.x, bounds.left, bounds.right)
      updateHtmlPos(cp, safeX, cpMainPos.y)
      return cp
    })()

  const oppositeHandle = existingHandle.dataset.type === 'cp-before' ? maybeCpAfter : maybeCpBefore
  if (!oppositeHandle) {
    const type = existingHandle.dataset.type === 'cp-before' ? 'cp-after' : 'cp-before'
    const x = existingHandle.dataset.type === 'cp-before' ? cpMainPos.x + 0.1 : cpMainPos.x - 0.1
    const cp = createControlPoint(type, x, cpMainPos.y)
    $cps.insertBefore(cp, cp.dataset.type === 'cp-before' ? mainCp : mainCp.nextElementSibling)
  }

  const cpHandlePos = getPos(existingHandle)
  const mirroredHandleDistance = Math.hypot(
    cpMainPos.x - cpHandlePos.x,
    cpMainPos.y - cpHandlePos.y
  )
  updateControlPointPos(existingHandle, cpHandlePos, mirroredHandleDistance)

  onActionComplete()
})

$breakHandles.addEventListener('click', () => {
  const selectedCp = document.querySelector<ControlPoint>('.cp-selected')

  if (!selectedCp) {
    console.error("Button wasn't disabled but there is no selected cp-main")
    return
  }

  const mainCp = getMainCp(selectedCp)
  const cpBefore = getConnectedCpHandle(mainCp, 'cp-before')
  const cpAfter = getConnectedCpHandle(mainCp, 'cp-after')

  if (cpBefore && cpAfter) {
    const cpMainPos = getPos(mainCp)
    const cpBeforePos = getPos(cpBefore)
    const angle = Math.atan2((cpMainPos.y - cpBeforePos.y) * -1, cpMainPos.x - cpBeforePos.x)
    const dist = Math.hypot(cpMainPos.x - cpBeforePos.x, cpMainPos.y - cpBeforePos.y)

    const angleDiff = cpBeforePos.y > cpMainPos.y ? -Math.PI / 4 : Math.PI / 4 // to ensure angle won't be blocked by cp bounds!
    const newPos = {
      x: cpMainPos.x + Math.cos(angle + angleDiff) * dist,
      y: cpMainPos.y - Math.sin(angle + angleDiff) * dist,
    }

    const bounds = getBounds(cpAfter)
    const safeX = clamp(newPos.x, bounds.left, bounds.right)

    updateHtmlPos(cpAfter, safeX, newPos.y)
    onActionComplete()
  }
})

const initialDir = queryParams.get('direction') === 'alternate' ? 'alternate' : 'normal'

$animationLoop.checked = initialDir === 'alternate'

setCssVar('--anim-dir', initialDir)

$animationLoop.addEventListener('change', () => {
  setCssVar('--anim-dir', $animationLoop.checked ? 'alternate' : 'normal')
  updateQueryParam('direction', $animationLoop.checked ? 'alternate' : 'normal')
})

let animation: Animation
initAnimTypeSelect(() => {
  ;[animation] = $previewTargetBox.getAnimations()
})

function getprogress() {
  const duration = getCssVarNumber('--anim-time')
  const direction = getCssVarStr('--anim-dir')

  const progress = (Number(animation.currentTime ?? 0) % duration) / duration

  if (direction === 'alternate') {
    const totalDuration = 2 * duration
    const totalProgress = (Number(animation.currentTime ?? 0) % totalDuration) / totalDuration
    if (totalProgress > 0.5) {
      return 1 - progress
    }
  }

  return progress
}

function updateProgress() {
  const progress = getprogress()
  $timeline.value = progress.toString()

  const main = getMainCps()
  if (main.length < 2)
    throw Error('At least two main control points are required for animation progress calculation')

  // Interpolate along the approximated spline instead of the exact Bezier
  const approxPoints = getApproxPoints(main, $funcPrecision.value, $decimalPoint.value)
  let R = approxPoints[0] ?? { x: progress, y: 0 }

  for (let i = 0; i < approxPoints.length - 1; i++) {
    const p0 = approxPoints[i]
    const p1 = approxPoints[i + 1]
    const minX = Math.min(p0.x, p1.x)
    const maxX = Math.max(p0.x, p1.x)
    if (progress >= minX && progress <= maxX) {
      const dx = p1.x - p0.x
      const t = Math.abs(dx) < 1e-8 ? 0 : (progress - p0.x) / dx
      R = {
        x: progress,
        y: p0.y + (p1.y - p0.y) * t,
      }
      break
    }
  }

  // Position the progress marker on the spline (normalized coords)
  updateHtmlPos($splineAnimProgress, R.x, R.y)
  const y = Number($splineAnimProgress.dataset.y)

  const reflectArrow = (y - 1) * $splinePreview.clientHeight > ANIM_PREVIEW_ARROW_TIP_HEIGHT
  if (reflectArrow) {
    $splineAnimProgress.style.bottom = (1 - y) * 100 + '%'
    $splineAnimProgress.style.top = '' // Clear opposite side to avoid conflicts
    $splineAnimProgress.classList.add('reverse')
  } else {
    $splineAnimProgress.style.bottom = '' // Clear opposite side to avoid conflicts
    $splineAnimProgress.classList.remove('reverse')
  }

  requestAnimationFrame(updateProgress)
}

requestAnimationFrame(updateProgress)

$timeline.addEventListener('input', () => {
  const val = Number($timeline.value)
  const duration = getCssVarNumber('--anim-time')
  animation.currentTime = Math.min(val * duration, duration - 0.0001) // if currentTime = duration then it comes back to frame 0
  setAnimState('paused')
})

$animStatePlay.style.display = 'none'
setCssVar('--anim-state', 'running')

function setAnimState(state: 'running' | 'paused') {
  setCssVar('--anim-state', state)
  $animStatePlay.style.display = state === 'running' ? 'none' : ''
  $animStatePause.style.display = state === 'paused' ? 'none' : ''
}

$animStatePlay.addEventListener('click', () => {
  setAnimState('running')
})

$animStatePause.addEventListener('click', () => {
  setAnimState('paused')
})

document.addEventListener('keydown', (e) => {
  if (e.key === ' ') {
    e.preventDefault()
    if (getCssVarStr('--anim-state') === 'running') {
      setAnimState('paused')
    } else {
      setAnimState('running')
    }
  }
})

$copyCode.addEventListener('click', () => {
  const code = $codeSnippet.value
  if (!code) return
  navigator.clipboard.writeText(code)
})
