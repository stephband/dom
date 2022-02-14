
// Not true in iPhone iOS.
export const fullscreenEnabled = document.fullscreenEnabled
    || document.mozFullscreenEnabled
    || document.webkitFullscreenEnabled
    || document.msFullscreenEnabled ;

export function getFullscreenElement() {
    return document.fullscreenElement
        || document.webkitFullscreenElement
        || document.mozFullScreenElement
        || document.msFullscreenElement ;
}

export function enterFullscreen(node) {
    return node.requestFullscreen ? node.requestFullscreen() :
        node.webkitRequestFullscreen ? node.webkitRequestFullscreen() :
        node.mozRequestFullScreen ? node.mozRequestFullScreen() :
        node.msRequestFullscreen ? node.msRequestFullscreen() :
        undefined ;
}

export function exitFullscreen() {
    document.exitFullscreen ? document.exitFullscreen() :
    document.webkitExitFullscreen ? document.webkitExitFullscreen() :
    document.mozCancelFullScreen ? document.mozCancelFullScreen() :
    document.msExitFullscreen ? document.msExitFullscreen() :
    undefined ;
}
