
/**
mutations(type, element)
Creates a stream of mutations (powered by a `MutationObserver`), where `type` is
one of `'all'`, `'attributes'`, `'children'`, `'tree'`, `'text'`, or an object
of options for the `MutationObserver`.
**/

import Stream, { Source } from '../../fn/stream/stream.js';

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
        characterData: true
    }
};

/*
MutationSource(element, options)
*/

function MutationSource(element, options) {
    this.element = element;
    this.options = options;
}

assign(MutationSource.prototype, Source.prototype, {
    /* Inherited from Source .pipe(), .done() */

    start: function(stream) {
        this.observer = new MutationObserver((mutations) => this.target.push(mutations));
        this.observer.observe(this.element, this.options);
    },

    stop: function() {
        this.observer.disconnect();
        Source.prototype.stop.apply(this);
    }
});

/*
mutations(type, element)
*/

export function mutations(type, element) {
    const options = typeof type === 'string' ? types[type] : type ;
    return new Stream(new MutationSource(element, options));
}

/*
Expose to console in DEBUG mode
*/

if (window.DEBUG) {
    window.mutations = mutations;
}
