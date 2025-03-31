

import create from '../create.js';

const $internals = Symbol('internals');

function attachFormInternals(element) {
    // Use native attachInternals() where it exists. Native internals can only
    // be got on autonomous custom elements.
    const internals = (element.attachInternals && !element.getAttribute('is')) ?
        element.attachInternals() :
        { shadowRoot: element.shadowRoot } ;

    if (internals.setFormValue) return internals;

    // Otherwise polyfill it with a pseudo internals object, actually a hidden
    // input that we put inside element (but outside the shadow DOM). We may
    // not yet put this in the DOM however – it violates the spec to give a
    // custom element children before it's contents are parsed. Instead we
    // wait until connectCallback.
    internals.polyfillInput = create('input', { type: 'hidden', name: elem.name });
    element.appendChild(internals.polyfillInput);

    // Polyfill internals object setFormValue
    internals.setFormValue = function(value) {
        this.input.value = value;
    };

    return internals;
}

export function createInternals(Element, element, shadow) {
    return (element[$internals] = Element.formAssociated ?
        attachFormInternals(element) :
    (element.attachInternals && !element.getAttribute('is')) ?
        element.attachInternals() :
        { shadowRoot: shadow } ;
    );
}

export function getInternals(element) {
    // Default to an empty object
    return element[$internals];// || (element[$internals] = {});
}
