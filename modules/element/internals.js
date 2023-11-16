

import create from '../create.js';

const $internals = Symbol('internals');

function attachInternals(element) {
    var internals;

    // Use native attachInternals where it exists
    if (element.attachInternals) {
        internals = element.attachInternals();
        if (internals.setFormValue) {
            return internals;
        }
    }
    else {
        internals = {
            shadowRoot: elem.shadowRoot
        };
    }

    // Otherwise polyfill it with a pseudo internals object, actually a hidden
    // input that we put inside element (but outside the shadow DOM). We may
    // not yet put this in the DOM however – it violates the spec to give a
    // custom element children before it's contents are parsed. Instead we
    // wait until connectCallback.
    internals.polyfillInput = create('input', { type: 'hidden', name: elem.name });
    elem.appendChild(internals.polyfillInput);

    // Polyfill internals object setFormValue
    internals.setFormValue = function(value) {
        this.input.value = value;
    };

    return internals;
}

export function createInternals(Element, element, shadow) {
    return (element[$internals] = Element.formAssociated ?
        attachInternals(element) :
        { shadowRoot: shadow }
    );
}

export function getInternals(element) {
    // Default to an empty object
    return element[$internals];// || (element[$internals] = {});
}
