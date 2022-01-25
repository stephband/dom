
/**
mutations()
See here for options:
https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver/observe
**/

import Stream from '../../fn/stream/stream.js';

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

    descendents: {
        childList: true,
        subtree: true
    },

    text: {
        characterData: true
    }
};

function mutations(type, element) {
    return new Stream((stream) => {
        const options = types[type];
        const observer = new MutationObserver((mutations) => stream.push(mutations));
        observer.observe(element, options);

        const stop = stream.stop;
        stream.stop = () => {
            observer.disconnect()
            stop.apply(stream);
        };
    });
}
