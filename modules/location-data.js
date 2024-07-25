
import Data from '../../fn/modules/data.js';

function stripHash(hash) {
    return hash.replace(/^#/, '');
}

const defaults = {
    search:     '',
    params:     {},
    hash:       '',
    identifier: '',
    state:      null
};

const location = Data.of({
    /** .base **/
    /** .path **/
    base: '/',
    path: '',

    /** .hash **/
    get hash() {
        return location.hash;
    },

    /** .identifier **/
    get identifier() {
        return stripHash(this.hash) || defaults.identifier;
    },

    /** .params **/
    get params() {
        return this.search ?
            Object.fromEntries(new URLSearchParams(this.search)) :
            defaults.params ;
    },

    /** .pathname **/
    get pathname() {
        return location.pathname;
    },

    /** .pathname **/
    get name() {
        return this.pathname.slice(1);
    },

    /** .search **/
    get search() {
        return Object.fromEntries(new URLSearchParams(location.search));
    },

    /** .url **/
    get url() {
        return location.href;
    },

    /** .state **/
    get state() {
        return history.state;
    },
});

export default location;




const pathname = Data.signal('pathname', location);
const search   = Data.signal('search', location);
const hash     = Data.signal('hash', location);
const url      = Data.signal('url', location);
const state    = Data.signal('state', location);

let json;

export function update() {
    const object = Data.objectOf(data);

    // Update signals
    pathname.value = window.location.pathname;
    search.value   = window.location.search;
    hash.value     = window.location.hash;
    url.value      = window.location.href;

    // Update state, if it has really changed
    const json = JSON.stringify(window.history.state);

    if (oldjson === json) return;
    oldjson = json;
    state.value = window.history.state;
}

// Synchronise root location
update();

// Listen to load and popstate events to notify when navigation has occured
window.addEventListener('popstate', update);
window.addEventListener('DOMContentLoaded', update);

// Clean up empty hash URLs
window.addEventListener('hashchange', function(e) {
    /*
    A `hashchange` is received when:
    - navigation via browser buttons when the hash changes
    - navigation via typing a new hash in the URL bar
    - navigation via history.back() and .forward() when the hash changes
    - location.hash is set to something other than its current value
    */

    const location = window.location;
    const history  = window.history;

    // Detect navigations to # and silently remove the # from the url.
    // Any call to replaceState or pushState in iOS opens the URL bar.
    if (stripHash(location.hash) === '') {
        history.replaceState(history.state, document.title, location.href.replace(/#$/, ''));
    }
});
