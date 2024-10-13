
/**
mutations(type, element)
Creates a stream of mutations (powered by a `MutationObserver`), where `type` is
one of `'all'`, `'attributes'`, `'children'`, `'tree'`, `'text'`, or an object
of options for the `MutationObserver`.
**/

import Stream from 'fn/stream.js';

const assign = Object.assign;

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

function Mutations(element, options) {
    this.element = element;
    this.options = options;
}

assign(Mutations.prototype, Stream.prototype, {
    start: function(stream) {
        this[0] = stream;
        this.observer = new MutationObserver((mutations) => mutations.reduce(pushReducer, this.target));
        this.observer.observe(this.element, this.options);
        return this;
    },

    stop: function() {
        this.observer.disconnect();
        return Stream.prototype.stop.apply(this);
    }
});

/*
mutations(type, element)
*/

export function mutations(type, element) {
    const options = typeof type === 'string' ? types[type] : type ;
    return new Mutations(element, options);
}
