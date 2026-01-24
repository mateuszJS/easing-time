import type { ControlPoint } from './types'
import { getPos } from './utils'

function getConnectedCpHandle(cp: ControlPoint, type: 'cp-before' | 'cp-after') {
  if (cp.dataset.type === type) return cp

  const direction = type === 'cp-before' ? 'previousElementSibling' : 'nextElementSibling'

  const maybeCpHandle = cp.dataset.type === 'cp-main' ? cp[direction] : cp[direction]?.[direction]

  if (maybeCpHandle?.dataset.type === type) {
    return maybeCpHandle
  }
  return null
}

/**
 * calculates bounds for given point, doesn't care about other point restriction
 */
function getSingleCpBounds(cp: ControlPoint) {
  const prev = cp.previousElementSibling
  const next = cp.nextElementSibling

  if (!prev || !next) {
    // edges
    return { left: 0, right: 1 }
  }

  switch (cp.dataset.type) {
    case 'cp-before':
      return {
        left:
          prev.dataset.type === 'cp-main' ? getPos(prev).x : getPos(prev.previousElementSibling!).x,
        right: getPos(next).x,
      }

    case 'cp-main':
      return {
        left:
          prev.dataset.type === 'cp-before' ?
            getPos(prev.previousElementSibling!).x
          : getPos(prev).x,
        right:
          next.dataset.type === 'cp-after' ? getPos(next.nextElementSibling!).x : getPos(next).x,
      }

    case 'cp-after':
      return {
        left: getPos(prev).x,
        right:
          next.dataset.type === 'cp-main' ? getPos(next).x : getPos(next.nextElementSibling!).x,
      }
  }
}

export function getBounds(cp: ControlPoint) {
  let leftBound = 0
  let rightBound = 1

  const cpBefore = getConnectedCpHandle(cp, 'cp-before')
  const cpAfter = getConnectedCpHandle(cp, 'cp-after')
  const cpPos = getPos(cp)

  if (cpBefore) {
    const bounds = getSingleCpBounds(cpBefore)
    const availableRightSpace = getPos(cpBefore).x - bounds.left

    if (cp.dataset.type === 'cp-before') {
      // right boudns made by cp-main
      rightBound = Math.min(rightBound, bounds.right)
    }

    if (cp.dataset.type === 'cp-after') {
      // handle case when it's the mirrored point
      rightBound = Math.min(rightBound, cpPos.x + availableRightSpace)
    } else {
      leftBound = Math.max(leftBound, cpPos.x - availableRightSpace)
    }
  }

  if (cpAfter) {
    const bounds = getSingleCpBounds(cpAfter)
    const availableRightSpace = bounds.right - getPos(cpAfter).x

    if (cp.dataset.type === 'cp-after') {
      leftBound = Math.max(leftBound, bounds.left)
    }

    if (cp.dataset.type === 'cp-before') {
      // mirrored poitn case
      leftBound = Math.max(leftBound, cpPos.x - availableRightSpace)
    } else {
      rightBound = Math.min(rightBound, cpPos.x + availableRightSpace)
    }
  }

  if (cp.dataset.type === 'cp-main') {
    const bounds = getSingleCpBounds(cp)
    leftBound = Math.max(leftBound, bounds.left)
    rightBound = Math.min(rightBound, bounds.right)
  }

  return {
    left: leftBound,
    right: rightBound,
  }
}
