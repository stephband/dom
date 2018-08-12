export default function fullscreen(node) {
    // Find the right method and call it
    return node.requestFullscreen ? node.requestFullscreen() :
        node.webkitRequestFullscreen ? node.webkitRequestFullscreen() :
        node.mozRequestFullScreen ? node.mozRequestFullScreen() :
        node.msRequestFullscreen ? node.msRequestFullscreen() :
        undefined ;
}
