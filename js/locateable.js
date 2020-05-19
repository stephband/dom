
/**
locateable

An element with a `locateable` attribute updates the browser location hash
with its `id` when scrolled into view.

When the location hash changes to be equal to a `locateable`'s id
the locateable gets the class `"located"`, and links that reference that
locateable via their `href` attribute get the class `"on"`.

Build a list of links that reference locateables and with a little style
you have a scrolling navigation:

```html
<style>
    a               { color: #888888; }
    a.on            { color: black; }
    article.located { ... }
</style>

<a href="#fish">...</a>
<a href="#chips">...</a>

<article locateable id="fish">...</article>
<article locateable id="chips">...</article>
```
**/

import '../polyfills/element.scrollintoview.js';
import { by, get, weakCache } from '../../fn/module.js';
import { rect, features, isInternalLink, select, trigger } from '../module.js';

var DEBUG = false;

const selector = ".locateable, [locateable]";
const byTop    = by(get('top'));
const nothing  = {};
const scrollOptions = {
    // Overridden on window load
    behavior: 'auto',
    block: 'start'
};

export const config = {
    scrollIdleDuration: 0.18
};

let hashTime     = 0;
let frameTime    = -Infinity;
let scrollLeft   = document.scrollingElement.scrollLeft;
let scrollTop    = document.scrollingElement.scrollTop;
let locateables, locatedNode, scrollPaddingLeft, scrollPaddingTop, frame;


function queryLinks(id) {
	return select('a[href$="#' + id + '"]', document.body)
	.filter(isInternalLink);
}

function addOn(node) {
    node.classList.add('on');
}

function removeOn(node) {
    node.classList.remove('on');
}

function locate(node) {
    node.classList.add('located');
    queryLinks(node.id).forEach(addOn);
    locatedNode = node;
}

function unlocate() {
    if (!locatedNode) { return; }
    locatedNode.classList.remove('located');
    queryLinks(locatedNode.id).forEach(removeOn);
    locatedNode = undefined;
}

function update(time) {
    frame = undefined;

    // Update things that rarely change only when we have not updated recently
    if (frameTime < time - config.scrollIdleDuration * 1000) {
        locateables = select(selector, document);
        scrollPaddingLeft = parseInt(getComputedStyle(document.documentElement).scrollPaddingLeft, 10);
        scrollPaddingTop  = parseInt(getComputedStyle(document.documentElement).scrollPaddingTop, 10);
    }

    frameTime = time;

    const boxes = locateables.map(rect).sort(byTop);
    let  n = -1;

    while (boxes[++n]) {
        // Stop on locateable lower than the break
        if (boxes[n].top > scrollPaddingTop + 1) {
            break;
        }
    }

    --n;

    // Before the first or after the last locateable. (The latter
    // should not be possible according to the above while loop)
    if (n < 0 || n >= boxes.length) {
        if (locatedNode) {
            unlocate();
            window.history.replaceState(nothing, '', '#');
        }

        return;
    }

    var node = locateables[n];

    if (locatedNode && node === locatedNode) {
        return;
    }

    unlocate();
    locate(node);
    window.history.replaceState(nothing, '', '#' + node.id);
    trigger('hashchange', window);
}

function scroll(e) {
    if (DEBUG) {
        console.log(e.type, e.timeStamp, window.location.hash, document.scrollingElement.scrollLeft + ', ' + document.scrollingElement.scrollTop);
    }

    const aMomentAgo = e.timeStamp - config.scrollIdleDuration * 1000;

    // Keep a record of scrollTop in order to restore it in Safari,
    // where popstate and hashchange are preceeded by a scroll jump
    scrollLeft = document.scrollingElement.scrollLeft;
    scrollTop  = document.scrollingElement.scrollTop;

    // For a moment after the last hashchange dont update while
    // smooth scrolling settles to the right place.
    if (hashTime > aMomentAgo) {
        hashTime = e.timeStamp;
        return;
    }

    // Is frame already cued?
    if (frame) {
        return;
    }

    frame = requestAnimationFrame(update);
}

const store = weakCache(function(node) {
    return {
        node: node
    };
});


function updateElement(time, data) {
    data.frame = undefined;

    // Update things that rarely change only when we have not updated recently
    if (frameTime < time - config.scrollIdleDuration * 1000) {
        data.box               = rect(data.node);
        data.locateables       = select(selector, data.node);

        // scrollPaddingN may compute to "auto", which parses as NaN.
        // Default to 0.
        data.scrollPaddingLeft = parseInt(getComputedStyle(data.node).scrollPaddingLeft, 10) || 0;
        data.scrollPaddingTop  = parseInt(getComputedStyle(data.node).scrollPaddingTop, 10) || 0;
    }

    frameTime = time;

    const boxes = data.locateables.map(rect).sort(byTop);
    let n = -1;
    let node;

    while (boxes[++n]) {
        // Stop on locateable lower than the break
        if ((boxes[n].top - data.box.top) > data.scrollPaddingTop + 1
        || (boxes[n].left - data.box.left) > data.scrollPaddingLeft + 1) {
            break;
        }

        node = data.locateables[n];
    }

    // Check that node and locateNode are different before continueing
    if (node === locatedNode) {
        return;
    }

    // Before the first or after the last locateable. (The latter
    // should not be possible according to the above while loop)
    unlocate();

    if (node) {
        locate(node);
        window.history.replaceState(nothing, '', '#' + node.id);
        trigger('hashchange', window);
        return;
    }

    window.history.replaceState(nothing, '', '#');
}

function scrollElement(e) {
    if (e.target === document) {
        return false;
    }

    if (DEBUG) {
        console.log(e.type, e.timeStamp, window.location.hash, document.scrollingElement.scrollLeft + ', ' + document.scrollingElement.scrollTop);
    }

    const aMomentAgo = e.timeStamp - config.scrollIdleDuration * 1000;

    // Keep a record of scrollTop in order to restore it in Safari,
    // where popstate and hashchange are preceeded by a scroll jump
    //scrollLeft = document.scrollingElement.scrollLeft;
    //scrollTop  = document.scrollingElement.scrollTop;

    // For a moment after the last hashchange dont update while
    // smooth scrolling settles to the right place.
    if (hashTime > aMomentAgo) {
        hashTime = e.timeStamp;
        return;
    }

    const data = store(e.target);

    // Is frame already cued?
    if (data.frame) { return; }

    // Cue an update
    data.frame = requestAnimationFrame((time) => updateElement(time, data));
}

function popstate(e) {
    if (DEBUG) {
        console.log(e.type, e.timeStamp, window.location.hash, document.scrollingElement.scrollLeft + ', ' + document.scrollingElement.scrollTop);
    }

    // Record the timeStamp
    hashTime = e.timeStamp;

    // Remove current located
    unlocate();

    const hash = window.location.hash;
    const id   = hash.slice(1);

    if (!id) {
        if (!features.scrollBehavior) {
            // In Safari, popstate and hashchange are preceeded by scroll jump -
            // restore previous scrollTop.
            document.scrollingElement.scrollLeft = scrollLeft;
            document.scrollingElement.scrollTop  = scrollTop;

            // Then animate
            document.body.scrollIntoView(scrollOptions);
        }

        return;
    }

    // Is there a node with that id?
    const node = document.getElementById(id);
    if (!node) { return; }

    // The page is on the move
    locate(node);

    // Implement smooth scroll for browsers that do not have it
    if (!features.scrollBehavior) {
        // In Safari, popstate and hashchange are preceeded by scroll jump -
        // restore previous scrollTop.
        document.scrollingElement.scrollLeft = scrollLeft;
        document.scrollingElement.scrollTop  = scrollTop;

        // Then animate
        node.scrollIntoView(scrollOptions);
    }
}

function load(e) {
    // Is there a node with that id?
    const node = document.getElementById(window.location.hash.slice(1));
    if (node) {
        node.scrollIntoView(scrollOptions);
    }

    popstate(e);
    scroll(e);

    // Start listening to popstate and scroll
    window.addEventListener('popstate', popstate);
    window.addEventListener('scroll', scroll);

    // Capture scroll events in capture phase, as scroll events from elements
    // other than document do not bubble
    window.addEventListener('scroll', scrollElement, true);

    // Scroll smoothly from now on
    scrollOptions.behavior = 'smooth';
}

window.addEventListener('load', load);
