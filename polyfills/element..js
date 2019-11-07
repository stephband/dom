/*
Element.scrollIntoView()

Monkey patches Element.scrollIntoView to support smooth scrolling options.
https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView
*/

import { exponentialOut as expOut, noop } from '../../fn/module.js';
import { animate, box, features, offset } from '../module.js';

// Duration and easing of scroll animation
const config = {
    scrollDuration: 1.2,
    scrollTransform: expOut(4)
};

let cancel = noop;

function scrollToNode(target, behavior) {
    const scrollPaddingTop = parseInt(getComputedStyle(document.documentElement).scrollPaddingTop, 10);
    const coords = offset(document.scrollingElement, target);
    const scrollHeight = document.scrollingElement.scrollHeight;
    const scrollBoxHeight = document.scrollingElement === document.body ?
        // We cannot gaurantee that body height is 100%. Use the window
        // innerHeight instead.
        window.innerHeight :
        box(document.scrollingElement).height ;

    const top = (coords[1] - scrollPaddingTop) > (scrollHeight - scrollBoxHeight) ?
        scrollHeight - scrollBoxHeight :
        (coords[1] - scrollPaddingTop);

    cancel();

    if (behavior === 'smooth') {
        cancel = animate(config.scrollDuration, config.scrollTransform, 'scrollTop', document.scrollingElement, top);
    }
    else {
        document.scrollingElement.scrollTop = top;
    }
}

if (!features.scrollBehavior) {
    // Get the methoid from HTMLElement - in some browsers it is here rather
    // than on Element
    const constructor    = 'scrollIntoView' in Element.prototype ? Element : HTMLElement ;
    const scrollIntoView = constructor.scrollIntoView;

    constructor.prototype.scrollIntoView = function(options) {
        if (typeof options === 'object') {
            if (options.block && options.block !== 'start') {
                console.warn('Element.scrollIntoView polyfill only supports options.block value "start"');
            }

            if (options.inline) {
                console.warn('Element.scrollIntoView polyfill does not support options.inline... add support!');
            }

            scrollToNode(this, options.behavior);
        }
        else {
            scrollIntoView.apply(this, arguments);
        }
    };
}
