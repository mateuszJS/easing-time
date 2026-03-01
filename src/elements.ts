import type { NumberInput } from './number-input'

export const $undo = document.querySelector<HTMLButtonElement>('#undo')!
export const $redo = document.querySelector<HTMLButtonElement>('#redo')!
export const $breakHandles = document.querySelector<HTMLButtonElement>('#break-handles')!
export const $mirrorHandles = document.querySelector<HTMLButtonElement>('#mirror-handles')!
export const $deletePoint = document.querySelector<HTMLButtonElement>('#delete-point')!

export const $splinePreview = document.querySelector<SVGSVGElement>('.spline-preview')!
export const $cps = document.querySelector<HTMLElement>('.cps')!
export const $panZoomArea = document.querySelector<HTMLElement>('#pan-zoom-area')!
export const $cpPreview = document.querySelector<HTMLElement>('#cp-preview')!
export const $startValue = document.querySelector<NumberInput>('[data-name="start-value"]')!
export const $endValue = document.querySelector<NumberInput>('[data-name="end-value"]')!
export const $rulerY = document.querySelector<HTMLElement>('.ruler-y')!
export const $cpCoords = document.querySelector<HTMLElement>('#cp-coords')!
export const $graphSpaceStart = document.querySelector<HTMLElement>('#graph-space-start')!
export const $graphSpaceEnd = document.querySelector<HTMLElement>('#graph-space-end')!
export const $timeBlockerBack = document.querySelector<HTMLElement>('#time-blocker-back')!
export const $timeBlockerForward = document.querySelector<HTMLElement>('#time-blocker-forward')!

export const $codeSnippet = document.querySelector<HTMLTextAreaElement>('#code-snippet')!
export const $animationLoop = document.querySelector<HTMLInputElement>('#animation-loop')!
export const $animationTime = document.querySelector<NumberInput>('[data-name="animation-time"]')!
export const $funcPrecision = document.querySelector<NumberInput>('[data-name="func-precision"]')!
export const $decimalPoint = document.querySelector<NumberInput>('[data-name="decimal-point"]')!
export const $copyCode = document.querySelector<HTMLButtonElement>('#copy-code')!
export const $codeSize = document.querySelector<HTMLSpanElement>('#code-size')!

export const $previewTargetBox = document.querySelector<HTMLElement>('#preview-target-box')!
export const $timeline = document.querySelector<HTMLInputElement>('#timeline')!
export const $splineAnimProgress = document.querySelector<HTMLDivElement>('#spline-anim-progress')!
export const $animStatePlay = document.querySelector<HTMLButtonElement>('#anim-state-play')!
export const $animStatePause = document.querySelector<HTMLButtonElement>('#anim-state-pause')!
