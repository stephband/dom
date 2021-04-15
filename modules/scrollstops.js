
// Much of this code has been purloined from targetable.js – do we need the 
// hashchange tracking here? I have commented it


import Stream from '../../fn/modules/stream.js';


/*
Config
*/

export const config = {
    minScrollEventInterval: 0.0375,
    maxScrollEventInterval: 0.32
};

const captureOptions = {
    capture: true,
    passive: true
};

// Any call to replaceState or pushState in iOS opens the URL bar - 
// disturbing at the best of times, nevermind mid-scroll. So probably 
// best not update on scrolling on small iOS screens

// Capture scroll events in capture phase, as scroll events from elements
// other than document do not bubble.

var trackingInterval = config.maxScrollEventInterval;

function update(times, push, e) {    
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

    trackingInterval =  1.6 * interval > config.maxScrollEventInterval ?
        config.maxScrollEventInterval :
        1.6 * interval;

    push(e);
}

export default function scrollstops(element) {
    const times = [];
    //let hashtime;
    let timer;

    return new Stream(function(push, stop) {
        /*
        window.addEventListener('hashchange', function hashchange(e) {
            hashtime = e.timeStamp / 1000;
            //console.log('hashchange', hashtime, window.location.hash);
        });
        */

        function scroll(e) {
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
        
            times.push(time);

            // Update only when there is a maxScrollEventInterval second pause in scrolling
            clearTimeout(timer);
            timer = setTimeout(update, trackingInterval * 1000, times, push, e);
        }

        element.addEventListener('scroll', scroll, captureOptions);

        return {
            stop: function() {
                element.removeEventListener('scroll', scroll);
                stop();
            }
        };
    });
}
