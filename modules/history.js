
const history  = window.history;
const location = window.location;
const nothing  = Object.freeze({});

import create from './create.js';
import delegate from './delegate.js';

const dummyId   = 'dummy-target-for-managing-scroll';
const dummyElem = create('div', {
    id: 'dummy-target-for-managing-scroll',
    style: 'position: fixed; top: 0;'
});


//document.body.appendChild(dummy);

function PopstateHandler(fn, context) {
    this.context = context || null;
    this.fn = fn;
}

PopstateHandler.prototype.handleEvent = function handleEvent(e) {
    return this.fn.call(this.context, new URL(location.href), e.state);
};

function stripHash(hash) {
    return hash.replace(/^#/, '');
}

const lll = {
    /** .id **/
    get id() {
        return stripHash(location.hash);
    },

    set id(id) {
        // Replace the hash without changing history
        history.replaceState(history.state, document.title, id ? 
            '#' + id :
            location.href.replace(/#.*$/, '')
        );
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

    /** .navigate(url) **/
    navigate: function(url, scroll = true) {
        console.log('navigate()', url);

        const id = (/#(.*)$/.exec(url) || [])[1];
        if (id === undefined) { return; }

        // If we navigate to empty hash, prevent scroll-to-top by navigating to
        // a dummy element with position: fixed, and immediately reset the hash
        // (via replaceState so that it does not cause a second hashchange). 
        // Conveniently, the hashchange event fires after the replacement and 
        // the hash has already been emptied.
        if (id === '') {
            // Target dummy to avoid scroll
            const id = dummyId;
            document.body.appendChild(dummyElem);
            location.hash = id;
            history.replaceState(history.state, document.title, location.href.replace(/#.*$/, ''));
            dummyElem.remove();
            return;
        }

        //const target = document.getElementById(id);
        //target.id = '';
        location.hash = id;
        //target.id = id;
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
    URL: function url() {
        return new URL(location.href);
    }
};

export default lll;

document.addEventListener('click', delegate({
    '[href*="#"]': function(link, e) {
        // Grab links pointing inside this documnebnt
        if (link.origin !== window.location.origin) { return; }
        lll.navigate(link.href);
        e.preventDefault();
    }
}));

window.addEventListener('hashchange', function(e) {
    console.log('HASHCHANGE', location.href);
    // Detect navigations to # and silently remove the # from the url
    if (stripHash(location.hash) === '') {
        history.replaceState(history.state, document.title, location.href.replace(/#$/, ''));
    }
});

window.addEventListener('scroll', function(e) {
    console.log('SCROLL', location.href);
});
