import { $connectionLines } from './elements'
import type { Point } from './types'
import { getConnectedCpHandle, getIsMirrored, getMainCps, getPos } from './utils'

const SVG_NS = 'http://www.w3.org/2000/svg'
let gradientCounter = 0

function clearLines($parent: SVGElement) {
  $parent
    .querySelectorAll('.handle-line, .shadow-handle-line, .handle-line-gradient')
    .forEach((node) => {
      node.remove()
    })
}

function createBrokenGradient($parent: SVGElement, p1: Point, p2: Point, type: 'before' | 'after') {
  const gradient = document.createElementNS(SVG_NS, 'linearGradient')
  const gradientId = `grad-handler-line-${type}-${gradientCounter++}`
  const stopColors =
    type === 'before' ?
      ['var(--accent-altern)', 'var(--neutral-300)']
    : ['var(--neutral-300)', 'var(--accent-altern)']

  gradient.classList.add('handle-line-gradient')
  gradient.id = gradientId
  gradient.setAttribute('gradientUnits', 'userSpaceOnUse')
  gradient.setAttribute('x1', `${p1.x}`)
  gradient.setAttribute('y1', `${p1.y}`)
  gradient.setAttribute('x2', `${p2.x}`)
  gradient.setAttribute('y2', `${p2.y}`)

  stopColors.forEach((color, index) => {
    const stop = document.createElementNS(SVG_NS, 'stop')
    stop.setAttribute('offset', `${index * 100}%`)
    stop.setAttribute('stop-color', color)
    gradient.appendChild(stop)
  })

  $parent.appendChild(gradient)
  return `url(#${gradientId})`
}

export function drawLine(
  $parent: SVGElement,
  p1: Point,
  p2: Point,
  stroke: 'broken' | 'mirrored' | 'shadow',
  type: 'before' | 'after'
) {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const len = Math.hypot(dx, dy)
  if (len < 0.001) return

  const line = document.createElementNS(SVG_NS, 'line')
  line.classList.add(stroke === 'shadow' ? 'shadow-handle-line' : 'handle-line')
  line.setAttribute('x1', `${p1.x}`)
  line.setAttribute('y1', `${p1.y}`)
  line.setAttribute('x2', `${p2.x}`)
  line.setAttribute('y2', `${p2.y}`)
  line.setAttribute('vector-effect', 'non-scaling-stroke')
  line.setAttribute('stroke-width', '3px')

  const mapStroke = {
    broken: createBrokenGradient($parent, p1, p2, type),
    mirrored: 'var(--accent-altern)',
    shadow: 'var(--neutral-300)',
  }

  line.setAttribute('stroke', mapStroke[stroke])
  $parent.appendChild(line)
}

export default function updateConnectionLines() {
  clearLines($connectionLines)

  // Draw handle connection lines: cp-before — cp — cp-after
  getMainCps().forEach((p) => {
    const prev = getConnectedCpHandle(p, 'cp-before')
    const next = getConnectedCpHandle(p, 'cp-after')

    const isMirrored = prev && next ? getIsMirrored(prev, p, next) : false

    if (prev) {
      const p1 = getPos(prev)
      const p2 = getPos(p)
      drawLine($connectionLines, p1, p2, isMirrored ? 'mirrored' : 'broken', 'before')
    }

    if (next) {
      const p1 = getPos(p)
      const p2 = getPos(next)
      drawLine($connectionLines, p1, p2, isMirrored ? 'mirrored' : 'broken', 'after')
    }
  })
}
