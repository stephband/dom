
/**
mutations(type, element)
Creates a stream of mutations (powered by a `MutationObserver`), where `type` is
one of `'all'`, `'attributes'`, `'children'`, `'tree'`, `'text'`, or an object
of options for the `MutationObserver`.
**/

import Stream, { stop } from '../../fn/modules/stream.js';

const assign = Object.assign;

/*
Types of `options` shortcuts
*/

const types = {
    all: {
        attributes:    true,
        characterData: true,
        childList:     true,
        subtree:       true
    },

    attributes: {
        attributes: true
    },

    children: {
        childList: true
    },

    tree: {
        childList: true,
        subtree: true
    },

    text: {
        characterData: true,
        subtree: true
    }
};

function pushReducer(target, value) {
    target.push(value);
    return target;
}

/*
MutationsProducer(element, options)
*/

function MutationsProducer(element, options) {
    this.element = element;
    this.options = options;
}

assign(MutationsProducer.prototype, {
    pipe: function(stream) {
        this[0] = stream;
        this.observer = new MutationObserver((mutations) => mutations.reduce(pushReducer, this.target));
        this.observer.observe(this.element, this.options);
    },

    stop: function() {
        this.observer.disconnect();
        stop(this);
    }
});

/*
mutations(type, element)
*/

export function mutations(type, element) {
    const options = typeof type === 'string' ? types[type] : type ;
    return new Stream(new MutationsProducer(element, options));
}

/*
Expose to console in DEBUG mode
*/

// Expose to console in DEBUG mode
if (window.DEBUG) {
    Object.assign(window.dom || (window.dom = {}), { mutations });
}
