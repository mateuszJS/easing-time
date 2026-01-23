import { getPos } from './utils'

function getConnectedCpHandle(cp: HTMLButtonElement, type: 'cp-before' | 'cp-after') {
  if (cp.dataset.type === type) return cp

  const direction = type === 'cp-before' ? 'previousElementSibling' : 'nextElementSibling'

  const maybeCpHandle =
    cp.dataset.type === 'cp'
      ? (cp[direction] as HTMLButtonElement | null)
      : (cp[direction]?.[direction] as HTMLButtonElement | null)

  if (maybeCpHandle?.dataset.type === type) {
    return maybeCpHandle
  }
  return null
}

/**
 * calculates bounds for given point, doesn't care about other point restriction
 */
function getSingleCpBounds(cp: HTMLButtonElement) {
  const getIsBlocker =
    cp.dataset.type === 'cp'
      ? (p: HTMLButtonElement | null) => p?.dataset.type !== 'cp' // for cp all non-cp are blockers
      : (p: HTMLButtonElement | null) => p?.dataset.type === 'cp' // for cp-before/after only main cp are blockers

  const leftBlockingCps = [
    cp.previousElementSibling as HTMLButtonElement | null,
    (cp.previousElementSibling?.previousElementSibling ?? null) as HTMLButtonElement | null,
  ]
  const leftBound = leftBlockingCps.find(getIsBlocker)

  const rightBlockingCps = [
    cp.nextElementSibling as HTMLButtonElement | null,
    (cp.nextElementSibling?.nextElementSibling ?? null) as HTMLButtonElement | null,
  ]
  const rightBound = rightBlockingCps.find(getIsBlocker)

  return {
    left: leftBound ? getPos(leftBound).x : 0,
    right: rightBound ? getPos(rightBound).x : 1,
  }
}

export function getBounds(cp: HTMLButtonElement) {
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

  return {
    left: leftBound,
    right: rightBound,
  }
}
