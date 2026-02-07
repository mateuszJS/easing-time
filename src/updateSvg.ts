import { $splinePreview, $codeSnippet } from './elements'
import type { ControlPoint, Point } from './types'
import updateConnectionLines from './updateConnectionLines'
import { getPos, setCssVar } from './utils'
import { getCubicForSegment } from './cubicBezierCurve'

const $pathExact = $splinePreview.querySelector('#path-exact')!
const $pathApprox = $splinePreview.querySelector('#path-approx')!

export function updateSvg(cps: ControlPoint[], approxPointsList: Point[]) {
  const mainCps = cps.filter((cp) => cp.dataset.type === 'cp-main')
  const [startMain] = mainCps
  const startPos = getPos(startMain)
  let d = `M ${startPos.x} ${startPos.y}`

  for (let i = 0; i < mainCps.length - 1; i++) {
    const cubic = getCubicForSegment(mainCps, i)
    const { p1, p2, p3 } = cubic
    d += ` C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`
  }
  $pathExact.setAttribute('d', d)

  updateConnectionLines($splinePreview, cps)

  // Build approximate path as straight line segments (M + L commands)
  if (approxPointsList.length > 0) {
    const pts = [...approxPointsList].sort((a, b) => a.x - b.x)
    const [first, ...rest] = pts
    let approxD = `M ${first.x} ${first.y}`
    rest.forEach((p) => {
      approxD += ` L ${p.x} ${p.y}`
    })
    $pathApprox.setAttribute('d', approxD)

    // Build CSS linear() easing string: y values with x% breakpoints (invert y)
    const round = (n: number, decimals = 6) => {
      const f = Math.pow(10, decimals)
      return Math.round(n * f) / f
    }
    const roundPct = (n: number, decimals = 3) => {
      const f = Math.pow(10, decimals)
      return Math.round(n * f) / f
    }

    const startY = round(1 - first.y)
    const endY = round(1 - pts[pts.length - 1].y)
    const intermediates = pts.slice(1, -1)

    const parts: string[] = []
    parts.push(String(startY))
    intermediates.forEach((p) => {
      const y = round(1 - p.y)
      const xPct = roundPct(p.x * 100)
      parts.push(`${y} ${xPct}%`)
    })
    parts.push(String(endY))

    $codeSnippet.textContent = `linear(${parts.join(', ')})`
    setCssVar('--easing-func', $codeSnippet.textContent)
  } else {
    $pathApprox.setAttribute('d', '')
    $codeSnippet.textContent = 'linear(0, 1)'
  }
}
