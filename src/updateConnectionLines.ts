import type { ControlPoint, Point } from './types'
import { getIsMirrored, getPos } from './utils'

function drawLine($parent: SVGElement, p1: Point, p2: Point, isAccent: boolean) {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
  line.classList.add('handle-line')
  line.setAttribute('x1', p1.x.toString())
  line.setAttribute('y1', p1.y.toString())
  line.setAttribute('x2', p2.x.toString())
  line.setAttribute('y2', p2.y.toString())
  line.setAttribute('stroke', isAccent ? 'magenta' : 'grey')
  line.setAttribute('stroke-width', '0.0035') // Scaled to viewBox 0-1
  $parent.appendChild(line)
}

export default function updateConnectionLines($parent: SVGElement, points: ControlPoint[]) {
  $parent.querySelectorAll('line.handle-line').forEach((l) => l.remove())
  // Draw handle connection lines: cp-before — cp — cp-after
  points.forEach((pt) => {
    if (pt.dataset.type === 'cp-main') {
      const prev = pt.previousElementSibling
      const next = pt.nextElementSibling

      const isMirrored = prev && next ? getIsMirrored(prev, pt, next) : false

      if (prev && prev.dataset.type === 'cp-before') {
        const p1 = getPos(prev)
        const p2 = getPos(pt)
        drawLine($parent, p1, p2, isMirrored)
      }

      if (next && next.dataset.type === 'cp-after') {
        const p1 = getPos(pt)
        const p2 = getPos(next)
        drawLine($parent, p1, p2, isMirrored)
      }
    }
  })
}
