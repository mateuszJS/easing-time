import { $redoBtn, $undoBtn } from './elements'
import type { HistoryManager } from './historyManager'

export function attachHistoryEvents(history: HistoryManager) {
  // Keyboard shortcuts: Undo/Redo
  document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase()
    const cmdOrCtrl = e.metaKey || e.ctrlKey
    // Undo: Cmd/Ctrl+Z
    if (cmdOrCtrl && key === 'z' && !e.shiftKey) {
      e.preventDefault()
      history.undo()
      return
    }
    // Redo: Shift+Cmd/Ctrl+Z or Cmd/Ctrl+Y
    if ((cmdOrCtrl && key === 'z' && e.shiftKey) || (cmdOrCtrl && key === 'y')) {
      e.preventDefault()
      history.redo()
      return
    }
  })

  $undoBtn.addEventListener('click', () => history.undo())
  $redoBtn.addEventListener('click', () => history.redo())
}
