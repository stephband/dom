
/*
[submittable]

```html
<form submittable action="" method="">
</form>
```

Hijacks the submit event and submits the form via `fetch()`. Reads the form's
standard `enctype` attribute to set the mimetype of the request, but extends
it by permitting the value `"application/json"` as well as the standard
`"application/x-www-form-urlencoded"` and `"multipart/form-data"`.
*/

import { compose, get } from '../../fn/module.js';
import { events, matches, preventDefault, request } from '../module.js';

// Define

const match = matches('.submittable, [submittable]');


// Functions
events('submit', document)
.tap(function(value) {
    console.log(value);
})
.filter(compose(match, get('target')))
.tap(preventDefault)
.map(get('target'))
.each(function(form) {
	const method   = form.method;
	const url      = form.action || '';
    // Allow other values for enctype by reading the attribute first
	const mimetype = form.getAttribute('enctype') || form.enctype;
	const formData = new FormData(form);

	request(method, url, formData, mimetype)
	.then(function(data) {
		events.trigger(form, 'dom-submitted', {
			detail: data
		});
	})
	.catch(function(error) {
		events.trigger(form, 'dom-submit-error', {
			detail: error
		});
	});
});
