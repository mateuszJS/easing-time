export class ToolTip extends HTMLElement {
  constructor() {
    super()

    const { id, content } = this.dataset

    if (!id) throw new Error('Id is required')
    if (!content) throw new Error('Content is required')

    this.role = 'tooltip'
    this.id = id
    this.textContent = content
  }
}

window.customElements.define('tool-tip', ToolTip)
