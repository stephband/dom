/*
Element.scrollIntoView()

Monkey patches Element.scrollIntoView to support smooth scrolling options.
https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView
*/

import { exponentialOut as expOut, noop } from '../../fn/module.js';
import { animate, rect, features, offset } from '../module.js';

// Duration and easing of scroll animation
const config = {
    scrollDuration: 0.3,
    scrollDurationPerHeight: 0.125,
    scrollTransform: expOut(3)
};

let cancel = noop;

function scrollToNode(target, scrollParent, behavior) {
    const scrollPaddingTop = parseInt(getComputedStyle(scrollParent).scrollPaddingTop, 10);
    const coords = offset(scrollParent, target);
    const scrollHeight = scrollParent.scrollHeight;
    const scrollBoxHeight = scrollParent === document.body ?
        // We cannot gaurantee that body height is 100%. Use the window
        // innerHeight instead.
        window.innerHeight :
        rect(scrollParent).height ;

    const top = (coords[1] - scrollPaddingTop) > (scrollHeight - scrollBoxHeight) ?
        scrollHeight - scrollBoxHeight :
        (scrollParent.scrollTop + coords[1] - scrollPaddingTop) ;

    cancel();

    const scrollTop = top < 0 ?
        0 :
    top > scrollHeight - scrollBoxHeight ?
        scrollHeight - scrollBoxHeight :
    top ;

    if (behavior === 'smooth') {
        const scrollDuration = config.scrollDuration
            + config.scrollDurationPerHeight
            * Math.abs(scrollTop - scrollParent.scrollTop)
            / scrollBoxHeight ;

        cancel = animate(scrollDuration, config.scrollTransform, 'scrollTop', scrollParent, scrollTop);
    }
    else {
        scrollParent.scrollTop = scrollTop ;
    }
}

if (!features.scrollBehavior) {
    console.log('Polyfilling Element.scrollIntoView(options).');

    // Get the method from HTMLElement - in some browsers it is here rather
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

            let scrollParent = this;

            while((scrollParent = scrollParent.parentNode)) {
                if (scrollParent === document.body || scrollParent === document.documentElement) {
                    scrollParent = document.scrollingElement;
                    break;
                }

                if (scrollParent.scrollHeight > scrollParent.clientHeight) {
                    break;
                }
            }

            scrollToNode(this, scrollParent, options.behavior);
        }
        else {
            scrollIntoView.apply(this, arguments);
        }
    };
}
