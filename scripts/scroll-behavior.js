
import '../polyfills/document.scrollingelement.js';
//import '../polyfills/element.scrollintoview.js';

import cache    from '../../fn/modules/weak-cache.js';
import features from '../../dom/modules/features.js';
import rect     from '../../dom/modules/rect.js';

const DEBUG = true;

/* 
Smooth scroll for browsers that do not have it
*/

if (!features.scrollBehavior) {
    const scrollOptions = {
        behavior: 'smooth',
        block: 'start'
    };

    const store = cache(function store(node) {
        return {
            node: node
        };
    });

    const restoreScroll = function restoreScroll(element) {
        while (element = element.parentNode) {
            if (element === document.body || element === document.documentElement) {
                element = document.scrollingElement;
                break;
            }
    
            if (element.scrollHeight > element.clientHeight) {
                break;
            }
        }

        var data = store(element);
        element.scrollLeft = data.scrollLeft;
        element.scrollTop  = data.scrollTop;
    }

    // Keep a record of scrollTop in order to restore it
    window.addEventListener('scroll', function scroll(e) {
        const element = (e.target === document.body
            || e.target === document.documentElement 
            || e.target === document 
            || e.target === window) ?
                document.scrollingElement :
                e.target;

        const data = store(element);
        data.time       = e.timeStamp / 1000;
        data.scrollLeft = element.scrollLeft;
        data.scrollTop  = element.scrollTop;
    }, {
        capture: true,
        passive: true
    });

    window.addEventListener('hashchange', function hashchange(e) {        
        const id = window.location.hash.replace(/^#/, '');
        if (!id) { return; }

        const target = document.getElementById(id);
        if (!target) { return; }

        // If element does not scroll with content do not try to scroll to it
        if (getComputedStyle(target).position === 'fixed') {
            if (DEBUG) { console.log('hashchange: Target is position: fixed, do not attempt scroll to.') }
            return;
        }

        const element = (target.parentNode === document.body
            || target.parentNode === document.documentElement 
            || target.parentNode === document 
            || target.parentNode === window) ?
                document.scrollingElement :
                target.parentNode;

        const time = e.timeStamp / 1000;
        const data = store(element);

        if (data.time > time - 0.3) {
            if (DEBUG) { console.log('hashchange: Scrolling was recent, do not attempt scroll to'); }
            return;
        }

        const targetBox         = rect(target);
        const style             = getComputedStyle(element);
        const scrollPaddingLeft = parseInt(style.scrollPaddingLeft, 10);
        const scrollPaddingTop  = parseInt(style.scrollPaddingTop, 10);

        /*
        console.log('IN VIEWPORT',
            targetBox.top >= scrollPaddingTop,
            targetBox.top < 0.8 * window.innerHeight,
            targetBox.left >= scrollPaddingLeft,
            targetBox.left < 0.8 * window.innerWidth
        );
        */

        // If target is already substantially on screen do nothing
        if (targetBox.top >= scrollPaddingTop
            && targetBox.top < 0.8 * window.innerHeight
            && targetBox.left >= scrollPaddingLeft
            && targetBox.left < 0.8 * window.innerWidth
        ) {
            if (DEBUG) { console.log('hashchange: Target is already substantially inside the viewport, do not attempt scroll to') }
            return;
        }

        //console.log('hashchange', window.location.hash.replace(/^#/, ''));

        // In Safari, hashchange is preceeded by scroll jump - restore 
        // previous scrollTop.
        restoreScroll(target);

        // Then animate
        //requestAnimationFrame(function() {
            //console.log('SCROLL INTO VIEW', target.id);
            target.scrollIntoView(scrollOptions);
        //});
    });
}
else {
    // Override initial smooth scroll with an instant scroll to target
    window.addEventListener('load', function load(e) {
        const target = document.getElementById(window.location.hash.replace(/^#/, ''));
        if (!target) { return; }

        target.scrollIntoView({
            behavior: 'auto',
            block: 'start'
        });
    });
}
