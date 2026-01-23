import type { ControlPoint } from './types'
import updateConnectionLines from './updateConnectionLines'
import { getPos } from './utils'

const $splinePreview = document.querySelector('.spline-preview')! as SVGSVGElement
const $path = $splinePreview.querySelector('path')!

export function updateSvgSpline(cps: ControlPoint[]) {
  const [startCp, ...restCps] = cps
  const startCpPos = getPos(startCp)
  let d = `M ${startCpPos.x} ${startCpPos.y}`

  restCps.forEach((cp, i) => {
    if (cp.dataset.type === 'cp') {
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
  $path.setAttribute('d', d)

  updateConnectionLines($splinePreview, cps)
}
