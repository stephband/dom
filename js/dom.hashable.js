import { by, curry, get, isDefined, overload, requestTick } from '../../fn/module.js';
import { append, box, classes, create, delegate, Event, events, features, fragmentFromChildren, isInternalLink, isPrimaryButton, tag, query, ready, remove, trigger } from '../module.js';

var DEBUG     = false;

export const config = {
    scrollIdleDuration: 0.1
};

const selector = ".locateable, [locateable]";
const on       = events.on;
const byTop    = by(get('top'));

const scrollOptions = {
    // Overridden on window load
    behavior: 'auto',
    block: 'start'
};

let hashTime     = -Infinity;
let scrollTime   = -Infinity;
let scrolledHash = '';
let locateables, winBox;
let locatedNode;


/* Handle scrolling */

function scroll(e) {
    const aMomentAgo = e.timeStamp - config.scrollIdleDuration * 1000;

    // For a moment after the last hashchange dont update while
    // smooth scrolling settles to the right place.
    if (hashTime > aMomentAgo) {
        hashTime = e.timeStamp;
        return;
    }

    // Update things that rarely change only when we have not scrolled recently
    if (scrollTime < aMomentAgo) {
        locateables = query(selector, document);
        winBox = box(window);
    }

    scrollTime = e.timeStamp;

    const boxes = locateables.map(box).sort(byTop);
    let  n = -1;

    while (boxes[++n]) {
        // Stop on locateable lower than the break
        if (boxes[n].top > winBox.height / 3) {
            break;
        }
    }

    --n;

    // Before the first or after the last locateable. (The latter
    // should not be possible according to the above while loop)
    if (n < 0 || n >= boxes.length) {
        if (locatedNode) {
            window.location.hash = scrolledHash = '';
        }

        return;
    }

    var node = locateables[n];

    if (locatedNode && node === locatedNode) {
        return;
    }

    // Record the hash as scrolledHash so that we can tell when scrolling has
    // been the cause of the hashchange event
    window.location.hash = scrolledHash = node.id;
}


/* Handle hashchanges */

function locate(node) {
    node.classList.remove('located');
    locatedNode = node;
}

function unlocate(node) {
    node.classList.add('located');
    locatedNode = undefined;
}

function hashchange(e) {
    const hash = window.location.hash;

    if (!hash) {
        // Remove current located
        if (locatedNode) {
            unlocate(locatedNode);
        }

        return;
    }

    const id = hash.slice(1);
    if (!id) { return; }

    // Is there a node with that id?
    var node = document.getElementById(id);
    if (!node) { return; }

    // If the hashchange was not caused by scrolling record its timeStamp
    if (scrolledHash !== id) {
        hashTime = e.timeStamp;
        scrolledHash = undefined;
    }

    // Implement smooth scroll for browsers that do not have it
    //if (!features.scrollIntoView) {}

    // The page is on the move
    locate(node);
}


/* Handle load */

function load(e) {
    hashchange(e);
    scroll(e);

    // Start listening to scroll
    on(window, 'scroll', scroll);

    // Scroll smoothly from now on
    scrollOptions.behavior = 'smooth';
}

on(window, 'hashchange', hashchange);
on(window, 'load', load);
