
import Signal from 'fn/signal.js';

const assign    = Object.assign;
const renderers = [];


function frame(time) {
    let n = -1, renderer;
    while (renderer = renderers[++n]) Signal.evaluate(renderer, renderer.render);
    renderers.length = 0;
}

function hasInput(signal, input) {
    // Check if input exists in the -ve indexes
    let n = 0;
    while (signal[--n]) if (signal[n] === input) return true;
}


/**
Renderer(fn)
A Renderer is a signal that calls `fn` on construction and again on each
animation frame following an invalidation.
**/

export default function Renderer(fn) {
    this.render = fn;

    // An initial, synchronous, evaluation binds this renderer to changes
    // to signals.
    Signal.evaluate(this, fn);
}

assign(Renderer, {
    from: (fn) => new Renderer(fn)
});

assign(Renderer.prototype, {
    invalidate(input) {
        // Verify that input signal has the right to invalidate this
        if (input && !hasInput(this, input)) return;

        // If the renderer is already cued do nothing
        if (renderers.indexOf(this) !== -1) return;

        // Clear inputs
        let n = 0;
        while (this[--n]) this[n] = undefined;

        // If no renderers are cued, cue frame() on the next animation frame
        if (!renderers.length) requestAnimationFrame(frame);

        // Add this renderer to renderers
        renderers.push(this);
    },

    stop() {
        // Remove this from signal graph
        let n = 0, input;
        while (input = this[--n]) {
            let m = -1, output;
            while (output = input[++m]) if (output === this) break;
            while (output = input[m++]) input[m - 1] = input[m];
            this[n]  = undefined;
        }

        // Remove from renderers if cued
        const i = renderers.indexOf(this);
        if (i !== -1) renderers.splice(i, 1);

        return this;
    }
});
