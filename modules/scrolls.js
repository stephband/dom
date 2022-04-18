
// Much of this code has been purloined from targetable.js – do we need the
// hashchange tracking here? I have commented it

import Stream     from '../../fn/modules/stream.js';
import { Source } from '../../fn/modules/stream/stream.js';

const assign = Object.assign;

const captureOptions = {
    capture: true,
    passive: true
};

/*
Config
*/

export const config = {
    minScrollEventInterval: 0.0375,
    maxScrollEventInterval: 0.18
};

// Capture scroll events in capture phase, as scroll events from elements
// other than document do not bubble.

var trackingInterval = config.maxScrollEventInterval;

function adjustTrackingInterval(times) {
    // Dynamically adjust maxScrollEventInterval to tighten it up,
    // imposing a baseline of 60ms (0.0375s * 1.6)

    let n = times.length;
    let interval = 0;

    while (--n) {
        const t = times[n] - times[n - 1];
        interval = t > interval ? t : interval;
    }

    interval = interval < config.minScrollEventInterval ?
        config.minScrollEventInterval :
        interval ;

    trackingInterval =  (1.4 * interval) > config.maxScrollEventInterval ?
        config.maxScrollEventInterval :
        (1.4 * interval) ;
}

function update(source, e) {
    const { times } = source;

    source.value.stop();
    source.value = undefined;

    if (times.length > 1) {
        adjustTrackingInterval(times);
    }

    times.length = 0;
}

function Scrolls(element) {
    this.element = element;
    this.times   = [];
}

assign(Scrolls.prototype, Source.prototype, {
    start: function() {
        // Method may be used once only
        //if (window.DEBUG) { this.start = startError; }

        /*
        window.addEventListener('hashchange', function hashchange(e) {
            hashtime = e.timeStamp / 1000;
            //console.log('hashchange', hashtime, window.location.hash);
        });
        */

        this.element.addEventListener('scroll', this, captureOptions);

        // Update count of running streams
        ++Stream.count;
    },

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

        if (this.value) {
            clearTimeout(this.timer);
            this.value.push(e);
        }
        else {
            this.value = Stream.of(e);
            this.target.push(this.value);
        }

        // Update only when there is a trackingInterval second pause in scrolling
        this.timer = setTimeout(update, trackingInterval * 1000, this, e);
    },

    stop: function() {
        this.element.removeEventListener('scroll', scroll);
        Source.prototype.stop.apply(this, arguments);
    }
});

export default function scrolls(element) {
    return new Stream(new Scrolls(element));
}
