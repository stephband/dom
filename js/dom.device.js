
// Adds a class to the document root depending on the last input device
// used, enabling you to set :focus and :hover styles depending on the type of
// input responible for them. Hopefully. Not foolproof, but better than getting
// rid of focus outlines altogether.

import { classes, events } from '../module.js';

var simulatedEventDelay = 80;
var keyClass   = 'key-device';
var mouseClass = 'mouse-device';
var touchClass = 'touch-device';

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
    if (e.timeStamp < timeStamp + simulatedEventDelay) { return; }
    timeStamp = undefined;
    updateClass(mouseClass);
}

function keydown(e) {
    // If key is not tab, enter or escape do nothing
    if ([9, 13, 27].indexOf(e.keyCode) === -1) { return; }
    updateClass(keyClass);
}

function touchend(e) {
    timeStamp = e.timeStamp;
    updateClass(touchClass);
}

on(document, 'mousedown', mousedown);
on(document, 'keydown', keydown);
on(document, 'touchend', touchend);
