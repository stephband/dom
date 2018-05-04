import { requestTick, Stream } from '../../fn/fn.js';
import { default as dom, delegate, identity, events } from './dom.js';
import Sparky from '../../sparky/sparky.js';

(function(window) {
	"use strict";

	var debug  = true;
	var on     = events.on;
	var off    = events.off;

	function dragstartButton(e) {
		var data = {
			"Text":             identify(e.target),
			"text/plain":       identify(e.target),
			//"application/json": JSON.stringify({})
		};

		var mimetype;

		// Wait for the next frame before setting the dragged flag. The dragged
		// flag is pretty much purely for style, and if it is styled immediately
		// the dragged icon also gets teh ghosted style, which we don't want.
		//window.requestAnimationFrame(function() {
		//
		//});

		for (mimetype in data){
			// IE only accepts the types "URL" and "Text". Other types throw errors.
			try {
				e.dataTransfer.setData(mimetype, data[mimetype]);
			}
			catch(e) {
				if (debug) { console.warn('[drag data] mimetype: ' + mimetype + ' Can\'t be set.'); }
			}
		}
	}

	function dragendButton(e) {
		jQuery('.dropzone').remove();
		jQuery('.dragover').removeClass('dragover');
	}

	Sparky.fn['data-on-drag'] = function(node, scopes, params) {
		var name = params[0];
		var dragstart = delegate('[draggable]', dragstartButton);
		var dragend   = delegate('[draggable]', dragendButton);

		//.on('selectstart', '.node-button', cache, selectstartIE9)
		on(node, 'dragstart', dragstart);
		//.on('drag', '.node-button', cache, dragButton)
		on(node, 'dragend', dragend);

		this.then(function() {
			off(node, 'dragstart', dragstart);
			off(node, 'dragend', dragend);
		});
	};
})(window);
