
const selector = `
    a[href]:not([tabindex="-1"], [hidden]),
    area[href]:not([tabindex="-1"], [hidden]),
    input:not([disabled]):not([tabindex="-1"], [hidden], [type="hidden"]),
    select:not([disabled]):not([tabindex="-1"], [hidden], [type="hidden"]),
    textarea:not([disabled]):not([tabindex="-1"], [hidden], [type="hidden"]),
    button:not([disabled]):not([tabindex="-1"], [hidden], [type="hidden"]),
    iframe:not([tabindex="-1"], [hidden]),
    [tabindex]:not([tabindex="-1"], [hidden]),
    [contentEditable=true]:not([tabindex="-1"], [hidden])
`;

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

export function focusInside(element) {
    const focusable = element.querySelector(selector);

    if (focusable) {
        focusable.focus();
    }
    else {
        element.focus();
    }
}
