import '../polyfills/element.scrollintoview.js';
import { by, curry, get, isDefined, overload, requestTick } from '../../fn/module.js';
import { append, box, classes, create, delegate, Event, events, features, fragmentFromChildren, isInternalLink, isPrimaryButton, tag, query, ready, remove, trigger } from '../module.js';

var DEBUG = window.DEBUG;

export const config = {
    scrollIdleDuration: 0.15
};

const selector = ".locateable, [locateable]";
const on       = events.on;
const byTop    = by(get('top'));
const nothing  = {};

const scrollOptions = {
    // Overridden on window load
    behavior: 'auto',
    block: 'start'
};

let hashTime     = -Infinity;
let scrollTime   = -Infinity;
let scrollTop0   = document.scrollingElement.scrollTop;
let scrollTop1   = scrollTop0;
let locateables, locatedNode, scrollPaddingTop;


function queryLinks(id) {
	return query('a[href$="#' + id + '"]', document.body)
	.filter(isInternalLink);
}

function unlocate() {
    if (!locatedNode) { return; }
    locatedNode.classList.remove('located');
    queryLinks(locatedNode.id).forEach((node) => node.classList.remove('on'));
    locatedNode = undefined;
}

function locate(node) {
    node.classList.add('located');
    queryLinks(node.id).forEach((node) => node.classList.add('on'));
    locatedNode = node;
}

function scrollIntoView(node, hashTime, scrollTime) {
    // In Safari, hashchange is preceeded by a scroll event, elsewhere the
    // hashchange comes first. Detect immediately preceeding scroll event,
    // restore scroll...
    if (hashTime - scrollTime < 12) {
        document.scrollingElement.scrollTop = scrollTop1;
    }

    node.scrollIntoView(scrollOptions);
}

function scroll(e) {
    const aMomentAgo = e.timeStamp - config.scrollIdleDuration * 1000;

    // Keep a two-deep record of scrollTop in order to restore it in Safari,
    // where hashchanges are preceeded by a scroll jump
    scrollTop1 = scrollTop0;
    scrollTop0 = document.scrollingElement.scrollTop;

    // For a moment after the last hashchange dont update while
    // smooth scrolling settles to the right place.
    if (hashTime > aMomentAgo) {
        hashTime = e.timeStamp;
        return;
    }

    // Update things that rarely change only when we have not scrolled recently
    if (scrollTime < aMomentAgo) {
        locateables = query(selector, document);
        scrollPaddingTop = parseInt(getComputedStyle(document.documentElement).scrollPaddingTop, 10);
    }

    scrollTime = e.timeStamp;

    const boxes = locateables.map(box).sort(byTop);
    let  n = -1;

    while (boxes[++n]) {
        // Stop on locateable lower than the break
        if (boxes[n].top >= scrollPaddingTop) {
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

function hashchange(e) {
    if (DEBUG) {
        console.log('hashchange', window.location.hash, document.scrollingElement.scrollTop);
    }

    const hash = window.location.hash;

    // Record the timeStamp
    hashTime = e.timeStamp;

    // Remove current located
    unlocate();

    const id = hash.slice(1);
    if (!id) {
        if (!features.scrollBehavior) {
            scrollIntoView(document.body, hashTime, scrollTime);
        }

        return;
    }

    // Is there a node with that id?
    var node = document.getElementById(id);
    if (!node) { return; }

    // The page is on the move
    locate(node);

    // Implement smooth scroll for browsers that do not have it
    if (!features.scrollBehavior) {
        scrollIntoView(node, hashTime, scrollTime);
    }
}

function load(e) {
    hashchange(e);
    scroll(e);

    // Start listening to scroll
    window.addEventListener('scroll', scroll);

    // Scroll smoothly from now on
    scrollOptions.behavior = 'smooth';
}


window.addEventListener('hashchange', hashchange);
window.addEventListener('load', load);
