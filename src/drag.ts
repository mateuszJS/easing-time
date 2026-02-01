import type { Point, ControlPoint } from './types'

export interface Drag {
  initialPos: Point
  cp: ControlPoint | null
  isMirroringHandles: boolean
}

export const DRAG_INITIAL: Drag = Object.freeze({
  initialPos: { x: 0, y: 0 },
  cp: null,
  isMirroringHandles: false,
})
