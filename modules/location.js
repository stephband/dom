
import EventDistributor from './event-distributor.js';
import log from './log.js';

const DEBUG = window.DEBUG === true;

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

var pathname, search = '', hash = '', state = 'null';

const distributor = new EventDistributor(function popstate(e) {
    /*
    A `popstate` is received when:
    - navigation via browser buttons
    - navigation via typing a new hash in the URL bar
    - navigation via history.back() and .forward()
    - location.hash is set to something other than its current value
    */

    const data = {
        time: e.timeStamp / 1000
    };

    var changed = false;

    if (location.pathname !== pathname) {
        pathname = data.path = location.pathname;
        changed = true;
    }

    if (location.search !== search) {
        search = location.search;
        data.params = new URLSearchParams(search);
        changed = true;
    }

    if (location.hash !== hash) {
        hash = location.hash;
        data.identifier = stripHash(hash);
        changed = true;
    }

    const json = e.state ? JSON.stringify(e.state) : "null" ;

    if (json !== state) {
        state = json;
        data.state = e.state;
        changed = true;
    }

    // If nothing changed, make distributor ignore by returning false
    return changed && data;
});

if (DEBUG) {
    distributor.on(function(data) {
        log('navigate', data);
    });
}


/** 
location

DOMs `location` object provides an interface that combines the browsers' 
`location` and `history` APIs.
**/

export default {
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
        return new URLSearchParams(location.search);
    },

    set params(params) {
        const url = this.URL();
        url.search = new URLSearchParams(params);
        history.replaceState(history.state, document.title, url);
    },

    /** .params **/
    get path() {
        return location.pathname;
    },

    set path(path) {
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

        if (url.origin !== location.origin) {
            // Navigate away from this site
            window.location.href = url;
            return this;
        }

        const hash   = location.hash;
        const identifier = stripHash(url.hash);

        log('navigate()',
            (url.pathname !== location.pathname ? 'path: "' + url.pathname + '", ' : '') +
            (url.search !== location.search ? 'params: "' + url.search + '", ' : '') + 
            (url.hash !== location.hash ? 'hash: "' + url.hash + '", ' : '') + 
            (!!state !== !!history.state ? 'state: ' + JSON.stringify(state) : '') 
        );

        // If only the hash has changed and state is null and scroll is true, 
        // employ location.hash to navigate, giving us automatic scroll
        if (
            url.pathname === location.pathname 
            && url.search === location.search 
            && state === null 
            && identifier
            && identifier !== this.identifier
            && scroll
        ) {
            location.hash = identifier;
            return this;
        }


        const href = url.pathname + url.search + (identifier ? url.hash : '');

        // Force :target selector to update when there is a new #identifier. This 
        // also triggers a popstate event, which the distributor picks up and 
        // handles as a navigation change
        if (url.hash !== hash) {
            updateTarget(href);
        }

        // Where no popstate is scheduled we nonetheless want to notify 
        // navigation change so simulate an event and pass to distributor, and 
        // make it async to echo the behaviour of a real popstate event
        else {
            history.pushState(state, document.title, href);
            Promise.resolve().then(function() {
                distributor.handleEvent({
                    type: 'navigate',
                    state: state,
                    timeStamp: window.performance.now()
                });
            });
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
