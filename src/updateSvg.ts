import { $splinePreview, $codeSnippet } from './elements'
import type { ControlPoint, Point } from './types'
import updateConnectionLines from './updateConnectionLines'
import { getPos, setCssVar } from './utils'

const $pathExact = $splinePreview.querySelector('#path-exact')!
const $pathApprox = $splinePreview.querySelector('#path-approx')!

export function updateSvg(cps: ControlPoint[], approxPointsList: Point[]) {
  const [startCp, ...restCps] = cps
  const startCpPos = getPos(startCp)
  let d = `M ${startCpPos.x} ${startCpPos.y}`

  restCps.forEach((cp, i) => {
    if (cp.dataset.type === 'cp-main') {
      const idx = i + 1
      const cp1Btn = cps[idx - 2]
      const cp2Btn = cps[idx - 1]

      if (cp1Btn && cp2Btn) {
        const cp1 = getPos(cp1Btn)
        const cp2 = getPos(cp2Btn)
        const curr = getPos(cp)
        d += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${curr.x} ${curr.y}`
      }
    }
  })
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
