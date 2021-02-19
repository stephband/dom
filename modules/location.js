
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

        history.replaceState(history.state, document.title, url);
        history.pushState(history.state, document.title, url);
        history.back();
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
        // Conveniently, the hashchange event fires after the replacement, so 
        // inside handlers window.location.hash is correct.
        if (id === '') {
            // Target dummy to avoid scroll
            document.body.appendChild(dummyElem);
            location.hash = dummyId;
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
    '[href="#"], [href="#navigation"]': function(link, e) {
        console.log(link.origin === window.location.origin, link.hash);

        // Grab links pointing inside this document
        if (link.origin !== window.location.origin) { return; }

        // If there is a hash allow it to navigate normally?
        //if (id) { return; }
        lll.id = stripHash(link.hash);
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
    //console.log('SCROLL', location.href);
});
