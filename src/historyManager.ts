import { $redoBtn, $undoBtn } from './elements'
import type { SerializedControlPoint } from './types'

export class HistoryManager<T = SerializedControlPoint[]> {
  private past: T[] = []
  private future: T[] = []
  private getState: () => T
  private applyState: (state: T) => void

  constructor(opts: { getState: () => T; applyState: (state: T) => void }) {
    this.getState = opts.getState
    this.applyState = opts.applyState
  }

  // Record a new snapshot (clears redo stack)
  record(): void {
    const snapshot = this.getState()
    this.past.push(snapshot)
    this.future.length = 0
    this.updateButtons()
  }

  updateButtons(): void {
    $undoBtn.disabled = !this.canUndo()
    $redoBtn.disabled = !this.canRedo()
  }

  canUndo(): boolean {
    return this.past.length > 1
  }

  canRedo(): boolean {
    return this.future.length > 0
  }

  undo(): void {
    if (!this.canUndo()) return
    const current = this.past.pop()!
    this.future.push(current)
    const prev = this.past[this.past.length - 1]
    this.applyState(prev)
    this.updateButtons()
  }

  redo(): void {
    if (!this.canRedo()) return
    const next = this.future.pop()!
    this.past.push(next)
    this.applyState(next)
    this.updateButtons()
  }
}
