
/*
media(query, enterFn, exitFn)

Evaluates `query` object, which is an object describing a media and scroll
query, against the document, and calls `enterFn` when all conditions in
the selector object become true, and `exitFn` when at least one of them becomes
false.

A query object may contain any combination of the properties:

```js
{
    minWidth: number | string | fn,
    maxWidth: number | string | fn,
    minHeight: number | string | fn,
    maxHeight: number | string | fn,
    minScrollTop: number | string | fn,
    maxScrollTop: number | string | fn,
    minScrollBottom: number | string | fn,
    maxScrollBottom: number | string | fn
}
```

For each property, a number represents a value in pixels, a string must be
a value with CSS units (eg. '3rem'), and a function must return a number
representing a value in pixels.
*/

import ready from './ready.js';
import { call, id, overload, toType } from '../../fn/module.js';
import { toPx } from './values.js';

const rules = [];
const rem = /(\d*\.?\d+)r?em/;
const rpercent = /(\d*\.?\d+)%/;

const types = overload(toType, {
    'number':   id,
    'string':   toPx,
    'function': function(fn) { return fn(); }
});

const tests = {
    minWidth: function(value)  { return width >= types(value); },
    maxWidth: function(value)  { return width <  types(value); },
    minHeight: function(value) { return height >= types(value); },
    maxHeight: function(value) { return height <  types(value); },
    minScrollTop: function(value) { return scrollTop >= types(value); },
    maxScrollTop: function(value) { return scrollTop <  types(value); },
    minScrollBottom: function(value) { return (scrollHeight - height - scrollTop) >= types(value); },
    maxScrollBottom: function(value) { return (scrollHeight - height - scrollTop) <  types(value); }
};

let width = window.innerWidth;
let height = window.innerHeight;
let scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
let scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;

function test(query) {
    var keys = Object.keys(query);
    var n = keys.length;
    var key;

    if (keys.length === 0) { return false; }

    while (n--) {
        key = keys[n];
        if (!tests[key](query[key])) { return false; }
    }

    return true;
}

function update(e) {
    var l = rules.length;
    var rule;

    // Run exiting rules
    while (l--) {
        rule = rules[l];

        if (rule.state && !test(rule.query)) {
            rule.state = false;
            rule.exit && rule.exit(e);
        }
    }

    l = rules.length;

    // Run entering rules
    while (l--) {
        rule = rules[l];

        if (!rule.state && test(rule.query)) {
            rule.state = true;
            rule.enter && rule.enter(e);
        }
    }
}

export default function media(query, fn1, fn2) {
    var rule = {};

    rule.query = query;
    rule.enter = fn1;
    rule.exit = fn2;
    rules.push(rule);

    return query;
}

function scroll(e) {
    scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    update(e);
}

function resize(e) {
    width = window.innerWidth;
    height = window.innerHeight;
    scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
    update(e);
}

window.addEventListener('scroll', scroll)
window.addEventListener('resize', resize);

ready(update)
document.addEventListener('DOMContentLoaded', update);
