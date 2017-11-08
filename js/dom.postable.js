// dom.postable

(function(window) {
    "use strict";

    var dom     = window.dom;
    var Fn      = window.Fn;
    var get     = Fn.get;

    // Define

    var matches = dom.matches('.postable, [postable]');

    // Functions
    dom.event('submit', document)
        .filter(function(event){
            return matches(event.target);
        })
        .tap(dom.preventDefault)
        .map(get('target'))
        .each(function(node){
            var action = node.getAttribute('action');
            var data = new FormData(node);
            console.log(data);
            axios.post(action, data)
        });

})(this);
