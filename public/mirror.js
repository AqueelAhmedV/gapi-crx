document.addEventListener('DOMContentLoaded', () => {
    let mirrorEl = document.getElementById('mirror')
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then((videoSm) => {
        mirrorEl.srcObject = videoSm
    })
})