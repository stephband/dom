
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

export * from './modules/node.js';

export { default as attribute }  from './modules/attribute.js';
export { default as contains }   from './modules/contains.js';
export { default as closest }    from './modules/closest.js';
export { default as find }       from './modules/find.js';
export { default as matches }    from './modules/matches.js';
export { default as query }      from './modules/select.js';
export { default as select }     from './modules/select.js';
export { default as tag }        from './modules/tag.js';

export * from './modules/traverse.js';

export { default as children } from './modules/children.js';


// Mutate

export { default as assign }   from './modules/assign.js';
export { default as append }   from './modules/append.js';
export { default as prepend }  from './modules/prepend.js';
export { default as clone }    from './modules/clone.js';
export { default as create }   from './modules/create.js';
export { default as identify } from './modules/identify.js';

export { empty } from './modules/mutation.js';
export { default as remove } from './modules/remove.js';

import { after as _after, before as _before, replace as _replace } from './modules/mutation.js';
export const before  = curry(_before, true);
export const after   = curry(_after, true);
export const replace = curry(_replace, true);

// Classes

export { default as classes, addClass, removeClass, frameClass } from './modules/classes.js';


// Style

export { default as rect } from './modules/rect.js';
export { default as boundingBox } from './modules/bounding-box.js';

import { default as _offset } from './modules/offset.js';
export const offset = curry(_offset, true);

export { default as parseValue, toRem, toVw, toVh } from './modules/parse-value.js';
export { default as prefix } from './modules/prefix.js';

import _style from './modules/style.js';
export const style = curry(_style, true);

// Fragments

export * from './modules/fragments.js';

// Events

export { default as Event } from './modules/event.js';

export { isPrimaryButton, isTargetEvent, preventDefault } from './modules/events.js';
export { default as match } from './modules/match.js';
export { on, off } from './modules/events.js';
import { default as _events } from './modules/events.js';
export const events = curry(_events, true);

export { default as gestures }  from './modules/gestures.js';
export { default as trigger }   from './modules/trigger.js';
export { default as delegate }  from './modules/delegate.js';
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
export { request, requestGet, requestPatch, requestPost, requestDelete, throttledRequest } from './modules/request.js';
