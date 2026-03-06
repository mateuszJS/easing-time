import { drawSmoothPathShadow } from './drawSmoothPath'
import { $shadowCps, $urlShadow } from './elements'
import { extractCps } from './initialCps'
import { setItemLocalStorage } from './utils'

const localStorageKey = 'easing-creator-url-shadow'

const storageShadowCps = localStorage.getItem(localStorageKey) || ''
const initialShadowCps = extractCps(storageShadowCps)

if (initialShadowCps) {
  drawSmoothPathShadow(initialShadowCps)
  $urlShadow.value = storageShadowCps
}

$urlShadow.addEventListener('input', () => {
  $shadowCps.innerHTML = ''

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
    $urlShadow.value = ''
    $urlShadow.removeAttribute('aria-errormessage')
    $urlShadow.removeAttribute('aria-invalid')
    $shadowCps.innerHTML = ''
    setItemLocalStorage(localStorageKey, '')
  }
})
