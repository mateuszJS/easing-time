import { $cps } from './elements'
import type { ControlPoint, SerializedControlPoint } from './types'

export function getPos(btn: HTMLElement) {
  return { x: parseFloat(btn.dataset.x!), y: parseFloat(btn.dataset.y!) }
}

export function getMainCp(p: ControlPoint) {
  if (p.dataset.type === 'cp-main') {
    return p
  }

  const potentialMirrorCp =
    p.dataset.type === 'cp-before' ? p.nextElementSibling : p.previousElementSibling

  if (!potentialMirrorCp || potentialMirrorCp.dataset.type !== 'cp-main') {
    throw Error('Main control point not found')
  }
  return potentialMirrorCp
}

export function getMirrorCp(p: ControlPoint) {
  const potentialMirrorCp =
    p.dataset.type === 'cp-before' ?
      p.nextElementSibling?.nextElementSibling
    : p.previousElementSibling?.previousElementSibling
  if (potentialMirrorCp && potentialMirrorCp.dataset.type !== 'cp-main') {
    return potentialMirrorCp
  }
}

export function updateHtmlPos(btn: HTMLElement, x: number, y: number) {
  btn.dataset.x = x.toString()
  btn.dataset.y = y.toString()
  // once firefox and safari supports attr(value, <type>) we can remove below assignments
  btn.style.left = x * 100 + '%'
  btn.style.top = y * 100 + '%'
}

export function serialize(cps: ControlPoint[]): SerializedControlPoint[] {
  return cps.map((btn) => ({
    type: btn.dataset.type as SerializedControlPoint['type'],
    x: parseFloat(btn.dataset.x!),
    y: parseFloat(btn.dataset.y!),
  }))
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function setCssVar(name: string, value: string | number, $el = document.documentElement) {
  $el.style.setProperty(name, value.toString())
}

export function getCssVarNumber(name: string, $el = document.documentElement): number {
  const value = getComputedStyle($el).getPropertyValue(name)
  return Number(value)
}

export function getCssVarStr(name: string, $el = document.documentElement): string {
  return getComputedStyle($el).getPropertyValue(name).trim()
}

export function getConnectedCpHandle(cp: ControlPoint, type: 'cp-before' | 'cp-after') {
  if (cp.dataset.type === type) return cp

  const direction = type === 'cp-before' ? 'previousElementSibling' : 'nextElementSibling'

  const maybeCpHandle = cp.dataset.type === 'cp-main' ? cp[direction] : cp[direction]?.[direction]

  if (maybeCpHandle?.dataset.type === type) {
    return maybeCpHandle
  }
  return null
}

export function normalizeAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle))
}

export function getIsMirrored(cpBefore: ControlPoint, cpMain: ControlPoint, cpAfter: ControlPoint) {
  const cpBeforePos = getPos(cpBefore)
  const cpMainPos = getPos(cpMain)
  const cpAfterPos = getPos(cpAfter)

  const angleBefore = Math.atan2((cpBeforePos.y - cpMainPos.y) * -1, cpBeforePos.x - cpMainPos.x)
  const angleAfter = Math.atan2((cpAfterPos.y - cpMainPos.y) * -1, cpAfterPos.x - cpMainPos.x)
  const angleDiff = normalizeAngle(angleBefore - angleAfter)

  const isMirrored = Math.abs(angleDiff) > Math.PI - 0.01

  return isMirrored
}

export function updateQueryParam(key: string, value: string) {
  const queryPrams = new URLSearchParams(window.location.search)
  queryPrams.set(key, value)
  window.history.replaceState(null, '', `/?${queryPrams.toString()}`)
}

export function getQueryParam(key: string): string | null {
  const queryPrams = new URLSearchParams(window.location.search)
  return queryPrams.get(key)
}

export function getCps() {
  return Array.from($cps.children) as ControlPoint[]
}

export function getMainCps() {
  return getCps().filter((p) => p.dataset.type === 'cp-main')
}
