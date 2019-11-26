// dom.fullscreenable

import { noop } from '../../fn/module.js';
import { matches } from '../module.js';
import { handlers } from './dom-activate.js';

var match = matches('.fullscreenable, [fullscreenable]');

function fullscreenElement() {
    return document.fullscreenElement
        || document.webkitFullscreenElement
        || document.mozFullScreenElement
        || document.msFullscreenElement ;
}

function enterFullscreen(node) {
    return node.requestFullscreen ? node.requestFullscreen() :
        node.webkitRequestFullscreen ? node.webkitRequestFullscreen() :
        node.mozRequestFullScreen ? node.mozRequestFullScreen() :
        node.msRequestFullscreen ? node.msRequestFullscreen() :
        undefined ;
}

function exitFullscreen() {
    document.exitFullscreen ? document.exitFullscreen() :
    document.webkitExitFullscreen ? document.webkitExitFullscreen() :
    document.mozCancelFullScreen ? document.mozCancelFullScreen() :
    document.msExitFullscreen ? document.msExitFullscreen() :
    noop() ;
}

handlers.push(function(node, e) {
    if (!match(node)) {
        // Return flag as not handled
        return false;
    }

    var fullscreenNode = fullscreenElement();
    if (fullscreenNode) {
        exitFullscreen();

        if (node === fullscreenNode) {
            // Flag as handled
            return true;
        }
    }

    enterFullscreen(node);

    // Flag as handled
    return true;
});
