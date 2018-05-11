(function(window) {
    "use strict";

    var dom = window.dom;
    var isTargetEvent = dom.isTargetEvent;

    Sparky.fn['mount-on-activate'] = function(node, scopes) {
        const sparky = this;
        sparky.interrupt();

        dom
        .events('dom-activate', node)
        .filter(isTargetEvent)
        .each(function(e) {
            this.stop();
            sparky.continue();
        });
    };
})(window);
