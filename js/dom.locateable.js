// dom.locateable
//
// Extends the default behaviour of events for the .tip class.

import { by, get, exponentialOut as expOut, noop } from '../../fn/fn.js';
import { animate, box, events, matches, offset, query, trigger } from '../dom.js';
import { matchers } from './dom-activate.js';

const selector = ".locateable, [locateable]";
const match = matches(selector);
const on    = events.on;

// Duration and easing of scroll animation
const scrollDuration  = 0.8;
const scrollTransform = expOut(6);

export const config = {
    top: 80
};

let activeNode;
let cancel = noop;
let animateScroll = function() {
    return noop;
};

function scrollToNode(target) {
    const coords       = offset(document.scrollingElement, target);
    const scrollHeight = document.scrollingElement.scrollHeight;
    const scrollBox    = box(document.scrollingElement);
    const top = (coords[1] - config.top) > (scrollHeight - scrollBox.height) ?
        scrollHeight - scrollBox.height :
        (coords[1] - config.top);

    cancel = animateScroll(scrollDuration, scrollTransform, 'scrollTop', document.scrollingElement, top);
}

function activate(e) {
    if (!e.default) { return; }

    var target = e.target;

    // If node is already active, ignore
    if (target === activeNode) { return; }

    // If node is not a locateable
    if (!match(target)) { return; }

    // Deactivate current active node
    if (activeNode) {
        cancel();
        trigger('dom-deactivate', activeNode);
    }

    // If there is a related target, we know the command came from a
    // link and we must animate.
    if (e.relatedTarget) {
        scrollToNode(target);
    }

    e.default();
    activeNode = target;
}

function deactivate(e) {
    if (!e.default) { return; }

    var target = e.target;

    if (!match(target)) { return; }

    e.default();

    // If node is already active, ignore
    if (target === activeNode) {
        activeNode = undefined;
    }
}

function update() {
    var locateables = query(selector, document);
    var boxes       = locateables.map(box).sort(by(get('top')));
    var winBox      = box(window);
    var n = -1;

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
        if (activeNode) {
            trigger('dom-deactivate', activeNode);
        }

        return;
    }

    var node = locateables[n];

    if (activeNode) {
        // Node is already active
        if (node === activeNode) {
            return;
        }

        trigger('dom-deactivate', activeNode);
    }

    trigger('dom-activate', node);
}

on(document, 'dom-activate', activate);
on(document, 'dom-deactivate', deactivate);
on(window, 'scroll', update);
update();

animateScroll = animate;

matchers.push(match);
