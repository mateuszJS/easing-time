export function getPos(btn: HTMLElement) {
  return { x: parseFloat(btn.dataset.x!), y: parseFloat(btn.dataset.y!) }
}

export function getMainCp(p: HTMLButtonElement) {
  const potentialMirrorCp =
    p.dataset.type === 'cp-before'
      ? (p.nextElementSibling as HTMLButtonElement | null)
      : (p.previousElementSibling as HTMLButtonElement | null)

  if (!potentialMirrorCp || potentialMirrorCp.dataset.type !== 'cp') {
    throw Error('Main control point not found')
  }
  return potentialMirrorCp
}

export function getMirrorCp(p: HTMLButtonElement) {
  const potentialMirrorCp =
    p.dataset.type === 'cp-before'
      ? (p.nextElementSibling?.nextElementSibling as HTMLButtonElement | null)
      : (p.previousElementSibling?.previousElementSibling as HTMLButtonElement | null)

  if (potentialMirrorCp && potentialMirrorCp.dataset.type !== 'cp') {
    return potentialMirrorCp
  }
}
