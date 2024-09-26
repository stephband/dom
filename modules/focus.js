
import noop            from 'fn/noop.js';
import requestTick     from 'fn/request-tick.js';
import { select }      from './select.js';

//const selector = 'input, textarea, select, button, [tabindex]:not([tabindex="-1"])';
const selector = ':not([disabled], [tabindex="-1"], [hidden], [type="hidden"], [aria-hidden="true"])';


/**
.focus(element)
Moves focus to the first focusable element found inside `element`. If none are
found, moves focus to `element`, if focusable.
**/

const focusOptions = { preventScroll:true };

export default function focus(parent) {
    const elements = parent.querySelectorAll(selector);
    const c = elements.length;

    let n = -1;
    let element;
    while (++n < c) {
        element = elements[n];

        // The only sure way to tell whether .focus() actually focuses an
        // element is to try it and see.
        element.focus(focusOptions);
        if (document.activeElement === element) return;
    }

    // If nothing inside element was focusable attempt to focus element itself...
    // Should we do this first??
    parent.focus(focusOptions);
}


/**
trapFocus(node)
Constrains focus to focusable elements inside `node`.
Returns a function that removes the trap.
Calling `trapFocus(node)` again also removes the existing trap.
**/

let active;
let element;

function preventFocus(e) {
    if (!element) debugger;

    // Don't prevent focus on or inside node
    if (element.contains(e.target) || element === e.target) return;

    // Set the focus back to the first thing inside.
    focus(element);

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
    element = node;
    active = document.activeElement;

    // Prevent focus in capture phase
    document.addEventListener("focus", preventFocus, true);

    // Move focus into node
    requestTick(() => focus(element));
}

export function untrapFocus() {
    if (!element) return;

    // Stop focus prevention
    document.removeEventListener('focus', preventFocus, true);

    // Set focus back to the thing that was last focused when the
    // dialog was opened
    if (active) requestTick(() => active.focus());
}
