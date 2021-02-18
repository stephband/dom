
const history  = window.history;
const location = window.location;
const nothing  = Object.freeze({});

function PopstateHandler(fn, context) {
    this.context = context || null;
    this.fn = fn;
}

PopstateHandler.prototype.handleEvent = function handleEvent(e) {
    return this.fn.call(this.context, new URL(location.href), e.state);
};

export default {
    /** .href **/
    get href() {
        return location.href;
    },

    /** .state **/
    get state() {
        return history.state;
    },
    
    set state(state) {
        history.replaceState(state, document.title);
    },

    /** .navigations(fn) **/
    navigations: function(fn) {
        // Fires fn(url, state) on popstate
        window.addEventListener('popstate', new PopstateHandler(fn));
    },

    /** .push(url, state) **/
    push: function push(url, state) {
        state = state || nothing;
        history.pushState(state, document.title, url);
        return this; 
    },

    /** .replace(url, state) **/
    replace: function replace(url, state) {
        state = state || nothing;
        history.replaceState(state, document.title, url);
        return this;
    },

    /** .url() **/
    url: function url() {
        return new URL(location.href);
    }
};
