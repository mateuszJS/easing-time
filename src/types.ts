export interface Point {
  x: number
  y: number
}

export type CpType = 'cp-before' | 'cp-main' | 'cp-after'

export interface ControlPoint extends HTMLButtonElement {
  previousElementSibling: ControlPoint | null
  nextElementSibling: ControlPoint | null
  dataset: {
    type: CpType
    x: string
    y: string
  }

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

export type SerializedControlPoint = {
  type: CpType
  x: number
  y: number
}
