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

export function updateBtnPos(btn: HTMLElement, x: number, y: number) {
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
