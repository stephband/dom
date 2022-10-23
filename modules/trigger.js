
/**
trigger(type, node)

Triggers event of `type` on `node`. Returns `false` if the event default was
prevented, otherwise `true`.

```
trigger('dom-activate', node);
```
**/

/**
trigger(event, node)

Triggers an event described by `event` on `node`. The `event` object must have a
`type` property. The `details` property can be used to carry a payload. The
options `bubbles`, `cancelable` and `composed` determine the behaviour of the
event. All other properties are assigned as properties on the event.

```
trigger({
    type: 'dom-activate',
    detail: {...},
    bubbles:    true,
    cancelable: true,
    composed:   false
}, node);
```

Returns `false` if the event default was prevented, otherwise `true`.
**/

import curry from '../../fn/modules/curry.js';

const assign   = Object.assign;

const defaults = {
    // The event bubbles (false by default)
    // https://developer.mozilla.org/en-US/docs/Web/API/Event/Event
    bubbles: true,

    // The event may be cancelled (false by default)
    // https://developer.mozilla.org/en-US/docs/Web/API/Event/Event
    cancelable: true

    // Trigger listeners outside of a shadow root (false by default)
    // https://developer.mozilla.org/en-US/docs/Web/API/Event/composed
    //composed: false
};

export function trigger(type, node) {
    let options = defaults;
    let properties, detail, bubbles, cancelable, composed, event;

    if (typeof type === 'object') {
        ({ type, detail, bubbles, cancelable, composed, ...properties } = type);

        // Options accepted by CustomEvent:
        // detail:     any
        // bubbles:    true | false
        // cancelable: true | false
        // composed:   true | false
        // https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent
        event = assign(new CustomEvent(type, {
            detail,
            bubbles:    bubbles    || defaults.bubbles,
            cancelable: cancelable || defaults.cancelable,
            composed:   composed   || defaults.composed
        }), properties);
    }
    else {
        event = new CustomEvent(type, defaults);
    }

    return node.dispatchEvent(event);
}

export default curry(trigger, true);

// Expose to console in DEBUG mode
if (window.DEBUG) {
    Object.assign(window.dom || (window.dom = {}), { trigger });
}
