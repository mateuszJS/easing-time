import { EPSILON } from './consts'
import type { SerializedControlPoint } from './types'

// Initialize with some default points if empty
export const DEFAULT_CPS: SerializedControlPoint[] = [
  { type: 'cp-main', x: 0, y: 1 },
  { type: 'cp-after', x: 0.5, y: 1 },
  { type: 'cp-before', x: 0.5, y: 0 },
  { type: 'cp-main', x: 1, y: 0 },
]

const typeMap = {
  m: 'cp-main',
  b: 'cp-before',
  a: 'cp-after',
} as const

function trimFixed(value: number, maxDecimals = 5): string {
  const fixed = value.toFixed(maxDecimals)
  // Remove trailing zeros and an optional trailing dot
  return fixed.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1')
}

export function urlCpsStringify(cps: SerializedControlPoint[]): string {
  return cps.map((cp) => `${cp.type[3]}_${trimFixed(cp.x)}_${trimFixed(cp.y)}`).join('p')
}

function urlCpsParse(str: string): SerializedControlPoint[] {
  let lastMainX = -EPSILON
  let lastHandleX = -EPSILON
  const segments = str.split('p')

  if (segments.length < 2) throw Error('At least two control points are required')

  return segments.map((part) => {
    const [typeChar, xStr, yStr] = part.split('_')

    const type = typeMap[typeChar as keyof typeof typeMap]
    if (!type) throw Error(`Invalid control point type: ${typeChar}`)
    if (!xStr || !isFinite(Number(xStr))) throw Error(`Invalid x value: ${xStr}`)
    if (!yStr || !isFinite(Number(yStr))) throw Error(`Invalid y value: ${yStr}`)

    if (typeChar === 'm') {
      const minX = Math.max(lastMainX, lastHandleX)
      if (Number(xStr) < minX) {
        throw Error(`x values must be in ascending order. Found ${xStr} after ${minX}`)
      }
      lastMainX = Number(xStr) - EPSILON
    } else {
      if (Number(xStr) < lastMainX) {
        throw Error(
          `Handle x values must be >= last main point x. Found ${xStr} after ${lastMainX}`
        )
      }
      lastHandleX = Number(xStr) - EPSILON
    }

    return { type, x: parseFloat(xStr), y: parseFloat(yStr) }
  })
}

export function extractCps(search: string): SerializedControlPoint[] | null {
  const stringifiedCps = new URLSearchParams(search).get('cps')
  if (stringifiedCps) {
    try {
      return urlCpsParse(stringifiedCps)
    } catch (err) {
      console.error(err)
    }
  }
  return null
}
