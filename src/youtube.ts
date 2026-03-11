import type { LiteYTEmbed } from 'lite-youtube-embed'
import 'lite-youtube-embed/src/lite-yt-embed.css'
import 'lite-youtube-embed/src/lite-yt-embed.js'

const $player = document.querySelector<LiteYTEmbed>('#video-instruction lite-youtube')!
const videoId = $player.getAttribute('videoid')!

const $instructionsDialog = document.querySelector<HTMLDialogElement>('#video-instruction')!

const $howToUseCodeBtns = document.querySelectorAll('[commandfor="video-instruction"]')!

let ytPlayerPromise: Promise<YT.Player> | null = null

function getYtPlayer() {
  ytPlayerPromise ??= $player.getYTPlayer().then((player) => {
    player.pauseVideo()
    return player
  })

  return ytPlayerPromise
}

async function cuePlayerAt(startSeconds: number) {
  const player = await getYtPlayer()
  player.cueVideoById(videoId, startSeconds)
}

$howToUseCodeBtns.forEach(($btn) => {
  $btn.addEventListener('click', () => {
    const startSeconds = $btn.id === 'how-to-use' ? 313 : 0
    void cuePlayerAt(startSeconds)
  })
})

$instructionsDialog.addEventListener('close', () => {
  void getYtPlayer().then((player) => {
    player.pauseVideo()
  })
})
