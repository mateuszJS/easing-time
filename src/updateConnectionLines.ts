import type { Point } from './types'
import { getConnectedCpHandle, getIsMirrored, getMainCps, getPos } from './utils'

function drawLine(
  $parent: SVGElement,
  p1: Point,
  p2: Point,
  isAccent: boolean,
  type: 'before' | 'after'
) {
  // do NOT use lines, gradient doesn't work on them when line is vertical
  const rect = $parent.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return

  const thicknessPx = 3

  const s1x = p1.x * rect.width
  const s1y = p1.y * rect.height
  const s2x = p2.x * rect.width
  const s2y = p2.y * rect.height
  const dx = s2x - s1x
  const dy = s2y - s1y
  const len = Math.hypot(dx, dy)
  if (len < 0.001) return

  const nx = -dy / len
  const ny = dx / len
  const ox = (nx * thicknessPx) / 2
  const oy = (ny * thicknessPx) / 2

  const ax = (s1x + ox) / rect.width
  const ay = (s1y + oy) / rect.height
  const bx = (s2x + ox) / rect.width
  const by = (s2y + oy) / rect.height
  const cx = (s2x - ox) / rect.width
  const cy = (s2y - oy) / rect.height
  const dx2 = (s1x - ox) / rect.width
  const dy2 = (s1y - oy) / rect.height

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.classList.add('handle-line')
  path.setAttribute('d', `M ${ax} ${ay} L ${bx} ${by} L ${cx} ${cy} L ${dx2} ${dy2} Z`)
  path.setAttribute('fill', isAccent ? 'var(--accent-altern)' : `url(#grad-handler-line-${type})`)
  $parent.appendChild(path)
}

export default function updateConnectionLines($parent: SVGElement) {
  $parent.querySelectorAll('.handle-line').forEach((l) => l.remove())
  // Draw handle connection lines: cp-before — cp — cp-after
  getMainCps().forEach((p) => {
    const prev = getConnectedCpHandle(p, 'cp-before')
    const next = getConnectedCpHandle(p, 'cp-after')

    const isMirrored = prev && next ? getIsMirrored(prev, p, next) : false

    if (prev) {
      const p1 = getPos(prev)
      const p2 = getPos(p)
      drawLine($parent, p1, p2, isMirrored, 'before')
    }

    if (next) {
      const p1 = getPos(p)
      const p2 = getPos(next)
      drawLine($parent, p1, p2, isMirrored, 'after')
    }
  })
}
