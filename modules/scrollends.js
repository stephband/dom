
// Much of this code has been purloined from targetable.js – do we need the
// hashchange tracking here? I have commented it

console.warn('scrollends() deprecated in favour of scrolls()');

import Stream from '../../fn/stream/stream.js';

const assign = Object.assign;

/*
Config
*/

export const config = {
    minScrollEventInterval: 0.0375,
    maxScrollEventInterval: 0.18
};

const captureOptions = {
    capture: true,
    passive: true
};

// Capture scroll events in capture phase, as scroll events from elements
// other than document do not bubble.

var trackingInterval = config.maxScrollEventInterval;

function update(times, stream, e) {
    if (times.length < 2) {
        times.length = 0;
        return;
    }

    // Dynamically adjust maxScrollEventInterval to tighten it up,
    // imposing a baseline of 60ms (0.0375s * 1.6)
    let n = times.length, interval = 0;
    while (--n) {
        const t = times[n] - times[n - 1];
        interval = t > interval ? t : interval;
    }

    interval = interval < config.minScrollEventInterval ?
        config.minScrollEventInterval :
        interval ;

    trackingInterval =  (1.4 * interval) > config.maxScrollEventInterval ?
        config.maxScrollEventInterval :
        (1.4 * interval);

    stream.push(e);
}

function Scrolls(stream, element) {
    this.stream  = stream;
    this.element = element;
    this.times   = [];

    /*
    window.addEventListener('hashchange', function hashchange(e) {
        hashtime = e.timeStamp / 1000;
        //console.log('hashchange', hashtime, window.location.hash);
    });
    */

    element.addEventListener('scroll', this, captureOptions);
}

assign(Scrolls.prototype, {
    handleEvent: function(e) {
        // Ignore the first scroll event following a hashchange. The browser sends a
        // scroll event even where a target cannot be scrolled to, such as a
        // navigation with position: fixed, for example. This can cause targetable
        // to recalculate again, and shift the target back to one fo the targetables,
        // where it should stay on the navigation element.
        const time = e.timeStamp / 1000;

        // Make sure this only happens once after a hashchange
        /*if (hashtime !== undefined) {
            // If we are not mid-scroll, and the latest hashchange was less than
            // 0.1s ago, ignore
            if (!times.length && hashtime > time - 0.1) {
                //console.log('scroll', 'ignored');
                hashtime = undefined;
                return;
            }

            hashtime = undefined;
        }*/

        this.times.push(time);

        // Update only when there is a trackingInterval second pause in scrolling
        clearTimeout(this.timer);
        this.timer = setTimeout(update, trackingInterval * 1000, this.times, this.stream, e);
    },

    stop: function() {
        this.element.removeEventListener('scroll', scroll);
        stop();
    }
});

export default function scrollends(element) {
    return new Stream((source) => source.done(new Scrolls(source, element)));
}
