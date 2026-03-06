import { EPSILON } from './consts'
import { $splinePreview, $timeBlockerBack, $timeBlockerForward } from './elements'
import { getBounds } from './getBounds'
import type { ControlPoint, Point } from './types'
import { getMainCp, getMirrorCp, getPos, updateHtmlPos } from './utils'

export function updateControlPointPos(
  cp: ControlPoint,
  newPos: Point,
  mirroredHandleDistance: number | null
) {
  let { x } = newPos
  const { y } = newPos
  const prev = cp.previousElementSibling as HTMLElement | null
  const next = cp.nextElementSibling as HTMLElement | null
  const isEdge = prev === null || next === null

  if (isEdge) {
    x = getPos(cp).x
  }

  const blockers = getBounds(cp)
  x = Math.max(x, blockers.left)
  x = Math.min(x, blockers.right)

  // Mirror/relative handle logic
  const type = cp.dataset.type
  if (type === 'cp-before' || type === 'cp-after') {
    // Find partner
    updateHtmlPos(cp, x, y)

    if (mirroredHandleDistance !== null) {
      const mirrorCp = getMirrorCp(cp)
      if (!mirrorCp) throw Error('Mirror control point not found')
      const mirrorCpBounds = getBounds(mirrorCp)

      const mainCp = getMainCp(cp)
      const mainCpPos = getPos(mainCp)
      const { width, height } = $splinePreview.getBoundingClientRect()
      const draggedVectorX = (x - mainCpPos.x) * width
      const draggedVectorY = (y - mainCpPos.y) * height
      const draggedDistance = Math.hypot(draggedVectorX, draggedVectorY)

      let px = mainCpPos.x
      let py = mainCpPos.y

      if (draggedDistance > EPSILON) {
        const unitX = -draggedVectorX / draggedDistance
        const unitY = -draggedVectorY / draggedDistance

        let allowedDistance = mirroredHandleDistance

        if (mirrorCp.dataset.type === 'cp-after' && unitX > EPSILON) {
          allowedDistance = Math.min(
            allowedDistance,
            ((mirrorCpBounds.right - mainCpPos.x) * width) / unitX
          )
        }

        if (mirrorCp.dataset.type === 'cp-before' && unitX < -EPSILON) {
          allowedDistance = Math.min(
            allowedDistance,
            ((mirrorCpBounds.left - mainCpPos.x) * width) / unitX
          )
        }

        px = mainCpPos.x + (unitX * allowedDistance) / width
        py = mainCpPos.y + (unitY * allowedDistance) / height
      }

      updateHtmlPos(mirrorCp, px, py)
    }
  } else {
    const oldPos = getPos(cp)
    const dx = x - oldPos.x
    const dy = y - oldPos.y

    updateHtmlPos(cp, x, y)
    const prev = cp.previousElementSibling
    if (prev && prev.dataset.type === 'cp-before') {
      const prevPos = getPos(prev)
      updateHtmlPos(prev, prevPos.x + dx, prevPos.y + dy)
    }
    const next = cp.nextElementSibling
    if (next && next.dataset.type === 'cp-after') {
      const nextPos = getPos(next)
      updateHtmlPos(next, nextPos.x + dx, nextPos.y + dy)
    }
  }

  if (isEdge) return // not need to show blockers for edge points

  const isLeftBoundHit = Math.abs(x - blockers.left) < EPSILON
  const isRightBoundHit = Math.abs(x - blockers.right) < EPSILON

  if (isLeftBoundHit) {
    $timeBlockerBack.style.setProperty('--offset', blockers.left.toString())
    $timeBlockerBack.dataset.active = 'true'
  } else {
    delete $timeBlockerBack.dataset.active
  }
  if (isRightBoundHit) {
    $timeBlockerForward.style.setProperty('--offset', blockers.right.toString())
    $timeBlockerForward.dataset.active = 'true'
  } else {
    delete $timeBlockerForward.dataset.active
  }
}
