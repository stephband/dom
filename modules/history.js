
import get from '../../fn/modules/get.js';

const history  = window.history;
const location = window.location;
const nothing  = Object.freeze({});

const popstates = cache(function popstates() {
    return events('popstate', window)
    .map((e) => e.state);
});

export default {
    // .href
    get href() {
        return location.href;
    },

    get navigations() {
        return events('popstate', window)
        .map(get('state'));
    },

    // .state
    get state() {
        return history.state;
    },
    
    set state(state) {
        history.replaceState(state, document.title);
    },

    // .url
    get url() {
        return new URL(location.href);
    },

    set url(url) {
        history.replaceState(history.state, document.title, url);
    },

    push: function push(url, state) {
        state = state || nothing;
        history.pushState(state, document.title, url);
        return this; 
    },

    replace: function replace(url, state) {
        state = state || nothing;
        history.replaceState(state, document.title, url);
        return this;
    },
    
    navigations: events('popstate', window).map((e) => e.state);
    
    changes: 
    
};
