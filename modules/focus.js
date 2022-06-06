
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
