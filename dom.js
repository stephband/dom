if (window.console && window.console.log) {
    window.console.log('%cdom%c         – https://github.com/stephband/dom', 'color: #0e83c7; font-weight: 600;', 'color: inherit; font-weight: 400;');
}

import { curry, deprecate } from '../fn/fn.js';


// Document

export { default as ready } from './modules/ready.js';
export { default as now } from './modules/now.js';
export { default as breakpoint } from './modules/breakpoint.js';

// HTML

export { default as escape } from './modules/escape.js';

import _parse from './modules/parse.js';
export const parse = curry(_parse, true);

// Inspect

export * from './modules/nodes.js';
export { default as tag } from './modules/tag.js';

import _contains from './modules/contains.js';
export const contains = curry(_contains, true);

import _attribute from './modules/attribute.js';
export const attribute = curry(_attribute, true);

export * from './modules/traversal.js';

import _find from './modules/find.js';
export const find = curry(_find, true);

import _closest from './modules/closest.js';
export const closest = curry(_closest, true);

export { default as children } from './modules/children.js';

import _matches from './modules/matches.js';
export const matches = curry(_matches, true);

import _query from './modules/query.js';
export const query = curry(_query, true);

// Mutate

import _assign from './modules/assign.js';
export const assign  = curry(_assign, true);

import _append from './modules/append.js';
export const append  = curry(_append, true);

import _prepend from './modules/prepend.js';
export const prepend = curry(_prepend, true);

export { default as clone } from './modules/clone.js';
export { default as create } from './modules/create.js';
export { default as define } from './modules/define.js';
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
export const flashClass  = deprecate(frameClass, 'flashClass() is now frameClass()');

// Style

export { default as box } from './modules/box.js';
export { default as boundingBox } from './modules/bounding-box.js';

import { default as _offset } from './modules/offset.js';
export const offset = curry(_offset, true);


export * from './modules/units.js';

export { default as prefix } from './modules/prefix.js';

import _style from './modules/style.js';
export const style = curry(_style, true);

// Fragments

export * from './modules/fragments.js';

// Events

export { default as Event } from './modules/event.js';
export { isPrimaryButton, isTargetEvent, preventDefault } from './modules/events.js';

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
export { default as animateScroll } from './modules/animate-scroll.js';
export { default as scrollRatio } from './modules/scroll-ratio.js';
export * from './modules/scroll.js';
