
import ready from './ready.js';
import { toPx } from './units.js';

const rules = [];
const rem = /(\d*\.?\d+)r?em/;
const rpercent = /(\d*\.?\d+)%/;

const types = {
    number: function(n) { return n; },

    function: function(fn) { return fn(); },

    string: toPx
};

const tests = {
    minWidth: function(value)  { return width >= types[typeof value](value); },
    maxWidth: function(value)  { return width <  types[typeof value](value); },
    minHeight: function(value) { return height >= types[typeof value](value); },
    maxHeight: function(value) { return height <  types[typeof value](value); },
    minScrollTop: function(value) { return scrollTop >= types[typeof value](value); },
    maxScrollTop: function(value) { return scrollTop <  types[typeof value](value); },
    minScrollBottom: function(value) { return (scrollHeight - height - scrollTop) >= types[typeof value](value); },
    maxScrollBottom: function(value) { return (scrollHeight - height - scrollTop) <  types[typeof value](value); }
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

export default function breakpoint(query, fn1, fn2) {
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
