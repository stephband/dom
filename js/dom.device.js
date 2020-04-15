
// Adds a class to the document root depending on the last input device
// used, enabling you to set :focus and :hover styles depending on the type of
// input responible for them. Hopefully. Not foolproof, but better than getting
// rid of focus outlines altogether.

import { classes, events } from '../module.js';

export const config = {
    simulatedEventDelay: 0.08,
    keyClass:   'key-device',
    mouseClass: 'mouse-device',
    touchClass: 'touch-device'
};

var on         = events.on;
var list       = classes(document.documentElement);
var currentClass, timeStamp;

function updateClass(newClass) {
    // We are already in mouseClass state, nothing to do
    if (currentClass === newClass) { return; }
    list.remove(currentClass);
    list.add(newClass);
    currentClass = newClass;
}

function mousedown(e) {
    // If we are within simulatedEventDelay of a touchend event, ignore
    // mousedown as it's likely a simulated event. Reset timeStamp to
    // gaurantee that we only block one mousedown at most.
    if (e.timeStamp < timeStamp + config.simulatedEventDelay * 1000) { return; }
    timeStamp = undefined;
    updateClass(config.mouseClass);
}

function keydown(e) {
    // If key is not tab, enter, space, escape, page up/down, or arrow key do nothing
    if ([9, 13, 27, 32, 33, 34, 35, 36, 37, 38, 39, 40].indexOf(e.keyCode) === -1) {
        return;
    }

    // If current focus is on an input, do nothing
    if (['input', 'textarea', 'select'].indexOf(document.activeElement.tagName.toLowerCase()) !== -1) {
        return;
    }

    updateClass(config.keyClass);
}

function touchend(e) {
    timeStamp = e.timeStamp;
    updateClass(config.touchClass);
}

on(document, 'mouseover', mousedown);
on(document, 'keydown', keydown);
on(document, 'touchend', touchend);
