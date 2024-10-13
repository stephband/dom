
import Stream from 'fn/stream.js';

const assign = Object.assign;


/** frames() **/

function Frames() {}

assign(Frames.prototype, {
    start: function() {
        const frame = (time) => {
            this.timer = window.requestAnimationFrame(frame);
            Stream.push(this, time);
        };

        this.timer = window.requestAnimationFrame(frame);
        return this;
    },

    stop: function() {
        this.timer && cancelAnimationFrame(this.timer);
        this.timer = undefined;
        return Stream.stop(this);
    }
});

export default function frames() {
    return new Frames();
}
