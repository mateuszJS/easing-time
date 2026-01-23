import type { ControlPoint } from './types'

export function getPos(btn: HTMLElement) {
  return { x: parseFloat(btn.dataset.x!), y: parseFloat(btn.dataset.y!) }
}

export function getMainCp(p: ControlPoint) {
  const potentialMirrorCp =
    p.dataset.type === 'cp-before' ? p.nextElementSibling : p.previousElementSibling

  if (!potentialMirrorCp || potentialMirrorCp.dataset.type !== 'cp') {
    throw Error('Main control point not found')
  }
  return potentialMirrorCp
}

export function getMirrorCp(p: ControlPoint) {
  const potentialMirrorCp =
    p.dataset.type === 'cp-before'
      ? p.nextElementSibling?.nextElementSibling
      : p.previousElementSibling?.previousElementSibling
  if (potentialMirrorCp && potentialMirrorCp.dataset.type !== 'cp') {
    return potentialMirrorCp
  }
}

export function updateBtnPos(btn: HTMLButtonElement, x: number, y: number) {
  btn.dataset.x = x.toString()
  btn.dataset.y = y.toString()
  // once firefox and safari supports attr(value, <type>) we can remove below assignments
  btn.style.left = x * 100 + '%'
  btn.style.top = y * 100 + '%'
}
