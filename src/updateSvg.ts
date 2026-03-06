import { $splinePreview, $codeSnippet, $codeSize, $pathApprox } from './elements'
import type { ControlPoint, Point } from './types'
import updateConnectionLines from './updateConnectionLines'
import { setCssVar } from './utils'
import { NORM_MIN_DECIMAL_POINT } from './consts'
import { drawSmoothPath } from './drawSmoothPath'

export function updateSvg(cps: ControlPoint[], approxPointsList: Point[], decimal: number) {
  const toDecimalFloat = (num: number) => +num.toFixed(decimal + NORM_MIN_DECIMAL_POINT)
  drawSmoothPath(cps)
  updateConnectionLines($splinePreview)

  // Build approximate path as straight line segments (M + L commands)
  if (approxPointsList.length > 0) {
    const pts = [...approxPointsList].sort((a, b) => a.x - b.x)
    const [first, ...rest] = pts
    let approxD = `M ${first.x} ${first.y}`
    rest.forEach((p) => {
      approxD += ` L ${p.x} ${p.y}`
    })
    $pathApprox.setAttribute('d', approxD)

    const toDecimalPerc = (num: number) => +num.toFixed(decimal)
    const startY = toDecimalFloat(1 - first.y)
    const endY = toDecimalFloat(1 - pts[pts.length - 1].y)
    const intermediates = pts.slice(1, -1)

    const parts: string[] = []
    parts.push(String(toDecimalFloat(startY)))
    intermediates.forEach((p) => {
      const y = toDecimalFloat(1 - p.y)
      const xPct = toDecimalPerc(p.x * 100)
      parts.push(`${toDecimalFloat(y)} ${toDecimalPerc(xPct)}%`)
    })
    parts.push(String(toDecimalFloat(endY)))

    const animCode = `linear(${parts.join(', ')})`
    $codeSnippet.value = `animation-timing-function: ${animCode};\n/* ${window.location.href} */`
    $codeSize.textContent = animCode.length.toString()

    setCssVar('--easing-func', animCode)
  } else {
    $pathApprox.setAttribute('d', '')
    $codeSnippet.value = 'linear(0, 1)'
    $codeSize.textContent = `animation-timing-function: ${$codeSnippet.value.length.toString()};`
    setCssVar('--easing-func', $codeSnippet.value)
  }
}
