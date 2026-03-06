import { getCubicForSegment } from './cubicBezierCurve'
import {
  $pathExact,
  $pathShadow,
  $shadowConnectionLines,
  $shadowCps,
  $splinePreview,
} from './elements'
import type { ControlPoint, SerializedControlPoint } from './types'
import { drawLine } from './updateConnectionLines'
import { getPos, updateHtmlPos } from './utils'

export function drawSmoothPath(cps: ControlPoint[]) {
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
}

function addShadowCp(x: number, y: number, type: 'cp-main' | 'cp-before' | 'cp-after') {
  const shadowCp = document.createElement('div')
  shadowCp.dataset.type = `shadow-${type}`
  updateHtmlPos(shadowCp, x, y)
  $shadowCps.appendChild(shadowCp)
}

export function drawSmoothPathShadow(cps: SerializedControlPoint[]) {
  // $shadowConnectionLines.innerHTML = ''
  $splinePreview.querySelectorAll('[data-type^="shadow-cp-"]').forEach((l) => l.remove())

  const mainCps = cps.filter((cp) => cp.type === 'cp-main')

  let d = `M ${mainCps[0].x} ${mainCps[0].y}`

  addShadowCp(mainCps[0].x, mainCps[0].y, 'cp-main')

  const { width, height } = $splinePreview.getBoundingClientRect()
  if (width === 0 || height === 0) return

  for (let i = 0; i < mainCps.length - 1; i++) {
    const p0 = mainCps[i]
    const p3 = mainCps[i + 1]

    const maybeAfter = cps[cps.indexOf(p0) + 1]
    const cpAfter = maybeAfter && maybeAfter.type === 'cp-after' ? maybeAfter : null
    const maybeBefore = cps[cps.indexOf(p3) - 1]
    const cpBefore = maybeBefore && maybeBefore.type === 'cp-before' ? maybeBefore : null

    const p1 = cpAfter ? cpAfter : p0
    const p2 = cpBefore ? cpBefore : p3

    d += ` C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`

    if (cpAfter) {
      addShadowCp(cpAfter.x, cpAfter.y, 'cp-after')
      drawLine(width, height, $shadowConnectionLines, cpAfter, p0, 'shadow', 'after')
    }
    if (cpBefore) {
      addShadowCp(cpBefore.x, cpBefore.y, 'cp-before')
      drawLine(width, height, $shadowConnectionLines, cpBefore, p3, 'shadow', 'before')
    }
    addShadowCp(p3.x, p3.y, 'cp-main')
  }
  $pathShadow.setAttribute('d', d)
}
