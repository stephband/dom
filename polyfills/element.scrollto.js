/**
element.scrollTo()

Monkey patches `Element.scrollTo()` to support smooth scrolling options.
https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollTo
**/

import expOut   from '../../fn/modules/maths/exponential-out.js';
import noop     from '../../fn/modules/noop.js';
import animate  from '../modules/animate.js';
import rect     from '../modules/rect.js';

// Duration and easing of scroll animation
const config = {
    scrollDuration: 0.3,
    scrollDurationPerHeight: 0.125,
    scrollTransform: expOut(3)
};

let cancel = noop;

function scrollToPosition(scrollParent, options) {
    if (options.behavior === 'smooth') {
        // Switch off scroll snap
        const scrollSnapType = scrollParent.style.getPropertyValue('scroll-snap-type');
        const undoScrollSnap = () => {
            // Undoing scroll-snap has a nasty habit of resetting scroll position
            // in Safari 13. Make sure we can rereset it.
            const scrollLeft = scrollParent.scrollLeft;
            const scrollTop  = scrollParent.scrollTop;
            scrollParent.style.setProperty('scroll-snap-type', scrollSnapType);
            scrollParent.scrollLeft = scrollLeft;
            scrollParent.scrollTop  = scrollTop;
        };

        scrollParent.style.setProperty('scroll-snap-type', 'none');

        if (options.left !== undefined) {
            const scrollBoxWidth = scrollParent === document.body ?
                // We cannot guarantee that body width is 100%. Use the window
                // innerHeight instead.
                window.innerWidth :
                rect(scrollParent).width ;

            const scrollDuration = config.scrollDuration
                + config.scrollDurationPerHeight
                * Math.abs(options.left - scrollParent.scrollLeft)
                / scrollBoxWidth ;

            // duration, transform, name, object, value, endFn
            cancel = animate(scrollDuration, config.scrollTransform, 'scrollLeft', scrollParent, options.left, undoScrollSnap);
        }
        else {
            const scrollBoxHeight = scrollParent === document.body ?
                // We cannot guarantee that body height is 100%. Use the window
                // innerHeight instead.
                window.innerHeight :
                rect(scrollParent).height ;

            const scrollDuration = config.scrollDuration
                + config.scrollDurationPerHeight
                * Math.abs(options.top - scrollParent.scrollTop)
                / scrollBoxHeight ;

            cancel = animate(scrollDuration, config.scrollTransform, 'scrollTop', scrollParent, options.top, undoScrollSnap);
        }
    }
    else {
        options.left !== undefined && (scrollParent.scrollLeft = options.left) ;
        options.top  !== undefined && (scrollParent.scrollTop  = options.top) ;
    }
}

if (!('scrollBehavior' in document.documentElement.style)) {
    window.console && console.log('Polyfilling Element.scrollTo(options)');

    // Get the method from HTMLElement - in some browsers it is here rather
    // than on Element
    const constructor = 'scrollTo' in Element.prototype ? Element : HTMLElement ;
    const scrollTo    = constructor.scrollIntoView;

    constructor.prototype.scrollTo = function(options) {
        if (typeof options === 'object') {
            scrollToPosition(this, options);
        }
        else {
            scrollTo.apply(this, arguments);
        }
    };
}
