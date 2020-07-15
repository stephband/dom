/*
draggable

The native behaviour of the `draggable="true"`*
attribute is extended with the `draggable-mimetypes`
attribute, which defines data to be carried by a drag action:

```html
<div draggable="true" draggable-mimetypes="application/json: [0,1,2,3]">
    Drag me
</div>
```

<small>* Note that `draggable` must be `"true"`. It is not a boolean attribute.</small>
*/

import { parse } from '../../fn/module.js';
import { attribute, classes, delegate, events, identify, select, remove, removeClass, on, off } from '../module.js';
import { register } from '../../sparky/module.js';

var debug  = true;

//                 xxxxx: wef;
var rmimetype = /^([^:\s]+)\s*:\s*([^;\s]+);\s*/;

function lastIndex(data) {
	return data.index + data[0].length;
}

function dragstartButton(e) {
	var data = attribute('draggable-mimetypes', e.target);

	if (data) {
		data = parse(rmimetype, {
			1: function handleMime(data, results) {
				data[results[1]] = results[2];
				if ((lastIndex(results) + 2) < results.input.length) {
					parse(rmimetype, { 1: handleMime }, data, results);
				}
				return data;
			}
		}, {}, data);
	}
	else {
		// Todo: needed for Neho - factor out
		data = {
			"Text":       identify(e.target),
			"text/plain": identify(e.target)
			//"application/json": JSON.stringify({})
		};
	}

	var mimetype;

	for (mimetype in data){
		// IE only accepts the types "URL" and "Text". Other types throw errors.
		try {
			e.dataTransfer.setData(mimetype, data[mimetype]);
			e.dataTransfer.dropEffect = "none";
			e.dataTransfer.effectAllowed = "all";

			// Wait for the next frame before setting the dragging class. It's
			// for style, and if it is styled immediately the dragging ghost
			// also gets the new style, which we don't want.
			window.requestAnimationFrame(function() {
				classes(e.target).add('dragging');
			});
		}
		catch(e) {
			if (debug) { console.warn('[drag data] mimetype: ' + mimetype + ' Can\'t be set.'); }
		}
	}
}

var dragstart = delegate('[draggable]', dragstartButton);

function dragend(e) {
	classes(e.target).remove('dragging');
}

on(document, 'dragstart', dragstart);
on(document, 'dragend', dragend);


function dragendButton(e) {
	select('.dropzone', document).forEach(remove);
	select('.dragover', document).forEach(removeClass('dragover'));
}

register('data-on-drag', function(node, params) {
	var dragstart = delegate('[draggable]', dragstartButton);
	var dragend   = delegate('[draggable]', dragendButton);

	//.on('selectstart', '.node-button', cache, selectstartIE9)
	on(node, 'dragstart', dragstart);
	//.on('drag', '.node-button', cache, dragButton)
	on(node, 'dragend', dragend);

	this.done(function() {
		off(node, 'dragstart', dragstart);
		off(node, 'dragend', dragend);
	});
});
