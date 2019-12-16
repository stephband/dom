
/*
gestures(node)

Returns a stream of streams of dom events
*/

import { Stream } from '../../fn/module.js';
import events, { isPrimaryButton } from './events.js';


// https://stackoverflow.com/questions/8643739/cancel-click-event-in-the-mouseup-event-handler/8927598

function createMouseGesture(e) {
    // Start gesture stream with mousedown event
    const gesture = Stream.of(e);

    function move(e) {
        e.preventDefault();
        gesture.push(e);
    }

    function up(e) {
        e.preventDefault();
        gesture.push(e);
        gesture.stop();
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
    }

    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);

    gesture.target = e.target;
    const focusable = e.target.closest('[tabindex]');
    focusable && focusable.focus();
    e.preventDefault();

    return gesture;
}

export default function gestures(node) {
    return events('mousedown', node)
    .filter(isPrimaryButton)
    .map(createMouseGesture);
}
