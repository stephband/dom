import { get } from '../../fn/fn.js';
import { closest, attribute } from '../dom.js';

const rspaces = /\s+/;

(function(window) {
    "use strict";

    function analyse(category, action, label, value) {
        window.ga && window.ga('send', 'event', category, action, label, value);
    }

    function analyseTime(category, action, label, time) {
        // Time should be an integer, in milliseconds
        time = Math.round(time || window.performance.now());
        window.ga && window.ga('send', 'timing', category, action, time, label);
    }

    function dashesToSpaces(string) {
        return string.replace('-', ' ');
    }

    dom
    .events('change', document)
    .map(get('target'))
    .map(closest('[data-analyse]'))
    .each(function(node) {
        var property = attribute('data-analyse', node);
        var labels   = property.split(rspaces).map(dashesToSpaces);
        analyse.apply(null, labels);
    });
})(window);
