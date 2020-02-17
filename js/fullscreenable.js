/*
fullscreenable

Links refering to [fullscreenable] elements put those elements into
fullscreen mode when clicked.

Fullscreen capability is not reliably queried in CSS (through @supports or
other means), so this script also adds the class `fullscreen-support` to the
document root in navigators where support is detected, for styling of UI that
depends on fullscreen support.
*/

import { matches } from '../module.js';
import { handlers } from './dom-activate.js';

const match = matches('.fullscreenable, [fullscreenable]');
const fullscreenEnabled = document.fullscreenEnabled
    || document.mozFullscreenEnabled
    || document.webkitFullscreenEnabled
    || document.msFullscreenEnabled ;

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
    undefined ;
}

if (fullscreenEnabled) {
    // This should really be accessible to CSS via an @supports query or some
    // such, but it is not, or not in a way that works. Add a supports class.
    document.documentElement.classList.add('fullscreen-support');

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
}
