(function(window) {
    "use strict";

    var Fn  = window.Fn;
    var get = Fn.get;

    dom
    .events('change', document)
    .map(fn.get('target'))
    .filter(dom.matches('.location-select'))
    .map(get('value'))
    .each(function(value) {
        window.location = value;
    });
})(this);
