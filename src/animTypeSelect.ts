import { $animationType } from './elements'
import { getQueryParam, setCssVar, updateQueryParam } from './utils'

export function initAnimTypeSelect(onUpdate: () => void) {
  const allowedAnimTypes = ['translate', 'rotate', 'scale']
  const initialAnimType = getQueryParam('animType')

  $animationType.value =
    initialAnimType && allowedAnimTypes.includes(initialAnimType) ? initialAnimType : 'translate'

  const syncState = () => {
    setCssVar('--anim-type', `--${$animationType.value}-keyframes`)
    updateQueryParam('animType', $animationType.value)
    onUpdate()
  }

  $animationType.addEventListener('change', syncState)

  syncState()
}
