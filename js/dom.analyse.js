(function(window) {
    "use strict";

    var Fn      = window.Fn;
    var dom     = window.dom;

    var rspaces = Fn.rspaces;

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
    .map(Fn.get('target'))
    .map(dom.closest('[data-analyse]'))
    .each(function(node) {
        var property = dom.attribute('data-analyse', node);
        var labels   = property.split(rspaces).map(dashesToSpaces);
        analyse.apply(null, labels);
    });
})(this);
