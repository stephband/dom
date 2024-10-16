
/**
trigger(type, node)

Triggers event of `type` on `node`. Returns `false` if the event default was
prevented, otherwise `true`.

```
trigger('activate', node);
```

Alternatively the first argument may be an object with a `type` property, and
optionally `detail`, which must be an object, and `bubbles`, `cancelable` and
`composed` options, which determine the behaviour of the event.

```
trigger({
    type:       'activate',
    detail:     {...},
    bubbles:    true,
    cancelable: true,
    composed:   false
}, node);
```
**/

import curry from 'fn/curry.js';

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

        // https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent
        // Options accepted by CustomEvent:
        // detail:     any
        // bubbles:    true | false
        // cancelable: true | false
        // composed:   true | false
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
