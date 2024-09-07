
import Signal from 'fn/signal.js';

const defaults = {
    search:   '',
    params:   {},
    hash:     '',
    fragment: '',
    state:    null
};

// TODO: Deno/ESBuild don't seem to know that window.location is an object, is
// there a way to put it in the build scope so we don't have to...
const wh       = window.history  || {};
const wl       = window.location || {};
const pathname = Signal.of(wl.pathname);
const search   = Signal.of(wl.search);
const hash     = Signal.of(wl.has);
const href     = Signal.of(wl.href);
const state    = Signal.of(JSON.stringify(wh.state));

export default {
    /** .base **/
    /** .path **/
    base: '/',

    /** .hash **/
    set hash(string) {
        // Warning: replacing the hash does not update :target styles unless the
        // document scrolls. It's a bad oversight on the part of browsers and
        // they refuse to do anything about it.
        // https://github.com/whatwg/html/issues/639

        if (string === hash.value) return;

        const url = string ?
            string :
            window.location.href.replace(/#.*$/, '');

        history.replaceState(history.state, document.title, url);

        // That did not trigger a popstate event so we need to notify that
        // hash has been updated
        hash.value = window.location.hash;
    },

    get hash() {
        return hash.value;
    },

    /** .fragment **/
    get fragment() {
        return this.hash && stripHash(this.hash) || defaults.fragment;
    },

    /** .params **/
    get params() {
        return this.search ?
            Object.fromEntries(new URLSearchParams(this.search)) :
            defaults.params ;
    },

    /** .pathname **/
    get pathname() {
        return pathname.value;
    },

    /** .path **/
    get path() {
        return this.pathname.slice(this.base.length);
    },

    /** .search **/
    get search() {
        return Object.fromEntries(new URLSearchParams(location.search));
    },

    /** .href **/
    get href() {
        return href.value;
    },

    /** .state **/
    get state() {
        return state.value;
    }
};


/* Keep location up-to-date */

function update() {
    // Update signals
    pathname.value = window.location.pathname;
    search.value   = window.location.search;
    hash.value     = window.location.hash;
    href.value     = window.location.href;
    state.value    = JSON.stringify(window.history.state);
}

// Listen to load and popstate events to notify when navigation has occured
window.addEventListener('popstate', update);
window.addEventListener('DOMContentLoaded', update);
window.addEventListener('hashchange', function(e) {
    /*
    A `hashchange` is received when:
    - navigation via browser buttons when the hash changes
    - navigation via typing a new hash in the URL bar
    - navigation via history.back() and .forward() when the hash changes
    - location.hash is set to something other than its current value
    */

    hash.value = window.location.hash;
});
