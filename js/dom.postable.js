// dom.postable

(function(window) {
    "use strict";

    var axios   = window.axios;
    var dom     = window.dom;
    var Fn      = window.Fn;
    var get     = Fn.get;

    // Define

    var matches = dom.matches('.postable, [postable]');

    function toSelector(str) {
		return '[name="' + str + '"]';
	}

    function flattenErrors(object) {
		var errors = [];

		// Flatten errors into a list
		for (name in object) {
			errors.push.apply(errors,
				object[name].map(function(text) {
					return {
						name: name,
						text: text,
                        selector: toSelector(name)
					};
				})
			);
		}

		return errors;
	}

    // Functions
    dom.events('submit', document)
        .filter(function(event){
            return matches(event.target);
        })
        .tap(dom.preventDefault)
        .map(get('target'))
        .each(function(form){
            var action = form.getAttribute('action');
            var post_data = new FormData(form);

            axios
            .post(action, post_data)
            .then(function(response){
                if(response.status < 300) {
                    dom.events.trigger(form, 'dom-posted', {detail: response.data});
                }
                else {
                    var error = new Error(response.statusText);
                    error.response = response;
                    dom.events.trigger(form, 'dom-error', {detail: error});

                    if (typeof response.errors === 'object') {

                        flattenErrors(response.errors)
                        .forEach(function(input) {
                            var input = dom.find(error.selector, form);

                            if (!input) {
                                console.warn('Error given for non-existent field name="' + error.name + '"', error);
                                return;
                            }

                            input.setCustomValidity(error.text);
                        });

                        form.checkValidity();
                    }
                }
            })
            .catch(function(error_response){
                dom.events.trigger(form, 'dom-error', {detail: error_response})
            });
        });

})(this);
