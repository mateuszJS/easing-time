import { drawSmoothPathShadow } from './drawSmoothPath'
import {
  $pathShadow,
  $shadowConnectionLines,
  $shadowCps,
  $urlShadow,
  $urlShadowErase,
} from './elements'
import { extractCps } from './initialCps'
import { setItemLocalStorage } from './utils'

const localStorageKey = 'easing-creator-url-shadow'

const storageShadowCps = localStorage.getItem(localStorageKey) || ''
const initialShadowCps = extractCps(storageShadowCps)

if (initialShadowCps) {
  drawSmoothPathShadow(initialShadowCps)
  $urlShadow.value = storageShadowCps
}

function clearUrl() {
  $urlShadow.value = ''
  $urlShadow.removeAttribute('aria-errormessage')
  $urlShadow.removeAttribute('aria-invalid')
  $shadowCps.innerHTML = ''
  $shadowConnectionLines.innerHTML = ''
  $pathShadow.setAttribute('d', '')
  setItemLocalStorage(localStorageKey, '')
}

$urlShadow.addEventListener('input', () => {
  $shadowCps.innerHTML = ''
  $shadowConnectionLines.innerHTML = ''
  $pathShadow.setAttribute('d', '')

  if (!$urlShadow.value.trim()) {
    $urlShadow.removeAttribute('aria-errormessage')
    $urlShadow.removeAttribute('aria-invalid')
    setItemLocalStorage(localStorageKey, '')
    return
  }

  const cps = extractCps($urlShadow.value)
  if (!cps) {
    $urlShadow.ariaInvalid = 'true'
    $urlShadow.setAttribute('aria-errormessage', 'error-url-shadow-input')
    setItemLocalStorage(localStorageKey, '')
  } else {
    $urlShadow.removeAttribute('aria-errormessage')
    $urlShadow.removeAttribute('aria-invalid')
    drawSmoothPathShadow(cps)
    setItemLocalStorage(localStorageKey, $urlShadow.value)
  }
})

$urlShadow.addEventListener('blur', () => {
  if ($urlShadow.hasAttribute('aria-invalid')) {
    clearUrl()
  }
})

$urlShadowErase.addEventListener('click', () => {
  clearUrl()
})
