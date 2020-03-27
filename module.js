
if (window.console && window.console.log) {
    window.console.log('%cdom%c         – https://stephen.band/dom', 'color: #3a8ab0; font-weight: 600;', 'color: inherit; font-weight: 400;');
}

import curry from '../fn/modules/curry.js';


// Document

export { default as ready }      from './modules/ready.js';
export { default as now }        from './modules/now.js';
export { default as media }      from './modules/media.js';
export { default as breakpoint } from './modules/media.js';
export { default as features }   from './modules/features.js';

// HTML

export { default as element }    from './modules/element.js';
export { default as escape }     from './modules/escape.js';
export * from './modules/parse.js';

// Inspect

export * from './modules/nodes.js';

export { default as attribute }  from './modules/attribute.js';
export { default as contains }   from './modules/contains.js';
export { default as closest }    from './modules/closest.js';
export { default as find }       from './modules/find.js';
export { default as matches }    from './modules/matches.js';
export { default as query }      from './modules/select.js';
export { default as select }     from './modules/select.js';
export { default as tag }        from './modules/tag.js';

export * from './modules/traversal.js';

export { default as children } from './modules/children.js';


// Mutate

export { default as assign }   from './modules/assign.js';
export { default as append }   from './modules/append.js';
export { default as prepend }  from './modules/prepend.js';
export { default as clone }    from './modules/clone.js';
export { default as create }   from './modules/create.js';
export { default as identify } from './modules/identify.js';

export { empty, remove } from './modules/mutation.js';

import { after as _after, before as _before, replace as _replace } from './modules/mutation.js';
export const before  = curry(_before, true);
export const after   = curry(_after, true);
export const replace = curry(_replace, true);

// Classes

export { classes } from './modules/classes.js';

import { addClass as _addClass, removeClass as _removeClass, frameClass as _frameClass } from './modules/classes.js';
export const addClass    = curry(_addClass, true);
export const removeClass = curry(_removeClass, true);
export const frameClass  = curry(_frameClass, true);

// Style

export { default as rect } from './modules/rect.js';
export { default as boundingBox } from './modules/bounding-box.js';

import { default as _offset } from './modules/offset.js';
export const offset = curry(_offset, true);


export * from './modules/parse-value.js';

export { default as prefix } from './modules/prefix.js';

import _style from './modules/style.js';
export const style = curry(_style, true);

// Fragments

export * from './modules/fragments.js';

// Events

export { default as Event } from './modules/event.js';
export { isPrimaryButton, isTargetEvent, preventDefault } from './modules/events.js';
export { default as match } from './modules/match.js';
import { default as _events, on as __on, once as __once, off as __off, trigger as __trigger } from './modules/events.js';
export const events = curry(_events, true);

// Legacy uncurried functions

Object.assign(events, {
    on:      __on,
    once:    __once,
    off:     __off,
    trigger: __trigger
});

export const on = curry(function(type, fn, node) {
    __on(node, type, fn);
    return node;
}, true);

export const off = curry(function(type, fn, node) {
    __off(node, type, fn);
    return node;
}, true);

export { default as gestures } from './modules/gestures.js';

import { default as _trigger } from './modules/trigger.js';
export const trigger = curry(_trigger, true);

import { default as _delegate } from './modules/delegate.js';
export const delegate = curry(_delegate, true);

export { default as trapFocus } from './modules/trap-focus.js';

export { default as toKey, toKeyString, toKeyCode } from './modules/to-key.js';

// Animation

import _animate from './modules/animate.js';
export const animate = curry(_animate, true);

import _transition from './modules/transition.js';
export const transition = curry(_transition, true);

export { default as fullscreen } from './modules/fullscreen.js';

// Validation

export * from './modules/validation.js';

// Scroll

export { default as safe } from './modules/safe.js';
//export { default as animateScroll } from './modules/animate-scroll.js';
export { default as scrollRatio } from './modules/scroll-ratio.js';
export * from './modules/scroll.js';

// Requests

export { getCookie } from './modules/cookies.js';
export { config as requestConfig } from './modules/request.js';
import { default as _request } from './modules/request.js';
export const request = curry(_request, true, 4);
export { requestGet, requestPatch, requestPost, requestDelete, throttledRequest } from './modules/request.js';
