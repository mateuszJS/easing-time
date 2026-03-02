import { EPSILON } from './consts'
import { $timeBlockerBack, $timeBlockerForward } from './elements'
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
      const angle = Math.atan2((y - mainCpPos.y) * -1, x - mainCpPos.x)

      const pxDesiredOffset = Math.cos(angle + Math.PI) * mirroredHandleDistance
      let px = pxDesiredOffset + mainCpPos.x
      let py = -Math.sin(angle + Math.PI) * mirroredHandleDistance + mainCpPos.y

      // if we block px, then we have to scale py also to keep aspect ratio
      // we check type of cp, because of the edge case when cp-after in on same x ad cpMain, so diff in X is 0, so py = 0
      if (mirrorCp.dataset.type === 'cp-after' && px > mirrorCpBounds.right) {
        const differenceScale = (mirrorCpBounds.right - mainCpPos.x) / pxDesiredOffset
        px = mirrorCpBounds.right
        py = mainCpPos.y - Math.sin(angle + Math.PI) * mirroredHandleDistance * differenceScale
      }

      if (mirrorCp.dataset.type === 'cp-before' && px < mirrorCpBounds.left) {
        const differenceScale = (mirrorCpBounds.left - mainCpPos.x) / pxDesiredOffset
        px = mirrorCpBounds.left
        py = mainCpPos.y - Math.sin(angle + Math.PI) * mirroredHandleDistance * differenceScale
      }

      updateHtmlPos(mirrorCp, px, py)
    }
  } else if (type === 'cp-main') {
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
