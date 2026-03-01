import { getQueryParam, setCssVar, updateQueryParam } from './utils'

type ValidaitonErr = 'nan' | 'min' | 'max'

export class NumberInput extends HTMLElement {
  static observedAttributes = ['label', 'min', 'max', 'name']

  value: number
  onChange: VoidFunction | null = null

  #name: string
  #$input: HTMLInputElement
  #$errorMsg: HTMLSpanElement

  constructor() {
    super()

    const { label, min, max, name, defaultValue, step, side } = this.dataset

    if (!min) throw new Error('Min is required')
    if (!max) throw new Error('Max is required')
    if (!name) throw new Error('Name is required')
    if (!defaultValue) throw new Error('Default value is required')

    this.#name = name

    this.#$input = document.createElement('input')
    this.#$input.type = 'number'
    this.#$input.min = min
    this.#$input.max = max
    this.#$input.name = name
    this.#$input.id = name
    this.#$input.step = step || '1'

    const fieldset = document.createElement('fieldset')
    fieldset.setAttribute('aria-hidden', 'true')

    if (label) {
      const $label = document.createElement('label')
      $label.textContent = label
      $label.htmlFor = name
      this.appendChild($label)

      const $legend = document.createElement('legend')
      $legend.textContent = label
      fieldset.appendChild($legend)
    }

    this.#$errorMsg = document.createElement('span')
    this.#$errorMsg.role = 'tooltip'
    if (side) {
      this.#$errorMsg.setAttribute('data-side', side)
    }
    this.#$errorMsg.id = `error-${name}`

    this.appendChild(this.#$input)
    this.appendChild(fieldset)
    this.appendChild(this.#$errorMsg)

    const qs = getQueryParam(name)
    this.value = 0 // just to get rid of TS issues
    if (qs && !this.#isError(qs)) {
      this.#setValue(Number(qs))
    } else {
      this.#setValue(Number(defaultValue))
    }
    this.#$input.value = this.value.toString()

    this.#$input.addEventListener('input', () => {
      const err = this.#isError(this.#$input.value)

      if (err) {
        this.#setErrorMsg(err)
      } else {
        this.#setErrorMsg(null)
      }

      if (this.#isError(this.#$input.value)) {
        return
      }

      this.#setValue(Number(this.#$input.value))
    })

    this.#$input.addEventListener('blur', () => {
      const err = this.#isError(this.#$input.value)

      if (err) {
        switch (err) {
          case 'nan':
            this.#setValue(Number(defaultValue))
            break
          case 'min':
            this.#setValue(Math.max(this.#$input.valueAsNumber, Number(min)))
            break
          case 'max':
            this.#setValue(Math.min(this.#$input.valueAsNumber, Number(max)))
            break
        }
      }
      this.#$input.valueAsNumber = this.value
      this.#setErrorMsg(null)
    })
  }

  #isError(value: string) {
    if (value.trim() === '') return 'nan'

    const num = Number(value)
    if (!Number.isFinite(num)) return 'nan'

    const { min, max } = this.dataset
    if (num < Number(min)) return 'min'
    if (num > Number(max)) return 'max'

    return null
  }

  #setErrorMsg(err: ValidaitonErr | null) {
    if (err) {
      switch (err) {
        case 'nan':
          this.#$errorMsg.textContent = 'Value has to be a number'
          break
        case 'min':
          this.#$errorMsg.textContent = `Value has to be greater or equal ${this.dataset.min}`
          break
        case 'max':
          this.#$errorMsg.textContent = `Value has to be less or equal ${this.dataset.max}`
          break
      }

      this.#$input.ariaInvalid = 'true'
      this.#$input.setAttribute('aria-errormessage', this.#$errorMsg.id)
    } else {
      // do not remvoe textContent because animation needs to end
      this.#$input.removeAttribute('aria-errormessage')
      this.#$input.removeAttribute('aria-invalid')
    }
  }

  #setValue(value: number) {
    this.value = value
    if (this.dataset.cssvar) {
      setCssVar(this.dataset.cssvar, this.value)
    }
    updateQueryParam(this.#name, this.value.toString())
    this.onChange?.()
  }
}

window.customElements.define('number-input', NumberInput)
