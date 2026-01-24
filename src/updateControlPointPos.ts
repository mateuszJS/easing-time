import { getBounds } from './getBounds'
import type { ControlPoint, Point } from './types'
import { getMainCp, getMirrorCp, getPos, updateBtnPos } from './utils'

export function updateControlPointPos(cp: ControlPoint, newPos: Point) {
  let { x, y } = newPos
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
    updateBtnPos(cp, x, y)

    const mirrorCp = getMirrorCp(cp)

    if (mirrorCp) {
      const mainCp = getMainCp(cp)
      const mainCpPos = getPos(mainCp)
      // Mirror: Partner = 2*Center - Current
      const px = 2 * mainCpPos.x - x
      const py = 2 * mainCpPos.y - y
      updateBtnPos(mirrorCp, px, py)
    }
  } else if (type === 'cp-main') {
    const oldPos = getPos(cp)
    const dx = x - oldPos.x
    const dy = y - oldPos.y

    updateBtnPos(cp, x, y)
    const prev = cp.previousElementSibling
    if (prev && prev.dataset.type === 'cp-before') {
      const prevPos = getPos(prev)
      updateBtnPos(prev, prevPos.x + dx, prevPos.y + dy)
    }
    const next = cp.nextElementSibling
    if (next && next.dataset.type === 'cp-after') {
      const nextPos = getPos(next)
      updateBtnPos(next, nextPos.x + dx, nextPos.y + dy)
    }
  }
}
