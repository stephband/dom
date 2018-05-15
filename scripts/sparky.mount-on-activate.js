
import { events, isTargetEvent } from '/static/dom/dom.js';
import Sparky from '/static/sparky/sparky.js';

Sparky.fn['mount-on-activate'] = function(node, scopes) {
    const sparky = this;
    sparky.interrupt();

    events('dom-activate', node)
    .filter(isTargetEvent)
    .each(function(e) {
        this.stop();
        sparky.continue();
    });
};
