
import './style.css'

const $sizeWrapper = document.querySelector('.editor-container')! as HTMLElement
const $splinePreview = document.querySelector('.spline-preview')! as SVGSVGElement
const $path = $splinePreview.querySelector('path')!
const $cps = document.querySelector('.cps')! as HTMLElement

// Initialize with some default points if empty
function setDefaultData() {
    createPoint('cp', 0, 1) // Start
    createPoint('cp-after', 0.5, 1)
    createPoint('cp-before', 0.5, 0)
    createPoint('cp', 1, 0) // End
}

setDefaultData()

render()

// --- Core DOM Functions ---

function createPoint(type: 'cp-before' | 'cp' | 'cp-after', x: number, y: number) {
    const btn = document.createElement('button')
    btn.dataset.type = type
    updateBtnPos(btn, x, y)
    $cps.appendChild(btn)
    initDrag(btn)
    return btn
}

function getPoints() {
    return Array.from($cps.children) as HTMLElement[]
}

function updateBtnPos(btn: HTMLElement, x: number, y: number) {
    btn.dataset.x = x.toString()
    btn.dataset.y = y.toString()
    // once firefox and safari supports attr(value, <type>) we can remove below assignments
    btn.style.left = (x * 100) + '%'
    btn.style.top = (y * 100) + '%'
}

function getPos(btn: HTMLElement) {
    return { x: parseFloat(btn.dataset.x!), y: parseFloat(btn.dataset.y!) }
}

// --- Rendering ---
// This relies purely on the DOM state of buttons
function render() {
    const points = getPoints()

   
    
    // Clear old lines visualization
    $splinePreview.querySelectorAll('line.handle-line').forEach(l => l.remove())

    const [startPoint, ...restPoints] = points
    const startPointPos = getPos(startPoint)
     let d = `M ${startPointPos.x} ${startPointPos.y}`

    restPoints.forEach((pt, i) => {
        if (pt.dataset.type === 'cp') {
            const idx = i + 1
            const cp1Btn = points[idx - 2]
            const cp2Btn = points[idx - 1]

            if (cp1Btn && cp2Btn) {
                const cp1 = getPos(cp1Btn)
                const cp2 = getPos(cp2Btn)
                const curr = getPos(pt)
                d += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${curr.x} ${curr.y}`
            }
        }
    })

    // Draw handle connection lines: cp-before — cp — cp-after
    points.forEach((pt) => {
        if (pt.dataset.type === 'cp') {
            const prev = pt.previousElementSibling as HTMLElement | null
            const next = pt.nextElementSibling as HTMLElement | null

            if (prev && prev.dataset.type === 'cp-before') {
                const p1 = getPos(prev)
                const p2 = getPos(pt)
                drawLine(p1, p2)
            }

            if (next && next.dataset.type === 'cp-after') {
                const p1 = getPos(pt)
                const p2 = getPos(next)
                drawLine(p1, p2)
            }
        }
    })

    $path.setAttribute('d', d)
}

function drawLine(p1: {x:number, y:number}, p2: {x:number, y:number}) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    line.classList.add('handle-line')
    line.setAttribute('x1', p1.x.toString())
    line.setAttribute('y1', p1.y.toString())
    line.setAttribute('x2', p2.x.toString())
    line.setAttribute('y2', p2.y.toString())
    line.setAttribute('stroke', 'grey')
    line.setAttribute('stroke-width', '0.002') // Scaled to viewBox 0-1
    $splinePreview.appendChild(line)
}


// --- Interaction ---

function getMainCp(p: HTMLButtonElement) {
  const potentialMirrorCp = p.dataset.type === 'cp-before'
    ? p.nextElementSibling as HTMLButtonElement | null
    : p.previousElementSibling as HTMLButtonElement | null
  
  if (!potentialMirrorCp || potentialMirrorCp.dataset.type !== 'cp') {
    throw Error("Main control point not found")
  }
  return potentialMirrorCp
}

function getMirrorCp(p: HTMLButtonElement) {
  const potentialMirrorCp = p.dataset.type === 'cp-before'
    ? p.nextElementSibling?.nextElementSibling as HTMLButtonElement | null
    : p.previousElementSibling?.previousElementSibling as HTMLButtonElement | null
  
  if (potentialMirrorCp && potentialMirrorCp.dataset.type !== 'cp') {
    return potentialMirrorCp
  }
}

function initDrag(btn: HTMLButtonElement) {
    btn.addEventListener('pointerdown', (e) => {
        e.stopPropagation() // Prevent creating new point
        btn.setPointerCapture(e.pointerId)
        
        const onMove = (ev: PointerEvent) => {
            const rect = $sizeWrapper.getBoundingClientRect()
            let x = (ev.clientX - rect.left) / rect.width
            let y = (ev.clientY - rect.top) / rect.height
            
            // Constrain?
            // x = Math.max(0, Math.min(1, x))
            // y = Math.max(0, Math.min(1, y))

            updateBtnPos(btn, x, y)
            
            // Mirror handle logic
            const type = btn.dataset.type
            if (type === 'cp-before' || type === 'cp-after') {
                // Find partner
                const mirrorCp = getMirrorCp(btn)
                
                if (mirrorCp) {
                  const mainCp = getMainCp(btn)
                  const mainCpPos = getPos(mainCp)
                     // Mirror: Partner = 2*Center - Current
                     const px = 2 * mainCpPos.x - x
                     const py = 2 * mainCpPos.y - y
                     updateBtnPos(mirrorCp, px, py)
                }
            } else if (type === 'point') {
                // Move handles with point? 
                // For now let's just move point. Handles technically stay absolute if we don't move them.
                // Usually handles move relative to point.
                // TODO: Implement relative move if desired.
            }

            render()
        }

        const onUp = () => {
            btn.removeEventListener('pointermove', onMove)
            btn.removeEventListener('pointerup', onUp)
        }

        btn.addEventListener('pointermove', onMove as EventListener)
        btn.addEventListener('pointerup', onUp as EventListener)
    })
}

// Global click to create/split (Basic implementation for now)
$splinePreview.addEventListener('click', (e) => {
     // TODO: Implement "split curve" logic using DOM buttons insertion
     // This would require math to find closest t, split bezier, and insert new buttons in DOM order.
})
