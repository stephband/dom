
import { Stream } from '../../fn/module.js';
import events, { isPrimaryButton } from './events.js';

function createMouseGesture(e) {
    // Start gesture stream with mousedown event
    var gesture = Stream.of(e);

    var moves = events('mousemove', document).each((e) => {
        e.preventDefault();
        gesture.push(e);
    });

    var ups = events('mouseup', document).each((e) => {
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
