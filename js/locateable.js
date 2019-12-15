
/*
locateable

<p>A <strong>locateable</strong> is activated when a link that
references is clicked. Upon activation the document view is scrolled
to it's location.</p>
<p>It is deactivated when the dom view is either
scrolled above that location, or another locateable is brought into
view from below.</p>
<p>locateables are useful for making scrolling navigations.</p>
*/

import '../polyfills/element.scrollintoview.js';
import { by, curry, get, isDefined, overload, requestTick } from '../../fn/module.js';
import { append, box, classes, create, delegate, Event, events, features, fragmentFromChildren, isInternalLink, isPrimaryButton, tag, query, ready, remove, trigger } from '../module.js';

var DEBUG = false;

const selector = ".locateable, [locateable]";
const on       = events.on;
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

let hashTime     = -Infinity;
let frameTime    = -Infinity;
let scrollTop    = document.scrollingElement.scrollTop;
let locateables, locatedNode, scrollPaddingTop, frame;


function queryLinks(id) {
	return query('a[href$="#' + id + '"]', document.body)
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
        locateables = query(selector, document);
        scrollPaddingTop = parseInt(getComputedStyle(document.documentElement).scrollPaddingTop, 10);
    }

    frameTime = time;

    const boxes = locateables.map(box).sort(byTop);
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
}

function scroll(e) {
    if (DEBUG) {
        console.log(e.type, e.timeStamp, window.location.hash, document.scrollingElement.scrollTop);
    }

    const aMomentAgo = e.timeStamp - config.scrollIdleDuration * 1000;

    // Keep a record of scrollTop in order to restore it in Safari,
    // where popstate and hashchange are preceeded by a scroll jump
    scrollTop = document.scrollingElement.scrollTop;

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

function popstate(e) {
    if (DEBUG) {
        console.log(e.type, e.timeStamp, window.location.hash, document.scrollingElement.scrollTop);
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
            document.scrollingElement.scrollTop = scrollTop;

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
        document.scrollingElement.scrollTop = scrollTop;

        // Then animate
        node.scrollIntoView(scrollOptions);
    }
}

function load(e) {
    popstate(e);
    scroll(e);

    // Start listening to popstate and scroll
    window.addEventListener('popstate', popstate);
    window.addEventListener('scroll', scroll);

    // Scroll smoothly from now on
    scrollOptions.behavior = 'smooth';
}

window.addEventListener('load', load);
