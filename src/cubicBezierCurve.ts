import type { ControlPoint, Point } from './types'
import { getPos } from './utils'

// Global click to create/split (Basic implementation for now)
// --- Utilities for cubic bezier ---
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}
function lerpPoint(p0: { x: number; y: number }, p1: { x: number; y: number }, t: number) {
  return { x: lerp(p0.x, p1.x, t), y: lerp(p0.y, p1.y, t) }
}
export function cubicPointAt(p0: Point, p1: Point, p2: Point, p3: Point, t: number) {
  const A = lerpPoint(p0, p1, t)
  const B = lerpPoint(p1, p2, t)
  const C = lerpPoint(p2, p3, t)
  const D = lerpPoint(A, B, t)
  const E = lerpPoint(B, C, t)
  const R = lerpPoint(D, E, t)
  return { A, B, C, D, E, R }
}

export function getCubicForSegment(mainCps: ControlPoint[], index: number) {
  if (index < 0 || index >= mainCps.length - 1) return null
  const p0Btn = mainCps[index]
  const p3Btn = mainCps[index + 1]

  const p0 = getPos(p0Btn)
  const p3 = getPos(p3Btn)

  const cpAfter = p0Btn.nextElementSibling
  const cpBefore = p3Btn.previousElementSibling
  if (!cpAfter || cpAfter.dataset.type !== 'cp-after') return null
  if (!cpBefore || cpBefore.dataset.type !== 'cp-before') return null

  const p1 = getPos(cpAfter)
  const p2 = getPos(cpBefore)
  return { p0Btn, p1Btn: cpAfter, p2Btn: cpBefore, p3Btn, p0, p1, p2, p3 }
}

export function findClosestOnPathPx(mainCps: ControlPoint[], rect: DOMRect, normPos: Point) {
  if (mainCps.length < 2) return null
  let best = { distPx: Infinity, segIndex: -1, t: 0, R: { x: 0, y: 0 } }
  for (let i = 0; i < mainCps.length - 1; i++) {
    const cubic = getCubicForSegment(mainCps, i)
    if (!cubic) continue
    // Dense sampling to approximate closest point
    const samples = 200
    for (let s = 0; s <= samples; s++) {
      const t = s / samples
      const { R } = cubicPointAt(cubic.p0, cubic.p1, cubic.p2, cubic.p3, t)
      const dxPx = (normPos.x - R.x) * rect.width
      const dyPx = (normPos.y - R.y) * rect.height
      const d = Math.hypot(dxPx, dyPx)
      if (d < best.distPx) {
        best = { distPx: d, segIndex: i, t, R }
      }
    }
  }
  if (best.segIndex === -1) return null
  return best
}
