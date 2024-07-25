
import Distributor from './distributor.js';
import log from './log.js';

const history  = window.history;
const location = window.location;


function stripHash(hash) {
    return hash.replace(/^#/, '');
}

function updateTarget(url) {
    const href = location.href;

    // Replace the current location with the new one
    history.replaceState(history.state, document.title, url);

    // Move forward to the old url and back to the current location, causing
    // :target selector to update and a popstate event.
    history.pushState(history.state, document.title, href);
    history.back();
}


/*
Popstate distributor
*/

const distributor = new Distributor(function(e) {
    return window.location;
});


/**
location

DOMs `location` object provides an interface that combines the browsers'
`location` and `history` APIs.
**/

export default Data.of({
    /** .identifier **/
    get identifier() {
        return stripHash(location.hash);
    },

    set identifier(id) {
        // Replacing the hash normally does not update :target styles. It's a
        // bad oversight on the part of browsers.
        // https://github.com/whatwg/html/issues/639
        //
        // This is close to replacing the hash without changing the history.
        // Replace the id, then add a new entry with the same id, then go back.
        // This appears to update :target without a hashchange event and without
        // scrolling in Chrome, although at the expense of creating a forward
        // history entry and a popstate.

        const url = id ?
            '#' + id :
            location.href.replace(/#.*$/, '');

        updateTarget(url);
    },

    /** .params **/
    get params() {
        return Object.fromEntries(new URLSearchParams(location.search));
    },

    set params(params) {
        const url = this.URL();
        url.search = new URLSearchParams(params);
        history.replaceState(history.state, document.title, url);
    },

    /** .params **/
    get pathname() {
        return location.pathname;
    },

    set pathname(path) {
        const url = this.URL();
        url.pathname = path;
        history.replaceState(history.state, document.title, url);
    },

    /** .url **/
    get url() {
        return location.href;
    },

    set url(url) {
        // Replace the url without changing history
        history.replaceState(history.state, document.title, url);
    },

    /** .state **/
    get state() {
        return history.state;
    },

    set state(state) {
        // Replace state without changing history
        history.replaceState(state, document.title);
    },

    /**
    .navigate(url, state, scroll)

    Takes a `url` in the form of a string or URL object. Where the origin of
    `url` is not the same as the current location, the browser is navigated.
    Otherwise the new `url` and/or `state` is pushed to the browser history,
    the hash is updated in such a way that the browser updates its `:target`
    styles

    **/
    navigate: function navigate(url, state = null, scroll = false) {
        // Coerce url string to URL object
        url = typeof url === 'string' ?
            /^https?\:\/\//.test(url) ?
                new URL(url) :
                new URL(url, location.href) :
            url ;

        // If not same origin navigate away from this site
        if (url.origin !== location.origin) {
            window.location.href = url;
            return this;
        }

        // Make state conform to JSON serialisation - allows state to be set
        // from objects that contain functions
        const json = JSON.stringify(state);
        const statechange = json !== JSON.stringify(history.state);

        // If nothing has changed get on oor bike
        if (url.href === location.href && !statechange) {
            return;
        }

        const hash = location.hash;
        const id = stripHash(url.hash);

        log('navigate()', url,
            /*(url.pathname !== location.pathname ? 'path: "' + url.pathname + '", ' : '') +
            (url.search !== location.search ? 'params: "' + url.search + '", ' : '') +
            (url.hash !== location.hash ? 'hash: "' + url.hash + '", ' : '') + */
            (state ? 'state: ' + json : '')
        );

        // If only the hash has changed and state is null and scroll is true,
        // employ location.hash to navigate, giving us automatic scroll
        if (
            url.pathname === location.pathname
            && url.search === location.search
            && !statechange
            && id
            && id !== this.identifier
            && scroll
        ) {
            location.hash = id;
            return this;
        }

        const oldhref = location.href;
        const href = url.pathname + url.search + (id ? url.hash : '');
        state = json ? JSON.parse(json) : state ;
        history.pushState(state, document.title, href);

        // Force :target selector to update when there is a new #identifier
        if (url.hash !== hash) {
            // Move forward to the old url and back to the current location, causing
            // :target selector to update and a popstate event.
            history.pushState(state, document.title, oldhref);
            history.back();
        }

        // Where no popstate is scheduled we nonetheless want to notify
        // navigation change so simulate an event and pass to distributor, (and
        // make it async to echo the behaviour of a real popstate event)
        else {
            //Promise.resolve().then(function() {
                const result = distributor.handleEvent({
                    type: 'navigate',
                    timeStamp: window.performance.now()
                });

                // If a handler has returned false that's a signal that we don't
                // want the navigate to be handled by history
                if (result !== undefined && !result) {
                    window.location.href = url;
                }
            //});
        }

        return this;
    },

    /** .on(fn) **/
    on: function on(fn) {
        distributor.on(fn);
        return this;
    },

    /** .off(fn) **/
    off: function off(fn) {
        distributor.off(fn);
        return this;
    },

    /** .back() **/
    back: function back() {
        history.back();
        return this;
    },

    /** .forward() **/
    forward: function forward() {
        history.forward();
        return this;
    },

    /** .url() **/
    URL: function url() {
        return new URL(location.href);
    }
};


// Listen to load and popstate (and hashchange?) events to notify when
// navigation has occured
window.addEventListener('popstate', distributor);
window.addEventListener('DOMContentLoaded', distributor);

// Clean up empty hash URLs
window.addEventListener('hashchange', function(e) {
    /*
    A `hashchange` is received when:
    - navigation via browser buttons when the hash changes
    - navigation via typing a new hash in the URL bar
    - navigation via history.back() and .forward() when the hash changes
    - location.hash is set to something other than its current value
    */

    // Detect navigations to # and silently remove the # from the url
    if (stripHash(location.hash) === '') {
        history.replaceState(history.state, document.title, location.href.replace(/#$/, ''));
    }
});
