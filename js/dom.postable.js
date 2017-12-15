// dom.postable

(function(window) {
    "use strict";

    var axios   = window.axios;
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
            var post_data = new FormData(node);

            axios
            .post(action, post_data)
            .then(function(response){
                if(response.status < 300) {
                    dom.events.trigger(node, 'dom-posted', {detail: response.data});
                }
                else {
                    var error = new Error(response.statusText);
                    error.response = response;
                    dom.events.trigger(node, 'dom-error', {detail: error})
                }
            })
            .catch(function(error_response){
                dom.events.trigger(node, 'dom-error', {detail: error_response})
            });
        });

})(this);
