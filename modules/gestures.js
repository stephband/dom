
import { Stream } from '../../fn/module.js';
import events, { isPrimaryButton } from './events.js';


// https://stackoverflow.com/questions/8643739/cancel-click-event-in-the-mouseup-event-handler/8927598

function createMouseGesture(e) {
    // Start gesture stream with mousedown event
    const gesture = Stream.of(e);

    const moves = events('mousemove', document).each((e) => {
        e.preventDefault();
        gesture.push(e);
    });

    const ups = events('mouseup', document).each((e) => {
        e.preventDefault();
        gesture.push(e);
        gesture.stop();
        moves.stop();
        ups.stop();
    });

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
