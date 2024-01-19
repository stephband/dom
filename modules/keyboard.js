
import overload from '../../../../fn/modules/overload.js';
import events   from '../../../../dom/modules/events.js';

/**
keyboard(keymap, element)

Normalises key name/actions to the pattern `modifiers-keycode:action` and calls
corresponding functions in `keymap` on keydown, keyhold and keyup. Returns a
stoppable. TODO: Make it a proper stream??

```js
keyboard({
    'A:down': (e) => { ... },
    'A:hold': (e) => { ... },
    'A:up':   (e) => { ... },
    // Where no action is specified the handler is called for both 'down' and 'hold'
    'A':      (e) => { ... },
    // Prefix modifiers
    'shift-A': (e) => { ... },
    'shift-ctrl-opt-cmd-A:down': (e) => { ... },
}, document.body);
```

Browser keyboard events are very finicky, mileage may vary.
**/

const keynames = {
    'ArrowDown':  'down',
    'ArrowLeft':  'left',
    'ArrowRight': 'right',
    'ArrowUp':    'up',
    'Shift':      'shift',
    'Control':    'control',
    'Alt':        'alt',
    'Meta':       'meta',
    'Fn':         'fn'
};

function toCode(e) {
        // Lookup replacement key in keynames, use it if it exists
    return keynames[e.key] ? keynames[e.key] :
        // Turn code 'Digit0' into '0'
        e.code.startsWith('Digit') ? e.code[5] :
        // Turn code 'KeyA' into 'A'
        e.code.startsWith('Key') ? e.code[3] :
        // All other codes to lowercase
        e.code.toLowerCase() ;
}

//function toLabel(e) {
//    return '[' + e.key + ']' ;
//}

function updateModifiers(keys, e) {
    // We cannot reliably track keyup on command (or 'Meta') keys on MacOS,
    // so here we track it via its state on other events. I think we may as well
    // track all modifiers we have access to as we cannot predict reliably when
    // the OS might steal any of them.
    if (keys.shift && !e.shiftKey) { delete keys.shift; }
    if (keys.ctrl  && !e.ctrlKey)  { delete keys.ctrl; }
    if (keys.alt   && !e.altKey)   { delete keys.alt; }
    if (keys.meta  && !e.metaKey)  { delete keys.meta; }
}

function toModifiers(keys) {
    return (keys.shift  ? 'shift-' : '')
        + (keys.fn      ? 'fn-' : '')
        + (keys.control ? 'ctrl-' : '')
        + (keys.alt     ? 'opt-' : '')
        + (keys.meta    ? 'cmd-' : '') ;
}

export default function keyboard(responses, element) {
    const keys = {};
    let frame = null;

    function respondToKeys(time) {
        const modifiers = toModifiers(keys);

        for (let code in keys) {
            // Don't respond to held modifiers
            if (/^(?:shift|control|alt|meta)$/.test(code)) {
                continue;
            }

            const respondHold = responses[modifiers + code + ':hold'] || responses[modifiers + code];
            //console.log('HOLD', modifiers + code);

            // Respond to key hold
            if (respondHold) { respondHold(keys[code], code); }
        }

        frame = requestAnimationFrame(respondToKeys);
    }


    const keydowns = events('keydown', element).each((e) => {
        // Keep track of modifiers
        updateModifiers(keys, e);

        // Multiple keydowns can be sent for one key when it is held down. But
        // we are already responding to this key, so dedup keydown.
        if (e.repeat || keys[e.code]) { return; }
        const code = toCode(e);
        keys[code] = e;

        const modifiers   = toModifiers(keys);
        const respondDown = responses[modifiers + code + ':down'] || responses[modifiers + code];
        const respondHold = responses[modifiers + code + ':hold'] || responses[modifiers + code];
        //console.log('DOWN', modifiers + code);

        // Respond to key down
        if (respondDown) {
            e.preventDefault();
            respondDown(e, code);
        }
        else if (responses.default) {
            responses.default(e, code);
        }

        // Respond to key hold
        if (respondHold) {
            // Where the frame clock is not running, start it
            if (!frame) {
                frame = requestAnimationFrame(respondToKeys);
            }
        }
    });

    const keyups = events('keyup', element).each((e) => {
        // Keep track of modifiers
        updateModifiers(keys, e);

        // Remove key from keys
        const code = toCode(e);
        delete keys[code];

        const modifiers = toModifiers(keys);
        const respondUp = responses[modifiers + code + ':up'];
        //console.log('UP  ', code, Object.keys(keys).length, Object.keys(keys).join(', '));

        // Respond to key up
        if (respondUp) {
            e.preventDefault();
            respondUp(e, code);
        }

        // When no keys are pressed cancel frame timer
        if (Object.keys(keys).length === 0) {
            cancelAnimationFrame(frame);
            frame = null;
        }

        return;
    });

    // Return a pseudo stoppable 'stream'. TODO: work out a sensible way of
    // returning a merged stream?
    return {
        stop: function() {
            keydowns.stop();
            keyups.stop();
        }
    };
}
