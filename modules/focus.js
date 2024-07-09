
const selector = ':not([disabled], [tabindex="-1"], [hidden], [type="hidden"], [aria-hidden="true"])';

export function focusClosest(element) {
    // Find the closest focusable element...
    let focusable = element;
    while (focusable.tabIndex === -1) {
        focusable = focusable.parentNode;
    }

    // focusable may be a shadowRoot, get the host
    focusable = focusable.host || focusable;
    // It may be document, which does not have a .focus() method
    focusable.focus && focusable.focus();
    // Ooof, what a polava
}

/**
.focusInside(element)
Moves focus to the first focusable element found inside `element`. If none are
found, moves focus to `element`, if focusable.
**/

export function focusInside(element) {
    const elements = element.querySelectorAll(selector);
    const c = elements.length;

    let n = -1, node;
    while (++n < c) {
        node = elements[n];

        // The only way to tell whether .focus() actually focuses an element
        // is to try it and see
        node.focus();
        if (document.activeElement === node) {
            return;
        }
    }

    // If nothing inside element was focusable attempt to focus element itself
    element.focus();
}
