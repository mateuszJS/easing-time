import { cubicPointAt, getCubicForSegment } from './cubicBezierCurve'
import type { ControlPoint, Point } from './types'

export function getApproxPoints(mainCps: ControlPoint[], tolerance: number): Point[] {
  if (mainCps.length === 0) return []

  const points: Point[] = []

  function distPointToLine(p: Point, a: Point, b: Point): number {
    const dx = b.x - a.x
    const dy = b.y - a.y
    const denom = Math.hypot(dx, dy)
    if (denom < 1e-8) return Math.hypot(p.x - a.x, p.y - a.y)
    // Area of parallelogram / base length
    const num = Math.abs(dx * (a.y - p.y) - (a.x - p.x) * dy)
    return num / denom
  }

  function approximateCubic(p0: Point, p1: Point, p2: Point, p3: Point): Point[] {
    const d1 = distPointToLine(p1, p0, p3)
    const d2 = distPointToLine(p2, p0, p3)
    if (Math.max(d1, d2) <= tolerance) {
      return [p0, p3]
    }
    // Subdivide at t=0.5 using de Casteljau
    const { A, C, D, E, R } = cubicPointAt(p0, p1, p2, p3, 0.5)
    const left = approximateCubic(p0, A, D, R)
    const right = approximateCubic(R, E, C, p3)
    // Merge without duplicating the shared midpoint R
    return [...left, ...right.slice(1)]
  }

  for (let i = 0; i < mainCps.length - 1; i++) {
    const cubic = getCubicForSegment(mainCps, i)

    const segPoints = approximateCubic(cubic.p0, cubic.p1, cubic.p2, cubic.p3)
    if (i === 0) {
      points.push(...segPoints)
    } else {
      // Avoid duplicating the first point (which equals previous segment end)
      points.push(...segPoints.slice(1))
    }
  }

  return points
}
