/**
element.scrollIntoView()

Monkey patches Element.scrollIntoView to support smooth scrolling options.
https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView
**/

import expOut   from '../../fn/modules/maths/exponential-out.js';
import noop     from '../../fn/modules/noop.js';
import animate  from '../modules/animate.js';
import rect     from '../modules/rect.js';
import features from '../modules/features.js';

const DEBUG = true;

// Duration and easing of scroll animation
const config = {
    scrollDuration: 0.3,
    scrollDurationPerHeight: 0.125,
    scrollTransform: expOut(3)
};

if (!features.scrollBehavior) {
    console.log('Polyfilling Element.scrollIntoView(options).');

    let cancel = noop;

    // Get the method from HTMLElement - in some browsers it is here rather
    // than on Element
    const constructor    = 'scrollIntoView' in Element.prototype ? Element : HTMLElement ;
    const scrollIntoView = constructor.scrollIntoView;
    const scrollToNode   = function scrollToNode(target, scrollParent, behavior) {
        // If element does not scroll with content
        if (getComputedStyle(target).position === 'fixed') {
            if (DEBUG) { console.log('Target is position: fixed, cannot scroll to.') }
            return;
        }

        const targetBox         = rect(target);
        const style             = getComputedStyle(scrollParent);
        const scrollPaddingLeft = parseInt(style.scrollPaddingLeft, 10);
        const scrollPaddingTop  = parseInt(style.scrollPaddingTop, 10);

        const parentBox       = rect(scrollParent);      
        const coords          = [targetBox.left - parentBox.left, targetBox.top - parentBox.top];
        const scrollWidth     = scrollParent.scrollWidth;
        const scrollHeight    = scrollParent.scrollHeight;

        const scrollBoxWidth  = scrollParent === document.body ?
            // We cannot guarantee that body height is 100%. Use the window
            // innerHeight instead.
            window.innerWidth :
            parentBox.width ;

        const scrollBoxHeight = scrollParent === document.body ?
            // We cannot guarantee that body height is 100%. Use the window
            // innerHeight instead.
            window.innerHeight :
            parentBox.height ;

        const left = (coords[0] - scrollPaddingLeft) > (scrollWidth - scrollBoxWidth) ?
                scrollWidth - scrollBoxWidth :
                (scrollParent.scrollLeft + coords[0] - scrollPaddingLeft) ;

        const top = (coords[1] - scrollPaddingTop) > (scrollHeight - scrollBoxHeight) ?
            scrollHeight - scrollBoxHeight :
            (scrollParent.scrollTop + coords[1] - scrollPaddingTop) ;

        cancel();

        const scrollLeft = left < 0 ?
            0 :
        left > scrollWidth - scrollBoxWidth ?
            scrollWidth - scrollBoxWidth :
        left ;

        const scrollTop = top < 0 ?
            0 :
        top > scrollHeight - scrollBoxHeight ?
            scrollHeight - scrollBoxHeight :
        top ;

        if (behavior === 'smooth') {
            console.log('ANIMATE', config.scrollTransform, 'scrollTop', scrollParent, scrollTop);

            //const scrollDuration = config.scrollDuration
            //    + config.scrollDurationPerHeight
            //    * Math.abs(scrollTop - scrollParent.scrollTop)
            //    / scrollBoxHeight ;
    
            //cancel = animate(0.3, config.scrollTransform, 'scrollLeft', scrollParent, scrollLeft);
            cancel = animate(0.3, config.scrollTransform, 'scrollTop', scrollParent, scrollTop);
        }
        else {
            scrollParent.scrollLeft = scrollLeft ;
            scrollParent.scrollTop  = scrollTop ;
        }
    };

    constructor.prototype.scrollIntoView = function(options) {
        if (typeof options === 'object') {
            if (options.block && options.block !== 'start') {
                console.warn('Element.scrollIntoView polyfill only supports options.block value "start"');
            }

            if (options.inline && options.inline !== 'start') {
                console.warn('Element.scrollIntoView polyfill only supports options.inline value "start"');
            }

            let scrollParent;

            // Where this has been slotted into a shadow DOM that acts as a 
            // scroll parent we won't find it by traversing the DOM up. To 
            // mitigate pass in a decidedly non-standard  scrollParent option.
            if (options.scrollParent) {
                scrollParent = options.scrollParent;
            }
            else {
                scrollParent = this;
    
                while((scrollParent = scrollParent.parentNode)) {
                    if (scrollParent === document.body || scrollParent === document.documentElement || scrollParent === document || scrollParent === window) {
                        scrollParent = document.scrollingElement;
                        break;
                    }
    
                    if (scrollParent.scrollHeight > scrollParent.clientHeight 
                     || scrollParent.scrollWidth > scrollParent.clientWidth) {
                        break;
                    }
                }
            }
            
            scrollToNode(this, scrollParent, options.behavior);
        }
        else {
            scrollIntoView.apply(this, arguments);
        }
    };
}
