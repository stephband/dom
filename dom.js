if (window.console && window.console.log) {
    console.log('dom         – https://github.com/stephband/dom');
}

import dom from './js/dom.js';
export default dom;
window.dom = dom;

// Lifecycle

export const ready                  = dom.ready;
export const now                    = dom.now;

// HTML

export const escape                 = dom.escape;
export const parse                  = dom.parse;

// Inspect

export const attribute              = dom.attribute;
export const children               = dom.children;
export const closest                = dom.closest;
export const contains               = dom.contains;
export const find                   = dom.find;
export const get                    = dom.get;
export const matches                = dom.matches;
export const next                   = dom.next;
export const previous               = dom.previous;
export const query                  = dom.query;
export const tag                    = dom.tag;
export const type                   = dom.type;
export const isElementNode          = dom.isElementNode;
export const isTextNode             = dom.isTextNode;
export const isCommentNode          = dom.isCommentNode;
export const isFragmentNode         = dom.isFragmentNode;
export const isInternalLink         = dom.isInternalLink;
export const isValid                = dom.isValid;

// Mutate

export const assign                 = dom.assign;
export const create                 = dom.create;
export const clone                  = dom.clone;
export const identify               = dom.identify;
export const append                 = dom.append;
export const before                 = dom.before;
export const after                  = dom.after;
export const replace                = dom.replace;
export const empty                  = dom.empty;
export const remove                 = dom.remove;

// Style

export const box                    = dom.box;
export const bounds                 = dom.bounds;
export const offset                 = dom.offset;
export const style                  = dom.style;
export const classes                = dom.classes;
export const addClass               = dom.addClass;
export const removeClass            = dom.removeClass;
export const flashClass             = dom.flashClass;

export const toPx                   = dom.toPx;
export const toRem                  = dom.toRem;
export const toVw                   = dom.toVw;
export const toVh                   = dom.toVh;

// Fragments

export const fragmentFromTemplate   = dom.fragmentFromTemplate;
export const fragmentFromChildren   = dom.fragmentFromChildren;
export const fragmentFromHTML       = dom.fragmentFromHTML;
export const fragmentFromId         = dom.fragmentFromId;

// Events

export const Event                  = dom.Event;
export const events                 = dom.events;
export const trigger                = dom.trigger;
export const delegate               = dom.delegate;
export const isPrimaryButton        = dom.isPrimaryButton;
export const isTargetEvent          = dom.isTargetEvent;
export const preventDefault         = dom.preventDefault;
export const toKey                  = dom.toKey;
export const trapFocus              = dom.trapFocus;
export const requestEvent           = dom.requestEvent;

// Animation

export const animate                = dom.animate;
export const fullscreen             = dom.fullscreen;
export const transition             = dom.transition;
export const validate               = dom.validate;
export const requestFrame           = dom.requestFrame;

// Scroll

export const animateScroll          = dom.animateScroll;
export const scrollRatio            = dom.scrollRatio;
export const disableScroll          = dom.disableScroll;
export const enableScroll           = dom.enableScroll;
