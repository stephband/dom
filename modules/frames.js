
import Stream from '../../fn/modules/stream.js';

export function frames() {
    var timer;
    return new Stream((control) => {
        function frame(t) {
            timer = window.requestAnimationFrame(frame);
            control.push(t);
        }

        timer = window.requestAnimationFrame(frame);

        control.done({
            stop: function() {
                timer && cancelAnimationFrame(timer);
                timer = undefined;
            }
        });
    });
}
