
import noop            from '../../fn/modules/noop.js';
import requestTick     from '../../fn/modules/request-tick.js';
import { select }      from './select.js';

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


/**
trapFocus(node)
Constrains focus to focusable elements inside `node`.
Returns a function that removes the trap.
Calling `trapFocus(node)` again also removes the existing trap.
*/

let active;
let node;

function preventFocus(e) {
    // Don't prevent focus on or inside node
    if (node.contains(e.target) || node === e.target) return;

    // Set the focus back to the first thing inside.
    focusInside(node);

    // Neuter any other side effects
    e.preventDefault();
    e.stopPropagation();
}

export function trapFocus(node) {
    // Trap focus as described by Nikolas Zachas:
    // http://www.nczonline.net/blog/2013/02/12/making-an-accessible-dialog-box/
    // If there is an existing focus trap, remove it
    untrapFocus();

    // Cache the currently focused node
    active = document.activeElement;

    // Prevent focus in capture phase
    document.addEventListener("focus", preventFocus, true);

    // Move focus into node
    requestTick(() => focusInside(node));
}

export function untrapFocus(node) {
    if (!node) return;

    // Stop focus prevention
    document.removeEventListener('focus', preventFocus, true);

    // Set focus back to the thing that was last focused when the
    // dialog was opened
    if (active) requestTick(() => active.focus());
}
