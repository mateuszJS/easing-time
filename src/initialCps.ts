import type { SerializedControlPoint } from './types'

// Initialize with some default points if empty
const defaultCps: SerializedControlPoint[] = [
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

function urlCpsStringify(cps: SerializedControlPoint[]): string {
  return cps.map((cp) => `${cp.type[3]}-${trimFixed(cp.x)}-${trimFixed(cp.y)}`).join('_')
}

function urlCpsParse(str: string): SerializedControlPoint[] {
  return str.split('_').map((part) => {
    const [typeChar, xStr, yStr] = part.split('-')

    const type = typeMap[typeChar as keyof typeof typeMap]
    if (!type) throw Error(`Invalid control point type: ${typeChar}`)
    return { type, x: parseFloat(xStr), y: parseFloat(yStr) }
  })
}

export function setInitialCps(cps: SerializedControlPoint[]) {
  const search = new URLSearchParams({
    cps: urlCpsStringify(cps),
  }).toString()

  window.history.replaceState(null, '', `/?${search}`)
}

export function getInitialCps(): SerializedControlPoint[] {
  const stringifiedCps = new URLSearchParams(window.location.search).get('cps')
  if (stringifiedCps) {
    try {
      return urlCpsParse(stringifiedCps)
    } catch (err) {
      console.error(err)
    }
  }
  return defaultCps
}
