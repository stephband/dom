import { parse, requestTick, Stream } from '../../fn/module.js';
import { attribute, classes, delegate, events, identify, query, remove, removeClass } from '../module.js';
import Sparky from '../../sparky/module.js';

var debug  = true;
var on     = events.on;
var off    = events.off;
var rmimetype = /^([^:\s]+)\s*:\s*([^;\s]+);\s*/;

function lastIndex(data) {
	return data.index + data[0].length;
}

function dragstartButton(e) {
	var data = attribute('draggable-mimetypes', e.target);

	if (data) {
		data = parse(rmimetype, {
			1: function handleMime(data, mimetype, results) {
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
			"Text":             identify(e.target),
			"text/plain":       identify(e.target),
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
	query('.dropzone', document).forEach(remove);
	query('.dragover', document).forEach(removeClass('dragover'));
}

Sparky.fn['data-on-drag'] = function(node, scopes, params) {
	var dragstart = delegate('[draggable]', dragstartButton);
	var dragend   = delegate('[draggable]', dragendButton);

	//.on('selectstart', '.node-button', cache, selectstartIE9)
	on(node, 'dragstart', dragstart);
	//.on('drag', '.node-button', cache, dragButton)
	on(node, 'dragend', dragend);

	scopes.done(function() {
		off(node, 'dragstart', dragstart);
		off(node, 'dragend', dragend);
	});
};
