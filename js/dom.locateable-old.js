// dom.locateable
//
// Extends the default behaviour of events for the .tip class.

import '../polyfills/element.scrollintoview.js';
import { by, get } from '../../fn/module.js';
import { box, events, matches, query, trigger, features } from '../module.js';
import { matchers } from './dom-activate.js';

const selector = ".locateable, [locateable]";
const match = matches(selector);
const on    = events.on;

// Duration and easing of scroll animation
export const config = {
    scrollIdleDuration: 0.1
};

const scrollOptions = {
    // Overridden on window load
    behavior: 'auto',
    block: 'start'
};

let activeNode;
let lastScrollTime = -Infinity;
let lastActivateTime = -Infinity;

// In browsers with scrollBehavior don't enable activate until load – these
// browsers understand scroll-padding and will scroll to the correct hash
// position without help when the hash is activated by dom-activate.js
let activateable = !features.scrollBehavior;

function activate(e) {
    if (!activateable) { return; }

    if (!e.default) { return; }

    var target = e.target;

    // If node is already active, ignore
    if (target === activeNode) { return; }

    // If node is not a locateable
    if (!match(target)) { return; }

    // Deactivate current active node
    if (activeNode) {
        trigger('dom-deactivate', activeNode);
    }

    // If there is a related target, we know the command came from a
    // link and we must animate. If last scroll time was in the distant past,
    // we can be pretty sure we are not currently scrolling (even on iOS?) and
    // so we probably want to animate.
    if (e.relatedTarget || (lastScrollTime < e.timeStamp - config.scrollIdleDuration * 1000)) {
        target.scrollIntoView(scrollOptions);
        lastActivateTime = e.timeStamp;
    }

    e.default();
    activeNode = target;
    history.replaceState({}, '', '#' + target.id);
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

function update(e) {
    lastScrollTime = e.timeStamp;

    // For a short duration after a target is activated don't update while
    // the smooth scrolling settles to the right place.
    if (lastActivateTime > e.timeStamp - config.scrollIdleDuration * 1000) {
        lastActivateTime = e.timeStamp;
        return;
    }

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

// Wait until after dom-activate has updated the page from the hashref – if
// there is a hashref, dom-activate will be sent on ready. Then after ready,
// make scroll animation smooth
on(window, 'load', function(e) {
    update(e);
    on(window, 'scroll', update);

    // Make things activatable
    activateable = true;

    // Scroll smoothly from now on
    scrollOptions.behavior = 'smooth';
});


matchers.push(match);
