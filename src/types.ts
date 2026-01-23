export interface Point {
  x: number
  y: number
}

export interface ControlPoint extends HTMLButtonElement {
  previousElementSibling: ControlPoint | null
  nextElementSibling: ControlPoint | null

  addEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (this: ControlPoint, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void
  removeEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (this: ControlPoint, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void
}
