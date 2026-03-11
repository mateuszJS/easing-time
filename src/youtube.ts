import type { LiteYTEmbed } from 'lite-youtube-embed'
import 'lite-youtube-embed/src/lite-yt-embed.css'
import 'lite-youtube-embed/src/lite-yt-embed.js'

const $player = document.querySelector<LiteYTEmbed>('lite-youtube')!
const ytPlayer = await $player?.getYTPlayer()
ytPlayer.pauseVideo()

const $insturctionsDialog = document.querySelector<HTMLDialogElement>('#video-instruction')!

const $howToUseCodeBtns = document.querySelectorAll('[commandfor="video-instruction"]')!

$howToUseCodeBtns.forEach(($btn) => {
  $btn.addEventListener('click', () => {
    if ($btn.id === 'how-to-use') {
      ytPlayer?.seekTo(200, true)
    } else {
      ytPlayer?.seekTo(0, true)
    }
    // ytPlayer.playVideo()
  })
})

$insturctionsDialog.addEventListener('close', () => {
  ytPlayer.pauseVideo()
})
