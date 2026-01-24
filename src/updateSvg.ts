import { $splinePreview } from './elements'
import type { ControlPoint, Point } from './types'
import updateConnectionLines from './updateConnectionLines'
import { getPos } from './utils'

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
  const [first, ...rest] = approxPointsList
  let approxD = `M ${first.x} ${first.y}`
  rest.forEach((p) => {
    approxD += ` L ${p.x} ${p.y}`
  })
  $pathApprox.setAttribute('d', approxD)
}
